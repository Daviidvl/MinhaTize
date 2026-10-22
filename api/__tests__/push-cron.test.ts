import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const rowsQuery = vi.fn()
const tokensQuery = vi.fn()
const deleted: unknown[] = []
const updated: { values: unknown; filters: [string, unknown][] }[] = []
const sendNotification = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'tokens') return { select: () => ({ in: tokensQuery }) }
      return {
        select: () => ({ lte: () => ({ order: () => ({ limit: rowsQuery }) }) }),
        delete: () => ({ eq: (_k: string, v: unknown) => { deleted.push(v); return Promise.resolve({ error: null }) } }),
        update: (values: unknown) => {
          const entry = { values, filters: [] as [string, unknown][] }
          updated.push(entry)
          const chain = {
            eq: (k: string, v: unknown) => { entry.filters.push([k, v]); return chain },
            then: (r: (v: unknown) => void) => r({ error: null }),
          }
          return chain
        },
      }
    },
  }),
}))

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: (...a: unknown[]) => sendNotification(...a) },
}))

const HOUR = 3_600_000

function makeReq(auth = 'Bearer s3cret'): VercelRequest {
  return { method: 'GET', headers: { authorization: auth } } as unknown as VercelRequest
}

type MockRes = VercelResponse & { statusCode?: number; body?: unknown }
function makeRes(): MockRes {
  const res = {} as MockRes
  res.status = vi.fn((c: number) => { res.statusCode = c; return res }) as unknown as MockRes['status']
  res.json   = vi.fn((d: unknown) => { res.body = d; return res }) as unknown as MockRes['json']
  res.end    = vi.fn(() => res) as unknown as MockRes['end']
  return res
}

function row(id: number, schedule: { id: string; at: string }[], tokenId = '1') {
  return {
    id, endpoint: `https://fcm.googleapis.com/fcm/send/${id}`, p256dh: 'p', auth: 'a', token_id: tokenId,
    updated_at: '2026-10-24T10:00:00+00:00',
    schedule: schedule.map(s => ({ ...s, title: 'T', body: 'B', url: '/' })),
  }
}

describe('api/push-cron', () => {
  let handler: typeof import('../push-cron').default
  const now = Date.now()
  const iso = (offset: number) => new Date(now + offset).toISOString()

  beforeEach(async () => {
    vi.resetModules()
    process.env.CRON_SECRET = 's3cret'
    process.env.SUPABASE_URL = 'https://x.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k'
    process.env.VAPID_PUBLIC_KEY = 'pub'
    process.env.VAPID_PRIVATE_KEY = 'priv'
    deleted.length = 0
    updated.length = 0
    rowsQuery.mockReset()
    tokensQuery.mockReset().mockResolvedValue({ data: [{ id: 1, active: true, expires_at: null }], error: null })
    sendNotification.mockReset().mockResolvedValue({ statusCode: 201 })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    handler = (await import('../push-cron')).default
  })

  it('recusa chamada sem o segredo', async () => {
    const res = makeRes()
    await handler(makeReq('Bearer errado'), res)
    expect(res.statusCode).toBe(401)
    expect(rowsQuery).not.toHaveBeenCalled()
  })

  it('envia o que venceu, descarta o atrasado demais e guarda o resto', async () => {
    rowsQuery.mockResolvedValue({
      data: [row(7, [
        { id: 'velho', at: iso(-5 * HOUR) },
        { id: 'agora', at: iso(-60_000) },
        { id: 'depois', at: iso(2 * HOUR) },
      ])],
      error: null,
    })
    const res = makeRes()
    await handler(makeReq(), res)

    expect(res.statusCode).toBe(200)
    expect(sendNotification).toHaveBeenCalledTimes(1)
    expect(JSON.parse(sendNotification.mock.calls[0][1] as string)).toMatchObject({ tag: 'agora', title: 'T', url: '/' })
    expect(updated).toHaveLength(1)
    const values = updated[0].values as { schedule: { id: string }[]; next_at: string }
    expect(values.schedule.map(i => i.id)).toEqual(['depois'])
    expect(values.next_at).toBe(iso(2 * HOUR))
    // Não sobrescreve uma agenda que o app tenha reenviado no meio do disparo
    expect(updated[0].filters).toContainEqual(['updated_at', '2026-10-24T10:00:00+00:00'])
  })

  it('apaga a inscrição quando o serviço de push diz que ela não existe mais', async () => {
    rowsQuery.mockResolvedValue({ data: [row(8, [{ id: 'a', at: iso(-60_000) }])], error: null })
    sendNotification.mockRejectedValue(Object.assign(new Error('gone'), { statusCode: 410 }))
    const res = makeRes()
    await handler(makeReq(), res)
    expect(deleted).toEqual([8])
    expect(res.body).toMatchObject({ sent: 0, removed: 1 })
  })

  it('não envia para acesso revogado', async () => {
    rowsQuery.mockResolvedValue({ data: [row(9, [{ id: 'a', at: iso(-60_000) }], '2')], error: null })
    tokensQuery.mockResolvedValue({ data: [{ id: 2, active: false, expires_at: null }], error: null })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(sendNotification).not.toHaveBeenCalled()
    expect(deleted).toEqual([9])
  })
})
