import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Testes de segurança — /api/push (inscrição de notificações de um aparelho):
// autenticação, isolamento entre acessos, SSRF, mass assignment e teto de
// aparelhos por acesso.

const tokenLookup = vi.fn()
const upsert = vi.fn()
const excessQuery = vi.fn()
const deletes: [string, unknown][][] = []

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'tokens') {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: tokenLookup }) }) }) }
      }
      return {
        upsert,
        select: () => ({
          eq: (k: string, v: unknown) => ({
            order: () => ({ range: (from: number, to: number) => excessQuery(k, v, from, to) }),
          }),
        }),
        delete: () => {
          const filters: [string, unknown][] = []
          deletes.push(filters)
          const chain = {
            eq: (k: string, v: unknown) => { filters.push([k, v]); return chain },
            in: (k: string, v: unknown) => { filters.push([k, v]); return chain },
            then: (resolve: (v: unknown) => void) => resolve({ error: null }),
          }
          return chain
        },
      }
    },
  }),
}))

const TOKEN = '123e4567-e89b-42d3-a456-426614174000'
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123'
const KEYS = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQt', auth: 'tBHItJI5svbpez7KI4CCXg' }

function schedule() {
  return [{ id: 'r1', at: new Date(Date.now() + 3_600_000).toISOString(), title: 'Lembrete', body: 'Hora da água', url: '/?tab=health' }]
}

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '9.9.9.9',
      'user-agent': 'vitest',
      authorization: `Bearer ${TOKEN}`,
    },
    body: { subscription: { endpoint: ENDPOINT, keys: KEYS }, schedule: schedule() },
    ...overrides,
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

describe('api/push handler', () => {
  let handler: typeof import('../push').default

  beforeEach(async () => {
    vi.resetModules()
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
    process.env.VAPID_PUBLIC_KEY = 'BPublicKeyForTests'
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    tokenLookup.mockReset().mockResolvedValue({ data: { id: 1, expires_at: null }, error: null })
    upsert.mockReset().mockResolvedValue({ error: null })
    excessQuery.mockReset().mockResolvedValue({ data: [], error: null })
    deletes.length = 0
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ default: handler } = await import('../push'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.VAPID_PUBLIC_KEY
  })

  it('serves only the public VAPID key without authentication', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'GET', headers: {} }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ publicKey: 'BPublicKeyForTests' })
  })

  it('rejects writes without a valid Bearer token and touches nothing', async () => {
    for (const method of ['POST', 'DELETE']) {
      for (const authorization of [undefined, 'Bearer abc', `Basic ${TOKEN}`]) {
        const res = makeRes()
        await handler(makeReq({ method, headers: { 'x-forwarded-for': '9.9.9.9', ...(authorization ? { authorization } : {}) } }), res)
        expect(res.statusCode).toBe(401)
      }
    }
    expect(upsert).not.toHaveBeenCalled()
    expect(deletes).toHaveLength(0)
  })

  it('rejects a revoked/unknown token (401) and answers 503 when the lookup fails', async () => {
    tokenLookup.mockResolvedValueOnce({ data: null, error: null })
    const revoked = makeRes()
    await handler(makeReq(), revoked)
    expect(revoked.statusCode).toBe(401)

    tokenLookup.mockResolvedValueOnce({ data: null, error: { message: 'connection reset' } })
    const down = makeRes()
    await handler(makeReq(), down)
    expect(down.statusCode).toBe(503)
    expect(upsert).not.toHaveBeenCalled()
  })

  // BOLA: quem conhece o endpoint de outra pessoa não consegue apagá-lo
  it('DELETE only removes a subscription that belongs to the authenticated access', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'DELETE', body: { endpoint: ENDPOINT, token_id: '999' } }), res)
    expect(res.statusCode).toBe(200)
    expect(deletes).toEqual([[['endpoint', ENDPOINT], ['token_id', '1']]])
  })

  // SSRF: o cron faz POST no endpoint — só serviços de push dos navegadores
  it('refuses endpoints outside the browsers\' push services', async () => {
    for (const endpoint of [
      'https://169.254.169.254/latest/meta-data',
      'http://fcm.googleapis.com/fcm/send/x',
      'https://fcm.googleapis.com.evil.example/x',
      'https://fcm.googleapis.com:8443/x',
      'https://localhost/x',
      'file:///etc/passwd',
    ]) {
      const res = makeRes()
      await handler(makeReq({ body: { subscription: { endpoint, keys: KEYS }, schedule: schedule() } }), res)
      expect(res.statusCode).toBe(400)
    }
    expect(upsert).not.toHaveBeenCalled()
  })

  it('binds the subscription to the authenticated access, ignoring ownership fields in the body', async () => {
    const res = makeRes()
    await handler(makeReq({
      body: { subscription: { endpoint: ENDPOINT, keys: KEYS }, schedule: schedule(), token_id: '999', next_at: '2000-01-01' },
    }), res)
    expect(res.statusCode).toBe(200)
    const [row, opts] = upsert.mock.calls[0]
    expect(row.token_id).toBe('1')
    expect(row.next_at).not.toBe('2000-01-01')
    expect(JSON.stringify(row)).not.toContain(TOKEN)
    expect(Object.keys(row).sort()).toEqual(['auth', 'endpoint', 'next_at', 'p256dh', 'schedule', 'token_id', 'updated_at', 'user_agent'])
    expect(opts).toEqual({ onConflict: 'endpoint' })
  })

  // Teto de aparelhos: um acesso não grava inscrições sem fim
  it('keeps at most 10 devices per access, removing the oldest ones', async () => {
    excessQuery.mockResolvedValue({ data: [{ id: 41 }, { id: 42 }], error: null })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(200)
    // Consulta só os aparelhos deste acesso, além dos 10 mais recentes
    expect(excessQuery).toHaveBeenCalledWith('token_id', '1', 10, 109)
    expect(deletes).toEqual([[['id', [41, 42]]]])
  })

  it('removes nothing when the access is within the limit', async () => {
    await handler(makeReq(), makeRes())
    expect(deletes).toHaveLength(0)
  })

  it('still answers 200 when the cleanup query fails (the subscription was saved)', async () => {
    excessQuery.mockResolvedValue({ data: null, error: { message: 'timeout' } })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(200)
    expect(upsert).toHaveBeenCalled()
  })

  it('rejects an oversized body before touching the database', async () => {
    const res = makeRes()
    await handler(makeReq({ body: { subscription: { endpoint: ENDPOINT, keys: KEYS }, schedule: [], pad: 'x'.repeat(200_000) } }), res)
    expect(res.statusCode).toBe(400)
    expect(tokenLookup).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })
})
