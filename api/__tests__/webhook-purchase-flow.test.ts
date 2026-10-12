import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Testes de auditoria — fluxo de compra (webhook Wiven → token → e-mail).
// Complementa webhook.test.ts (autenticação e rate limit).
// `it.fails` marca um bug confirmado: o teste descreve o comportamento correto
// e hoje falha. Ao corrigir o bug, troque `it.fails` por `it`.

const insert = vi.fn()
const existingByOrder = vi.fn()
const sendMock = vi.fn()
const update = vi.fn()
const updateEq = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: existingByOrder }) }),
      insert,
      update: (values: unknown) => { update(values); return { eq: updateEq } },
    }),
  }),
}))

// Classe (e não vi.fn) para sobreviver ao vi.restoreAllMocks() do afterEach
vi.mock('resend', () => ({
  Resend: class { emails = { send: sendMock } },
}))

const SECRET = 'super-secret-value'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function paid(overrides: Record<string, unknown> = {}) {
  return {
    event: 'TRANSACTION_PAID',
    token: SECRET,
    client: { email: 'buyer@example.com', name: 'Maria Silva' },
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

  beforeEach(async () => {
    vi.resetModules()
    process.env.WIVEN_WEBHOOK_SECRET = SECRET
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    insert.mockReset().mockResolvedValue({ error: null })
    existingByOrder.mockReset().mockResolvedValue({ data: null, error: null })
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    update.mockReset()
    updateEq.mockReset().mockResolvedValue({ error: null })
    delete process.env.WIVEN_REVOKE_EVENTS
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ default: handler } = await import('../webhook'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.WIVEN_WEBHOOK_SECRET
  })

  it('creates a random UUID v4 access token and e-mails it to the buyer', async () => {
    const res = makeRes()
    await handler(makeReq(paid()), res)
    expect(res.statusCode).toBe(200)

    const row = insert.mock.calls[0][0]
    expect(row.token).toMatch(UUID_V4)
    expect(row).toMatchObject({ email: 'buyer@example.com', order_id: 'tx-1', active: true })

    const mail = sendMock.mock.calls[0][0]
    expect(mail.to).toBe('buyer@example.com')
    expect(mail.html).toContain(row.token)
  })

  it('never puts the access token in a URL inside the e-mail', async () => {
    await handler(makeReq(paid()), makeRes())
    const { token } = insert.mock.calls[0][0]
    const { html } = sendMock.mock.calls[0][0]
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m: RegExpMatchArray) => m[1])
    expect(hrefs.some((h: string) => h.includes(token))).toBe(false)
  })

  it('HTML-escapes the buyer name in the e-mail', async () => {
    await handler(makeReq(paid({ client: { email: 'buyer@example.com', name: '<img/src=x onerror=alert(1)> Silva' } })), makeRes())
    const { html } = sendMock.mock.calls[0][0]
    expect(html).not.toContain('<img/src=x')
    expect(html).toContain('&lt;img/src=x')
  })

  it('does not issue a second token for the same transaction (resends the existing one)', async () => {
    existingByOrder.mockResolvedValue({ data: { token: 'existing-token' }, error: null })
    const res = makeRes()
    await handler(makeReq(paid()), res)
    expect(res.body).toEqual({ success: true, duplicate: true })
    expect(insert).not.toHaveBeenCalled()
    expect(sendMock.mock.calls[0][0].html).toContain('existing-token')
  })

  it('ignores events other than TRANSACTION_PAID without writing anything', async () => {
    const res = makeRes()
    await handler(makeReq(paid({ event: 'TRANSACTION_CREATED' })), res)
    expect(res.statusCode).toBe(200)
    expect(insert).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the buyer e-mail is missing', async () => {
    const res = makeRes()
    await handler(makeReq(paid({ client: { name: 'Sem Email' } })), res)
    expect(res.statusCode).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns 415 for a non-JSON content type', async () => {
    const res = makeRes()
    await handler(makeReq('x', { 'content-type': 'text/plain' }), res)
    expect(res.statusCode).toBe(415)
  })

  it('returns 500 (so the gateway retries) and sends no e-mail when the token cannot be saved', async () => {
    insert.mockResolvedValue({ error: { message: 'connection refused' } })
    const res = makeRes()
    await handler(makeReq(paid()), res)
    expect(res.statusCode).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('connection refused')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('logs the failure and answers 502 (so the gateway retries) when Resend throws', async () => {
    sendMock.mockRejectedValue(new Error('network down'))
    const res = makeRes()
    await handler(makeReq(paid()), res)
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
    const res = makeRes()
    await handler(makeReq(paid()), res)
    expect(res.statusCode).toBe(502)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('answers 502 when the resend of an already-processed transaction fails', async () => {
    existingByOrder.mockResolvedValue({ data: { token: 'existing-token' }, error: null })
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'x' } })
    const res = makeRes()
    await handler(makeReq(paid()), res)
    expect(res.statusCode).toBe(502)
    expect(insert).not.toHaveBeenCalled()
  })

  it('never writes the buyer e-mail to the logs when delivery fails', async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'x' } })
    await handler(makeReq(paid()), makeRes())
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('buyer@example.com')
  })

  // ── Reembolso / chargeback ──────────────────────────────────────────────────
  describe('revocation events (WIVEN_REVOKE_EVENTS)', () => {
    it('deactivates the token of the refunded transaction', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO, EVENTO_CHARGEBACK'
      const res = makeRes()
      await handler(makeReq(paid({ event: 'EVENTO_CHARGEBACK' })), res)
      expect(res.body).toEqual({ success: true, action: 'revoked' })
      expect(update).toHaveBeenCalledWith({ active: false })
      expect(updateEq).toHaveBeenCalledWith('order_id', 'tx-1')
      expect(insert).not.toHaveBeenCalled()
      expect(sendMock).not.toHaveBeenCalled()
    })

    it('requires the webhook secret like any other event', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      const res = makeRes()
      await handler(makeReq(paid({ event: 'EVENTO_REEMBOLSO', token: 'errado' })), res)
      expect(res.statusCode).toBe(401)
      expect(update).not.toHaveBeenCalled()
    })

    it('refuses to revoke without a transaction id (would match nothing or everything)', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      const res = makeRes()
      await handler(makeReq(paid({ event: 'EVENTO_REEMBOLSO', transaction: {} })), res)
      expect(res.statusCode).toBe(400)
      expect(update).not.toHaveBeenCalled()
    })

    it('answers 500 so the gateway retries when the revocation cannot be saved', async () => {
      process.env.WIVEN_REVOKE_EVENTS = 'EVENTO_REEMBOLSO'
      updateEq.mockResolvedValue({ error: { message: 'timeout' } })
      const res = makeRes()
      await handler(makeReq(paid({ event: 'EVENTO_REEMBOLSO' })), res)
      expect(res.statusCode).toBe(500)
    })

    it('revokes nothing when the variable is not configured', async () => {
      const res = makeRes()
      await handler(makeReq(paid({ event: 'EVENTO_REEMBOLSO' })), res)
      expect(res.statusCode).toBe(200)
      expect(update).not.toHaveBeenCalled()
    })

    it('never treats TRANSACTION_PAID as a revocation, even if misconfigured', async () => {
      process.env.WIVEN_REVOKE_EVENTS = ''
      await handler(makeReq(paid()), makeRes())
      expect(update).not.toHaveBeenCalled()
      expect(insert).toHaveBeenCalled()
    })
  })

  // ── Corrida entre duas entregas do mesmo pedido ─────────────────────────────
  it('resends the already-saved token when the UNIQUE(order_id) constraint rejects a simultaneous insert', async () => {
    // 1ª consulta: ainda não existe; insert perde a corrida; 2ª consulta: achou o vencedor
    existingByOrder
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { token: 'token-vencedor' }, error: null })
    insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key value violates unique constraint' } })
    const res = makeRes()
    await handler(makeReq(paid()), res)
    expect(res.body).toEqual({ success: true, duplicate: true })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock.mock.calls[0][0].html).toContain('token-vencedor')
  })
})
