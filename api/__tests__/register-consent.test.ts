import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Testes de auditoria — registro de consentimento LGPD (único endpoint de escrita
// acionado pelo usuário final).

const tokenLookup = vi.fn()
const consentLookup = vi.fn()
const insert = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: table === 'tokens' ? tokenLookup : consentLookup }) }),
      }),
      insert,
    }),
  }),
}))

const TOKEN = '123e4567-e89b-42d3-a456-426614174000'

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '9.9.9.9',
      'user-agent': 'vitest',
      authorization: `Bearer ${TOKEN}`,
    },
    body: { version: '1.0' },
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

describe('api/register-consent handler', () => {
  let handler: typeof import('../register-consent').default

  beforeEach(async () => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    tokenLookup.mockReset().mockResolvedValue({ data: { id: 1, expires_at: null }, error: null })
    consentLookup.mockReset().mockResolvedValue({ data: null, error: null })
    insert.mockReset().mockResolvedValue({ error: null })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ default: handler } = await import('../register-consent'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects a request without a valid Bearer token and writes nothing', async () => {
    for (const authorization of [undefined, 'Bearer abc', `Basic ${TOKEN}`]) {
      const res = makeRes()
      await handler(makeReq({ headers: { 'x-forwarded-for': '9.9.9.9', ...(authorization ? { authorization } : {}) } }), res)
      expect(res.statusCode).toBe(401)
    }
    expect(insert).not.toHaveBeenCalled()
  })

  it('rejects a well-formed token that is not active and writes nothing', async () => {
    tokenLookup.mockResolvedValue({ data: null, error: null })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(401)
    expect(insert).not.toHaveBeenCalled()
  })

  it('stores the consent bound to the authenticated token, not to anything in the body', async () => {
    const res = makeRes()
    // Tentativa de mass assignment: campos extras no corpo devem ser ignorados
    await handler(makeReq({ body: { version: '1.0', token: 'outro-token', ip_address: '1.1.1.1', accepted_at: '2000-01-01' } }), res)
    expect(res.body).toEqual({ success: true, stored: true })
    const row = insert.mock.calls[0][0]
    // Referência ao acesso pelo id: a tabela de consentimentos nunca guarda o token
    expect(row.token_id).toBe('1')
    expect(JSON.stringify(row)).not.toContain(TOKEN)
    expect(row.ip_address).toBe('9.9.9.9')
    expect(row.accepted_at).not.toBe('2000-01-01')
    expect(Object.keys(row).sort()).toEqual(['accepted_at', 'ip_address', 'token_id', 'user_agent', 'version'])
  })

  it('truncates oversized version and user-agent values', async () => {
    const res = makeRes()
    await handler(makeReq({
      headers: { ...makeReq().headers, 'user-agent': 'x'.repeat(5_000) },
      body: { version: 'v'.repeat(500) },
    }), res)
    const row = insert.mock.calls[0][0]
    expect(row.version).toHaveLength(20)
    expect(row.user_agent).toHaveLength(512)
  })

  it('does not insert a duplicate consent for the same token and version', async () => {
    consentLookup.mockResolvedValue({ data: { id: 7 }, error: null })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.body).toEqual({ success: true, duplicate: true })
    expect(insert).not.toHaveBeenCalled()
  })

  it('does not block the user (200, stored:false) when the database insert fails', async () => {
    insert.mockResolvedValue({ error: { message: 'permission denied for table consents' } })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ success: true, stored: false })
  })

  it('returns 429 after 10 requests per hour from the same IP', async () => {
    let last = makeRes()
    for (let i = 0; i < 11; i++) {
      last = makeRes()
      await handler(makeReq({ headers: { ...makeReq().headers, 'x-forwarded-for': '4.4.4.4' } }), last)
    }
    expect(last.statusCode).toBe(429)
  })
})
