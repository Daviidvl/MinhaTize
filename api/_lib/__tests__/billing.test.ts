import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const rpc = vi.fn()
const sendMock = vi.fn()

vi.mock('../supabaseAdmin', () => ({ getSupabaseAdmin: () => ({ rpc }) }))
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock } } }))

const { deliverOutboxEmail, applyBillingEvent, recordBillingFailure, fetchDueWork } = await import('../billing')

const KEY = 'access_email:token:7'
const IDEM = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b'
const claimed = {
  outcome: 'claimed', outbox_id: 7, idempotency_key: IDEM, template: 'access_granted',
  token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', email: 'buyer@example.com', name: 'Maria',
}

function rpcReturning(claim: unknown, finishError: unknown = null) {
  rpc.mockImplementation(async (fn: string) => {
    if (fn === 'email_outbox_claim') return { data: claim, error: null }
    if (fn === 'email_outbox_finish') return { data: null, error: finishError }
    return { data: null, error: null }
  })
}

const finishCall = () => rpc.mock.calls.find(([fn]) => fn === 'email_outbox_finish')?.[1]

describe('billing — deliverOutboxEmail', () => {
  beforeEach(() => {
    rpc.mockReset()
    sendMock.mockReset().mockResolvedValue({ data: { id: 'resend-1' }, error: null })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('sends the claimed e-mail with its stored idempotency key and records the Resend id', async () => {
    rpcReturning(claimed)
    expect(await deliverOutboxEmail(KEY)).toBe('sent')
    expect(rpc).toHaveBeenCalledWith('email_outbox_claim', { p_business_key: KEY })
    const [mail, options] = sendMock.mock.calls[0]
    expect(mail.to).toBe('buyer@example.com')
    expect(mail.html).toContain(claimed.token)
    expect(options).toEqual({ idempotencyKey: IDEM })
    expect(finishCall()).toEqual({ p_id: 7, p_ok: true, p_provider_id: 'resend-1', p_error: null })
  })

  it.each([
    ['sent', 'already_sent'],
    ['busy', 'busy'],
    ['canceled', 'canceled'],
    ['exhausted', 'exhausted'],
    ['missing', 'missing'],
  ])('does not send when the claim says %s', async (outcome, expected) => {
    rpcReturning({ outcome })
    expect(await deliverOutboxEmail(KEY)).toBe(expected)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('marks the e-mail as failed (for a retry with the same key) when Resend refuses it', async () => {
    rpcReturning(claimed)
    sendMock.mockResolvedValue({ data: null, error: { name: 'application_error', message: 'try later' } })
    expect(await deliverOutboxEmail(KEY)).toBe('failed')
    expect(finishCall()).toMatchObject({ p_id: 7, p_ok: false, p_error: 'application_error: try later' })
  })

  it('reports failed without sending when the claim itself fails', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'timeout' } })
    expect(await deliverOutboxEmail(KEY)).toBe('failed')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('still reports sent when only the final bookkeeping fails (the claim expires and Resend dedupes the retry)', async () => {
    rpcReturning(claimed, { message: 'timeout' })
    expect(await deliverOutboxEmail(KEY)).toBe('sent')
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('refuses an incomplete claim instead of sending a broken e-mail', async () => {
    rpcReturning({ ...claimed, token: undefined })
    expect(await deliverOutboxEmail(KEY)).toBe('failed')
    expect(sendMock).not.toHaveBeenCalled()
  })
})

describe('billing — database calls', () => {
  beforeEach(() => {
    rpc.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  const event = {
    gateway: 'wiven', event_key: 'TRANSACTION_PAID:tx-1', event_type: 'TRANSACTION_PAID',
    action: 'grant' as const, transaction_id: 'tx-1', email: 'a@b.c', name: 'A',
  }

  it('applyBillingEvent throws on a database error or an unexpected answer', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'down' } })
    await expect(applyBillingEvent(event)).rejects.toThrow('down')
    rpc.mockResolvedValueOnce({ data: 'x', error: null })
    await expect(applyBillingEvent(event)).rejects.toThrow('resposta inesperada')
  })

  it('recordBillingFailure never throws', async () => {
    rpc.mockRejectedValueOnce(new Error('network'))
    await expect(recordBillingFailure(event, 'x')).resolves.toBeUndefined()
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'down' } })
    await expect(recordBillingFailure(event, 'x')).resolves.toBeUndefined()
  })

  it('fetchDueWork normalizes a partial answer', async () => {
    rpc.mockResolvedValueOnce({ data: { events: [event] }, error: null })
    expect(await fetchDueWork(5)).toEqual({ events: [event], emails: [], stuck: { events: 0, emails: 0 } })
    expect(rpc).toHaveBeenCalledWith('billing_due_work', { p_limit: 5 })
  })
})
