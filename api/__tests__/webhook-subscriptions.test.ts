import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Webhook — roteamento das assinaturas. Os payloads seguem os exemplos da
// documentação da Wiven (27/11/2026). A regra de acesso (períodos, ordem,
// estorno, reassinatura) é testada contra um Postgres real em
// supabase/tests/subscriptions.test.sql; aqui conferimos o evento canônico que
// chega ao banco e as respostas HTTP.

const rpc = vi.fn()
const sendMock = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({ getSupabaseAdmin: () => ({ rpc }) }))
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock } } }))

const SECRET = 'super-secret-value'
const SUB_PRODUCT = 'cmwlix69p08sn01oei0ec4066'
const LEGACY_PRODUCT = 'cmqd6k3cc0k4b01pt6hrsjmyh'

let applyResult: Record<string, unknown>

function subscriptionStarted(overrides: Record<string, unknown> = {}) {
  return {
    event: 'SUBSCRIPTION_STARTED', version: 1, occurredAt: '2026-11-27T16:12:18.288Z', token: SECRET,
    subscription: {
      id: 'sub-1', identifier: 'sub-mi52pz3i', status: 'ACTIVE', previousStatus: null,
      startAt: '2026-11-27T16:12:18.288Z', nextChargeAt: '2026-12-27T16:12:18.288Z',
      intervalType: 'MONTHS', intervalCount: 1, cycle: 1, renewalUrl: null, trialEndsAt: null,
    },
    client: { id: 'cli-1', name: 'Maria Silva', email: 'maria@example.com', phone: '+5511999999999' },
    order: { id: 'ord-1', externalId: null },
    items: [{ id: 'it-1', price: 19.9, product: { id: SUB_PRODUCT, name: 'APP MINHA TIZE' } }],
    transaction: { id: 'tx-1', status: 'COMPLETED', paymentMethod: 'PIX', createdAt: '2026-11-27T16:12:18.288Z', payedAt: '2026-11-27T16:12:18.288Z' },
    reason: null,
    ...overrides,
  }
}

function transactionPaidForSubscription(overrides: Record<string, unknown> = {}) {
  return {
    event: 'TRANSACTION_PAID', token: SECRET, offerCode: 'R0J641X',
    client: { id: 'cli-1', name: 'Maria Silva', email: 'maria@example.com', cpf: '123.456.789-00' },
    transaction: { id: 'tx-1', status: 'COMPLETED', paymentMethod: 'CREDIT_CARD', createdAt: '2026-11-27T16:10:00.000Z', payedAt: '2026-11-27T16:12:18.288Z' },
    subscription: { id: 'sub-1', identifier: 'sub-mi52pz3i', cycle: 1, startAt: '2026-11-27T16:12:18.288Z', intervalType: 'MONTHS', intervalCount: 1, status: 'ACTIVE' },
    orderItems: [{ id: 'it-1', price: 19.9, product: { id: SUB_PRODUCT, name: 'APP MINHA TIZE' } }],
    ...overrides,
  }
}

function statusEvent(event: string, overrides: Record<string, unknown> = {}) {
  return {
    event, version: 1, occurredAt: '2027-01-02T10:00:00.000Z', token: SECRET,
    subscription: { id: 'sub-1', status: 'INACTIVE', nextChargeAt: '2026-12-27T16:12:18.288Z', intervalType: 'MONTHS', intervalCount: 3, cycle: 2 },
    client: { id: 'cli-1', name: 'Maria Silva', email: 'maria@example.com' },
    items: [{ id: 'it-1', price: 49.9, product: { id: SUB_PRODUCT, name: 'APP MINHA TIZE' } }],
    transaction: null,
    reason: { code: 'SUBSCRIPTION_NOT_RENEWED', origin: 'SYSTEM' },
    ...overrides,
  }
}

function makeReq(body: unknown): VercelRequest {
  return { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' }, body } as unknown as VercelRequest
}

type MockRes = VercelResponse & { statusCode?: number; body?: unknown }
function makeRes(): MockRes {
  const res = {} as MockRes
  res.status    = vi.fn((c: number) => { res.statusCode = c; return res }) as unknown as MockRes['status']
  res.json      = vi.fn((d: unknown) => { res.body = d; return res }) as unknown as MockRes['json']
  res.end       = vi.fn(() => res) as unknown as MockRes['end']
  res.setHeader = vi.fn(() => res) as unknown as MockRes['setHeader']
  return res
}

const applied = () => rpc.mock.calls.filter(([fn]) => fn === 'billing_apply_event').map(([, a]) => a.p_event)

describe('api/webhook — subscriptions', () => {
  let handler: typeof import('../webhook').default
  let errorSpy: MockInstance

  async function deliver(body: unknown) {
    const res = makeRes()
    await handler(makeReq(body), res)
    return res
  }

  beforeEach(async () => {
    vi.resetModules()
    process.env.WIVEN_WEBHOOK_SECRET = SECRET
    process.env.WIVEN_SUBSCRIPTION_PRODUCT_IDS = SUB_PRODUCT
    process.env.WIVEN_REVOKE_EVENTS = 'TRANSACTION_REFUNDED,TRANSACTION_CHARGED_BACK'
    delete process.env.WIVEN_PRODUCT_IDS
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    applyResult = { outcome: 'token_created', duplicate: false, token_id: 't-1', email_key: 'access_email:subscription:sub-1' }
    rpc.mockReset().mockImplementation(async (fn: string) => {
      if (fn === 'billing_apply_event') return { data: applyResult, error: null }
      if (fn === 'email_outbox_claim') {
        return { data: { outcome: 'claimed', outbox_id: 1, idempotency_key: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b', template: 'access_granted', token: 'aaaa', email: 'maria@example.com', name: 'Maria' }, error: null }
      }
      return { data: null, error: null }
    })
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ default: handler } = await import('../webhook'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    for (const k of ['WIVEN_WEBHOOK_SECRET', 'WIVEN_SUBSCRIPTION_PRODUCT_IDS', 'WIVEN_REVOKE_EVENTS', 'WIVEN_PRODUCT_IDS']) delete process.env[k]
  })

  it('a new subscription (SUBSCRIPTION_STARTED) grants access until the next charge and sends the access e-mail', async () => {
    const res = await deliver(subscriptionStarted())
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ success: true })
    expect(applied()).toEqual([{
      gateway: 'wiven', event_key: 'SUBSCRIPTION_STARTED:tx-1', event_type: 'SUBSCRIPTION_STARTED',
      action: 'subscription_charge', transaction_id: 'tx-1', email: 'maria@example.com', name: 'Maria Silva',
      subscription_id: 'sub-1', customer_id: 'cli-1', plan: 'mensal',
      occurred_at: '2026-11-27T16:12:18.288Z', period_end: '2026-12-27T16:12:18.288Z',
      start_at: '2026-11-27T16:12:18.288Z', interval_type: 'MONTHS', interval_count: 1, cycle: 1,
    }])
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('identifies the plan by its period: monthly, quarterly, yearly', async () => {
    const plans: Record<string, string> = {}
    for (const [type, count, tx] of [['MONTHS', 1, 'a'], ['MONTHS', 3, 'b'], ['YEARS', 1, 'c']] as const) {
      await deliver(subscriptionStarted({
        transaction: { id: `tx-${tx}`, payedAt: '2026-11-27T16:12:18.288Z' },
        subscription: { id: `sub-${tx}`, nextChargeAt: '2026-12-27T16:12:18.288Z', intervalType: type, intervalCount: count, cycle: 1 },
      }))
    }
    for (const e of applied()) plans[String(e.transaction_id)] = String(e.plan)
    expect(plans).toEqual({ 'tx-a': 'mensal', 'tx-b': 'trimestral', 'tx-c': 'anual' })
  })

  it('a subscription charge sent as TRANSACTION_PAID goes the subscription way (never lifetime)', async () => {
    // Mesmo que alguém coloque o produto da assinatura na lista do vitalício
    process.env.WIVEN_PRODUCT_IDS = `${LEGACY_PRODUCT},${SUB_PRODUCT}`
    await deliver(transactionPaidForSubscription())
    const [e] = applied()
    expect(e.action).toBe('subscription_charge')
    expect(e).toMatchObject({ event_key: 'TRANSACTION_PAID:tx-1', period_end: null, start_at: '2026-11-27T16:12:18.288Z', cycle: 1, plan: 'mensal' })
    expect(JSON.stringify(e)).not.toContain('123.456.789-00')
    expect(JSON.stringify(e)).not.toContain(SECRET)
  })

  it('grants nothing for subscriptions when WIVEN_SUBSCRIPTION_PRODUCT_IDS is not set', async () => {
    delete process.env.WIVEN_SUBSCRIPTION_PRODUCT_IDS
    for (const body of [subscriptionStarted(), transactionPaidForSubscription(), statusEvent('SUBSCRIPTION_EXPIRED')]) {
      const res = await deliver(body)
      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ received: true, action: 'ignored — product not allowed' })
    }
    expect(rpc).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('grants nothing for another product of the account', async () => {
    const res = await deliver(subscriptionStarted({ items: [{ product: { id: 'outro-produto' } }] }))
    expect(res.body).toEqual({ received: true, action: 'ignored — product not allowed' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('grants nothing for an unknown period (e.g. weekly) and does not ask for a redelivery', async () => {
    const res = await deliver(subscriptionStarted({
      subscription: { id: 'sub-1', nextChargeAt: '2026-12-04T16:12:18.288Z', intervalType: 'WEEKS', intervalCount: 1, cycle: 1 },
    }))
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, action: 'ignored — unknown plan' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('answers 400 for an incomplete subscription charge', async () => {
    expect((await deliver(subscriptionStarted({ client: { id: 'cli-1', name: 'Sem Email' } }))).statusCode).toBe(400)
    expect((await deliver(subscriptionStarted({ transaction: null }))).statusCode).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it.each([
    ['SUBSCRIPTION_RENEWAL_PENDING', 'past_due'],
    ['SUBSCRIPTION_EXPIRED', 'expired'],
    ['SUBSCRIPTION_CANCELED', 'canceled'],
  ])('%s changes the subscription status to %s', async (event, status) => {
    applyResult = { outcome: 'status_changed', duplicate: false, status, token_id: 't-1' }
    const res = await deliver(statusEvent(event))
    expect(res.body).toEqual({ success: true })
    expect(applied()).toEqual([{
      gateway: 'wiven', event_key: `${event}:sub-1:2027-01-02T10:00:00.000Z`, event_type: event,
      action: 'subscription_status', transaction_id: null, email: null, name: '',
      subscription_id: 'sub-1', customer_id: 'cli-1', plan: 'trimestral', status, occurred_at: '2027-01-02T10:00:00.000Z',
    }])
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('answers 400 for a status event without occurredAt (the order of events depends on it)', async () => {
    const res = await deliver(statusEvent('SUBSCRIPTION_EXPIRED', { occurredAt: undefined }))
    expect(res.statusCode).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('ignores the free-trial event (the offers have no trial)', async () => {
    const res = await deliver(statusEvent('SUBSCRIPTION_TRIAL_STARTED'))
    expect(res.statusCode).toBe(200)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('a refund of a subscription charge revokes with the subscription id', async () => {
    applyResult = { outcome: 'revoked', duplicate: false, tokens_revoked: 1, subscription_id: 'sub-1' }
    const res = await deliver({ ...transactionPaidForSubscription(), event: 'TRANSACTION_REFUNDED' })
    expect(res.body).toEqual({ success: true, action: 'revoked' })
    expect(applied()[0]).toMatchObject({ action: 'revoke', transaction_id: 'tx-1', subscription_id: 'sub-1' })
  })

  it('a renewal does not send another e-mail', async () => {
    applyResult = { outcome: 'subscription_charged', duplicate: false, token_id: 't-1', email_key: 'access_email:subscription:sub-1' }
    rpc.mockImplementation(async (fn: string) => {
      if (fn === 'billing_apply_event') return { data: applyResult, error: null }
      if (fn === 'email_outbox_claim') return { data: { outcome: 'sent' }, error: null }
      return { data: null, error: null }
    })
    const res = await deliver(subscriptionStarted({ event: 'SUBSCRIPTION_RENEWED', transaction: { id: 'tx-2', payedAt: '2026-12-27T16:12:18.288Z' } }))
    expect(res.body).toEqual({ success: true })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('answers 200 to a charge whose period cannot be computed and to a stale status event', async () => {
    applyResult = { outcome: 'no_period', duplicate: false }
    expect((await deliver(transactionPaidForSubscription())).body).toEqual({ received: true, action: 'ignored — no period' })
    applyResult = { outcome: 'stale', duplicate: false, status: 'active' }
    expect((await deliver(statusEvent('SUBSCRIPTION_EXPIRED'))).body).toEqual({ received: true, action: 'ignored — stale' })
  })

  it('records the failure and answers 500 when the database fails', async () => {
    rpc.mockImplementation(async (fn: string) =>
      fn === 'billing_apply_event' ? { data: null, error: { message: 'connection refused' } } : { data: null, error: null })
    const res = await deliver(subscriptionStarted())
    expect(res.statusCode).toBe(500)
    expect(rpc.mock.calls.some(([fn]) => fn === 'billing_record_failure')).toBe(true)
  })

  it('keeps one-time purchases (subscription: null) on the lifetime path', async () => {
    applyResult = { outcome: 'token_created', duplicate: false, token_id: 't-9', email_key: 'access_email:token:t-9' }
    await deliver({
      event: 'TRANSACTION_PAID', token: SECRET, offerCode: 'WOSNO2H', subscription: null,
      client: { email: 'antigo@example.com', name: 'Cliente' }, transaction: { id: 'tx-9' },
      orderItems: [{ product: { id: LEGACY_PRODUCT } }],
    })
    expect(applied()[0]).toMatchObject({ action: 'grant', transaction_id: 'tx-9' })
  })
})
