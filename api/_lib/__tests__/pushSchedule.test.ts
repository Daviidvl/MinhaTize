import { describe, it, expect } from 'vitest'
import { sanitizeSchedule, sanitizeSubscription, nextAt, isPushHost, MAX_ITEMS } from '../pushSchedule'

const NOW = Date.parse('2026-10-24T13:00:00Z')
const item = (over: Record<string, unknown> = {}) => ({
  id: 'water-2026-10-24-2', at: '2026-10-24T17:00:00.000Z', title: 'Hora de beber água',
  body: 'Lembre-se de beber água.', url: '/?tab=health&section=food%3Ahydration', ...over,
})

describe('sanitizeSchedule', () => {
  it('aceita itens válidos e ordena por horário', () => {
    const out = sanitizeSchedule([item({ id: 'b', at: '2026-10-25T12:00:00Z' }), item({ id: 'a' })], NOW)!
    expect(out.map(i => i.id)).toEqual(['a', 'b'])
    expect(nextAt(out)).toBe('2026-10-24T17:00:00.000Z')
  })

  it('descarta passado, longe demais, ids repetidos e campos inválidos', () => {
    const out = sanitizeSchedule([
      item({ id: 'past', at: '2026-10-24T12:00:00Z' }),
      item({ id: 'far', at: '2026-12-24T12:00:00Z' }),
      item({ id: 'ok' }), item({ id: 'ok' }),
      item({ id: 'bad id!' }),
      item({ id: 'notitle', title: '' }),
      item({ id: 'nodate', at: 'amanhã' }),
    ], NOW)!
    expect(out.map(i => i.id)).toEqual(['ok'])
  })

  it('troca URLs externas pela raiz do app e limita textos', () => {
    const [out] = sanitizeSchedule([item({ url: 'https://evil.example/x', body: 'x'.repeat(500) })], NOW)!
    expect(out.url).toBe('/')
    expect(out.body).toHaveLength(200)
  })

  it('recusa formato geral inválido', () => {
    expect(sanitizeSchedule('nope', NOW)).toBeNull()
    expect(sanitizeSchedule(Array.from({ length: MAX_ITEMS + 1 }, () => item()), NOW)).toBeNull()
    expect(nextAt([])).toBeNull()
  })
})

describe('sanitizeSubscription', () => {
  const keys = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' }

  it('aceita serviços de push conhecidos', () => {
    expect(sanitizeSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys })).not.toBeNull()
    expect(sanitizeSubscription({ endpoint: 'https://web.push.apple.com/QGx', keys })).not.toBeNull()
    expect(isPushHost('updates.push.services.mozilla.com')).toBe(true)
  })

  it('recusa endpoint fora dos serviços de push (SSRF) ou chaves malformadas', () => {
    expect(sanitizeSubscription({ endpoint: 'https://169.254.169.254/latest', keys })).toBeNull()
    expect(sanitizeSubscription({ endpoint: 'https://fcm.googleapis.com.evil.com/x', keys })).toBeNull()
    expect(sanitizeSubscription({ endpoint: 'http://fcm.googleapis.com/x', keys })).toBeNull()
    expect(sanitizeSubscription({ endpoint: 'https://fcm.googleapis.com:8443/x', keys })).toBeNull()
    expect(sanitizeSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: '<script>', auth: keys.auth } })).toBeNull()
    expect(sanitizeSubscription(null)).toBeNull()
  })
})
