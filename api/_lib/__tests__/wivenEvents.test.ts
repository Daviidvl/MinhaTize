import { describe, it, expect } from 'vitest'
import { eventKeyOf, toBillingEvent, transactionIdOf } from '../wivenEvents'

const base = {
  event: 'TRANSACTION_PAID',
  token: 'segredo-do-webhook',
  client: { email: ' buyer@example.com ', name: 'Maria', cpf: '123.456.789-00', phone: '+5511999999999' },
  transaction: { id: 'tx-1', amount: 9700 },
}

describe('wivenEvents', () => {
  it('keys an event by type and transaction id', () => {
    expect(eventKeyOf(base)).toBe('TRANSACTION_PAID:tx-1')
    expect(eventKeyOf({ ...base, event: 'EVENTO_REEMBOLSO' })).toBe('EVENTO_REEMBOLSO:tx-1')
  })

  it('accepts a numeric transaction id', () => {
    expect(transactionIdOf({ transaction: { id: 123 as unknown as string } })).toBe('123')
    expect(transactionIdOf({ transaction: { id: { x: 1 } as unknown as string } })).toBe('')
  })

  it('without a transaction id, hashes the payload: same delivery → same key, regardless of key order', () => {
    const a = { event: 'TRANSACTION_PAID', token: 's', client: { name: 'Maria', email: 'a@b.c' }, offerCode: 'x' }
    const b = { offerCode: 'x', client: { email: 'a@b.c', name: 'Maria' }, token: 's', event: 'TRANSACTION_PAID' }
    expect(eventKeyOf(a)).toMatch(/^TRANSACTION_PAID:sha256:[0-9a-f]{64}$/)
    expect(eventKeyOf(a)).toBe(eventKeyOf(b))
    expect(eventKeyOf({ ...a, offerCode: 'y' })).not.toBe(eventKeyOf(a))
  })

  it('leaves the webhook secret out of the hash (rotating the secret keeps the key)', () => {
    const a = { event: 'TRANSACTION_PAID', token: 'segredo-antigo', client: { email: 'a@b.c' } }
    expect(eventKeyOf(a)).toBe(eventKeyOf({ ...a, token: 'segredo-novo' }))
  })

  it('builds the canonical event without CPF, phone, amount or the secret', () => {
    const e = toBillingEvent(base, 'grant')
    expect(e).toEqual({
      gateway: 'wiven',
      event_key: 'TRANSACTION_PAID:tx-1',
      event_type: 'TRANSACTION_PAID',
      action: 'grant',
      transaction_id: 'tx-1',
      email: 'buyer@example.com',
      name: 'Maria',
    })
    const json = JSON.stringify(e)
    for (const secret of ['123.456.789-00', '+5511999999999', 'segredo-do-webhook', '9700']) {
      expect(json).not.toContain(secret)
    }
  })

  it('uses null for a missing transaction id or e-mail', () => {
    const e = toBillingEvent({ event: 'TRANSACTION_PAID', client: {} }, 'grant')
    expect(e.transaction_id).toBeNull()
    expect(e.email).toBeNull()
  })
})
