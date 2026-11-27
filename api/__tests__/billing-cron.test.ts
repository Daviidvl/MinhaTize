import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createFakeBillingDb, type FakeBillingDb } from './fakeBillingDb'

let db: FakeBillingDb
const sendMock = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({ rpc: (fn: string, args: Record<string, unknown>) => db.rpc(fn, args) }),
}))
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock } } }))

function makeReq(auth = 'Bearer s3cret', method = 'GET'): VercelRequest {
  return { method, headers: { authorization: auth } } as unknown as VercelRequest
}

type MockRes = VercelResponse & { statusCode?: number; body?: unknown }
function makeRes(): MockRes {
  const res = {} as MockRes
  res.status = vi.fn((c: number) => { res.statusCode = c; return res }) as unknown as MockRes['status']
  res.json   = vi.fn((d: unknown) => { res.body = d; return res }) as unknown as MockRes['json']
  res.end    = vi.fn(() => res) as unknown as MockRes['end']
  return res
}

function event(tx: string) {
  return {
    gateway: 'wiven', event_key: `TRANSACTION_PAID:${tx}`, event_type: 'TRANSACTION_PAID',
    action: 'grant', transaction_id: tx, email: `${tx}@example.com`, name: 'Maria',
  }
}

describe('api/billing-cron', () => {
  let handler: typeof import('../billing-cron').default
  let errorSpy: MockInstance

  async function run(req = makeReq()) {
    const res = makeRes()
    await handler(req, res)
    return res
  }

  beforeEach(async () => {
    vi.resetModules()
    db = createFakeBillingDb()
    process.env.CRON_SECRET = 's3cret'
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ default: handler } = await import('../billing-cron'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.CRON_SECRET
  })

  it('refuses calls without the cron secret', async () => {
    expect((await run(makeReq(''))).statusCode).toBe(401)
    expect((await run(makeReq('Bearer errado'))).statusCode).toBe(401)
    expect(db.calls).toHaveLength(0)
  })

  it('refuses other methods', async () => {
    expect((await run(makeReq('Bearer s3cret', 'DELETE'))).statusCode).toBe(405)
  })

  it('reprocesses an event that failed and sends its access e-mail once', async () => {
    await db.rpc('billing_record_failure', { p_event: event('tx-1'), p_error: 'banco fora' })
    const res = await run()
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ events: 1, reprocessed: 1, eventsFailed: 0, sent: 1 })
    expect(db.tokens).toHaveLength(1)
    expect(sendMock).toHaveBeenCalledTimes(1)

    // Rodar de novo não repete nada
    const again = await run()
    expect(again.body).toMatchObject({ events: 0, sent: 0 })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(db.tokens).toHaveLength(1)
  })

  it('sends an access e-mail left pending (Resend was down), with the same idempotency key', async () => {
    await db.rpc('billing_apply_event', { p_event: event('tx-2') })
    const outbox = [...db.outbox.values()][0]
    outbox.status = 'failed'
    const res = await run()
    expect(res.body).toMatchObject({ emails: 1, sent: 1, emailsFailed: 0 })
    expect(sendMock.mock.calls[0][1]).toEqual({ idempotencyKey: outbox.idempotency_key })
    expect(outbox.status).toBe('sent')
  })

  it('keeps an event that still fails for the next run', async () => {
    await db.rpc('billing_record_failure', { p_event: event('tx-3'), p_error: 'banco fora' })
    db.failNextApply()
    const res = await run()
    expect(res.body).toMatchObject({ events: 1, reprocessed: 0, eventsFailed: 1 })
    expect(db.events.get('TRANSACTION_PAID:tx-3')).toMatchObject({ status: 'failed', attempts: 2 })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('logs work that exhausted its retries', async () => {
    const real = db.rpc
    db.rpc = async (fn, args) => fn === 'billing_due_work'
      ? { data: { events: [], emails: [], stuck: { events: 1, emails: 2 } }, error: null }
      : real(fn, args)
    const res = await run()
    expect(res.body).toMatchObject({ stuck: { events: 1, emails: 2 } })
    expect(errorSpy.mock.calls.flat().join(' ')).toContain('ação manual')
  })

  it('answers 500 when the pending work cannot be read', async () => {
    db.rpc = async () => ({ data: null, error: { message: 'down' } })
    expect((await run()).statusCode).toBe(500)
  })
})
