import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createFakeBillingDb, type FakeBillingDb } from './fakeBillingDb'

// Fluxo de compra (webhook Wiven → token → e-mail), com idempotência.
// Complementa webhook.test.ts (autenticação e rate limit). O banco é a
// imitação de fakeBillingDb.ts; as funções SQL de verdade são testadas contra
// um Postgres real em supabase/tests/run-billing-tests.sh.

let db: FakeBillingDb
const sendMock = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({ rpc: (fn: string, args: Record<string, unknown>) => db.rpc(fn, args) }),
}))

// Classe (e não vi.fn) para sobreviver ao vi.restoreAllMocks() do afterEach
vi.mock('resend', () => ({
  Resend: class { emails = { send: sendMock } },
}))

const SECRET = 'super-secret-value'

function paid(overrides: Record<string, unknown> = {}) {
  return {
    event: 'TRANSACTION_PAID',
    token: SECRET,
    client: { email: 'buyer@example.com', name: 'Maria Silva', cpf: '123.456.789-00', phone: '+5511999999999' },
    transaction: { id: 'tx-1' },
    ...overrides,
  }
}

function makeReq(body: unknown, headers: Record<string, string> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9', ...headers },
    body,
  } as unknown as VercelRequest
}

type MockRes = VercelResponse & { statusCode?: number; body?: unknown; headers: Record<string, string> }

function makeRes(): MockRes {
  const res = { headers: {} } as MockRes
  res.status    = vi.fn((code: number) => { res.statusCode = code; return res }) as unknown as MockRes['status']
  res.json      = vi.fn((data: unknown) => { res.body = data; return res }) as unknown as MockRes['json']
  res.end       = vi.fn(() => res) as unknown as MockRes['end']
  res.setHeader = vi.fn((k: string, v: string) => { res.headers[k] = v; return res }) as unknown as MockRes['setHeader']
  return res
}

describe('api/webhook — purchase flow', () => {
  let handler: typeof import('../webhook').default
  let errorSpy: MockInstance

  async function deliver(body: unknown) {
    const res = makeRes()
    await handler(makeReq(body), res)
    return res
  }

  beforeEach(async () => {
    vi.resetModules()
    db = createFakeBillingDb()
    process.env.WIVEN_WEBHOOK_SECRET = SECRET
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    delete process.env.WIVEN_REVOKE_EVENTS
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ default: handler } = await import('../webhook'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.WIVEN_WEBHOOK_SECRET
  })

  it('issues an access token and e-mails it to the buyer', async () => {
    const res = await deliver(paid())
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ success: true })
    expect(db.tokens).toHaveLength(1)
    expect(db.tokens[0]).toMatchObject({ email: 'buyer@example.com', order_id: 'tx-1', active: true })

    expect(sendMock).toHaveBeenCalledTimes(1)
    const [mail] = sendMock.mock.calls[0]
    expect(mail.to).toBe('buyer@example.com')
    expect(mail.html).toContain(db.tokens[0].token)
  })

  it('sends the e-mail with the idempotency key stored for it (Resend Idempotency-Key)', async () => {
    await deliver(paid())
    const [, options] = sendMock.mock.calls[0]
    const stored = [...db.outbox.values()][0]
    expect(options).toEqual({ idempotencyKey: stored.idempotency_key })
    expect(stored.status).toBe('sent')
    expect(stored.provider_id).toBe('email-1')
  })

  it('sends only what the database needs: no CPF, phone or webhook secret', async () => {
    await deliver(paid())
    const sent = JSON.stringify(db.calls.find(c => c.fn === 'billing_apply_event')?.args)
    expect(sent).not.toContain('123.456.789-00')
    expect(sent).not.toContain('+5511999999999')
    expect(sent).not.toContain(SECRET)
    expect(sent).toContain('"event_key":"TRANSACTION_PAID:tx-1"')
  })

  it('never puts the access token in a URL inside the e-mail', async () => {
    await deliver(paid())
    const { token } = db.tokens[0]
    const { html } = sendMock.mock.calls[0][0]
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m: RegExpMatchArray) => m[1])
    expect(hrefs.some((h: string) => h.includes(token))).toBe(false)
  })

  it('HTML-escapes the buyer name in the e-mail', async () => {
    await deliver(paid({ client: { email: 'buyer@example.com', name: '<img/src=x onerror=alert(1)> Silva' } }))
    const { html } = sendMock.mock.calls[0][0]
    expect(html).not.toContain('<img/src=x')
    expect(html).toContain('&lt;img/src=x')
  })

  // ── Teste 1: webhook duplicado ──────────────────────────────────────────────
  it('Teste 1: the same webhook twice issues one token and sends one e-mail', async () => {
    const first = await deliver(paid())
    const second = await deliver(paid())
    expect(first.body).toEqual({ success: true })
    expect(second.statusCode).toBe(200)
    expect(second.body).toEqual({ success: true, duplicate: true })
    expect(db.tokens).toHaveLength(1)
    expect(db.events.size).toBe(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  // ── Teste 2 (simulado; a concorrência real é testada no Postgres) ───────────
  it('Teste 2: two simultaneous deliveries of the same webhook send one e-mail', async () => {
    let release!: () => void
    sendMock.mockImplementationOnce(() => new Promise(r => { release = () => r({ data: { id: 'email-1' }, error: null }) }))
    const a = deliver(paid())
    // espera a 1ª chegar ao envio do e-mail
    await vi.waitFor(() => expect(sendMock).toHaveBeenCalledTimes(1))
    const b = await deliver(paid())
    release()
    const first = await a
    expect(first.body).toEqual({ success: true })
    expect(b.statusCode).toBe(200)
    expect(b.body).toEqual({ success: true, duplicate: true })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(db.tokens).toHaveLength(1)
  })

  // ── Teste 3: falha durante o processamento ──────────────────────────────────
  it('Teste 3: a database failure answers 500, keeps the event for retry and sends nothing', async () => {
    db.failNextApply()
    const res = await deliver(paid())
    expect(res.statusCode).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('connection refused')
    expect(sendMock).not.toHaveBeenCalled()
    expect(db.tokens).toHaveLength(0)
    expect(db.events.get('TRANSACTION_PAID:tx-1')?.status).toBe('failed')

    // A Wiven reentrega: processa uma vez só
    const retry = await deliver(paid())
    expect(retry.body).toEqual({ success: true })
    const again = await deliver(paid())
    expect(again.body).toEqual({ success: true, duplicate: true })
    expect(db.tokens).toHaveLength(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('Teste 3: when the e-mail fails, answers 502 and the redelivery sends it once, with the same key', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { name: 'application_error', message: 'try later' } })
    const first = await deliver(paid())
    expect(first.statusCode).toBe(502)
    expect(db.tokens).toHaveLength(1)

    const retry = await deliver(paid())
    expect(retry.statusCode).toBe(200)
    expect(retry.body).toEqual({ success: true, duplicate: true })
    const third = await deliver(paid())
    expect(third.statusCode).toBe(200)

    expect(db.tokens).toHaveLength(1)
    expect(sendMock).toHaveBeenCalledTimes(2) // a falha + o envio que deu certo
    expect(sendMock.mock.calls[0][1]).toEqual(sendMock.mock.calls[1][1])
  })

  it('logs the failure and answers 502 (so the gateway retries) when Resend throws', async () => {
    sendMock.mockRejectedValue(new Error('network down'))
    const res = await deliver(paid())
    expect(res.statusCode).toBe(502)
    expect(errorSpy).toHaveBeenCalled()
  })

  // O SDK do Resend (v6) NÃO lança exceção em erro de API — devolve
  // { data: null, error }. Um domínio não verificado não pode passar como "enviado".
  it('detects a Resend API error returned as { data: null, error } (no exception)', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { statusCode: 403, name: 'validation_error', message: 'The domain is not verified.' },
    })
    const res = await deliver(paid())
    expect(res.statusCode).toBe(502)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('never writes the buyer e-mail to the logs when delivery fails', async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'x' } })
    await deliver(paid())
    db.failNextApply()
    await deliver(paid({ transaction: { id: 'tx-2' } }))
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('buyer@example.com')
  })

  it('without a transaction id, an identical redelivery does not issue a second token', async () => {
    await deliver(paid({ transaction: {} }))
    // mesma entrega, chaves em outra ordem
    const { client, event, token } = paid()
    const again = await deliver({ client, transaction: {}, token, event })
    expect(again.body).toEqual({ success: true, duplicate: true })
    expect(db.tokens).toHaveLength(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('ignores events other than TRANSACTION_PAID without writing anything', async () => {
    const res = await deliver(paid({ event: 'TRANSACTION_CREATED' }))
    expect(res.statusCode).toBe(200)
    expect(db.calls).toHaveLength(0)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the buyer e-mail is missing', async () => {
    const res = await deliver(paid({ client: { name: 'Sem Email' } }))
    expect(res.statusCode).toBe(400)
    expect(db.calls).toHaveLength(0)
  })

  it('returns 415 for a non-JSON content type', async () => {
    const res = makeRes()
    await handler(makeReq('x', { 'content-type': 'text/plain' }), res)
    expect(res.statusCode).toBe(415)
  })

  // ── Reembolso / chargeback ──────────────────────────────────────────────────
  describe('revocation events (WIVEN_REVOKE_EVENTS)', () => {
    it('deactivates the token of the refunded transaction', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO, EVENTO_CHARGEBACK'
      await deliver(paid())
      const res = await deliver(paid({ event: 'EVENTO_CHARGEBACK' }))
      expect(res.body).toEqual({ success: true, action: 'revoked' })
      expect(db.tokens[0].active).toBe(false)
      expect(sendMock).toHaveBeenCalledTimes(1) // só o e-mail da compra
    })

    it('Teste 10: a repeated refund has a single effect', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      await deliver(paid())
      const first = await deliver(paid({ event: 'EVENTO_REEMBOLSO' }))
      const second = await deliver(paid({ event: 'EVENTO_REEMBOLSO' }))
      expect(first.body).toEqual({ success: true, action: 'revoked' })
      expect(second.body).toEqual({ success: true, action: 'revoked', duplicate: true })
      expect(db.txs.get('tx-1')).toBe('revoked')
      expect(db.events.size).toBe(2)
    })

    it('Teste 9: a payment that arrives after its refund does not grant access', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      await deliver(paid({ event: 'EVENTO_REEMBOLSO' }))
      const res = await deliver(paid())
      expect(res.statusCode).toBe(200) // a Wiven não reentrega
      expect(res.body).toEqual({ received: true, action: 'ignored — transaction revoked' })
      expect(db.tokens).toHaveLength(0)
      expect(sendMock).not.toHaveBeenCalled()
    })

    it('does not send the access e-mail that was still pending when the refund arrived', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      sendMock.mockResolvedValueOnce({ data: null, error: { name: 'application_error', message: 'try later' } })
      expect((await deliver(paid())).statusCode).toBe(502)
      await deliver(paid({ event: 'EVENTO_REEMBOLSO' }))
      await deliver(paid()) // reentrega da compra
      expect(sendMock).toHaveBeenCalledTimes(1) // só a tentativa que falhou
      expect([...db.outbox.values()][0].status).toBe('canceled')
    })

    it('requires the webhook secret like any other event', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      const res = await deliver(paid({ event: 'EVENTO_REEMBOLSO', token: 'errado' }))
      expect(res.statusCode).toBe(401)
      expect(db.calls).toHaveLength(0)
    })

    it('refuses to revoke without a transaction id (would match nothing or everything)', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      const res = await deliver(paid({ event: 'EVENTO_REEMBOLSO', transaction: {} }))
      expect(res.statusCode).toBe(400)
      expect(db.calls).toHaveLength(0)
    })

    it('answers 500 so the gateway retries when the revocation cannot be saved', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      db.failNextApply()
      const res = await deliver(paid({ event: 'EVENTO_REEMBOLSO' }))
      expect(res.statusCode).toBe(500)
      expect(db.events.get('EVENTO_REEMBOLSO:tx-1')?.status).toBe('failed')
    })

    it('revokes nothing when the variable is not configured', async () => {
      const res = await deliver(paid({ event: 'EVENTO_REEMBOLSO' }))
      expect(res.statusCode).toBe(200)
      expect(db.calls).toHaveLength(0)
    })

    it('never treats TRANSACTION_PAID as a revocation, even if misconfigured', async () => {
      // Incluído por engano na lista: toda compra seria "revogada" e o
      // comprador ficaria sem acesso
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO, TRANSACTION_PAID'
      const res = await deliver(paid())
      expect(res.body).toEqual({ success: true })
      expect(db.tokens[0].active).toBe(true)
    })
  })

  // ── Produto da venda (WIVEN_PRODUCT_IDS) ────────────────────────────────────
  describe('product allowlist (WIVEN_PRODUCT_IDS)', () => {
    afterEach(() => { delete process.env.WIVEN_PRODUCT_IDS })

    it('does not issue access for a paid sale of another product of the account', async () => {
      process.env.WIVEN_PRODUCT_IDS = 'prod-minhatize'
      const res = await deliver(paid({ offerCode: 'oferta-outro', orderItems: [{ product: { id: 'prod-outro' } }] }))
      expect(res.statusCode).toBe(200) // 200: a Wiven não reentrega
      expect(res.body).toEqual({ received: true, action: 'ignored — product not allowed' })
      expect(db.calls).toHaveLength(0)
      expect(sendMock).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalled() // configuração errada não passa em silêncio
    })

    it('does not issue access when the sale names no product at all', async () => {
      process.env.WIVEN_PRODUCT_IDS = 'prod-minhatize'
      await deliver(paid({ orderItems: 'prod-minhatize' }))
      expect(db.tokens).toHaveLength(0)
    })

    it('issues access when a product id or the offer code is on the list', async () => {
      process.env.WIVEN_PRODUCT_IDS = 'oferta-a, prod-minhatize'
      await deliver(paid({ orderItems: [{ product: { id: 'prod-minhatize' } }] }))
      await deliver(paid({ transaction: { id: 'tx-2' }, offerCode: 'oferta-a' }))
      expect(db.tokens).toHaveLength(2)
    })

    it('keeps the previous behaviour (every paid sale) when the variable is not set', async () => {
      await deliver(paid({ offerCode: 'qualquer' }))
      expect(db.tokens).toHaveLength(1)
    })
  })
})
