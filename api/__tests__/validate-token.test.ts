import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Testes de auditoria — endpoint de "login" (validação do token de acesso).

const maybeSingle = vi.fn()
const select = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: (cols: string) => {
        select(cols)
        return { eq: () => ({ eq: () => ({ maybeSingle }) }) }
      },
    }),
  }),
}))

const TOKEN = '123e4567-e89b-42d3-a456-426614174000'

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { 'x-forwarded-for': '9.9.9.9' },
    query: { token: TOKEN },
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

describe('api/validate-token handler', () => {
  let handler: typeof import('../validate-token').default

  beforeEach(async () => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    maybeSingle.mockReset().mockResolvedValue({ data: { id: 1, expires_at: null }, error: null })
    select.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ default: handler } = await import('../validate-token'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('only accepts GET, POST and OPTIONS (preflight)', async () => {
    const put = makeRes()
    await handler(makeReq({ method: 'PUT' }), put)
    expect(put.statusCode).toBe(405)

    const options = makeRes()
    await handler(makeReq({ method: 'OPTIONS' }), options)
    expect(options.statusCode).toBe(200)
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it('returns valid:true for an active token', async () => {
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.body).toEqual({ valid: true })
  })

  it('accepts the token in the Authorization header on POST (keeps it out of URLs and logs)', async () => {
    const res = makeRes()
    await handler(makeReq({
      method: 'POST',
      query: {},
      headers: { 'x-forwarded-for': '9.9.9.9', authorization: `Bearer ${TOKEN}` },
    }), res)
    expect(res.body).toEqual({ valid: true })
  })

  it('ignores a query-string token on POST', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'POST', headers: { 'x-forwarded-for': '9.9.9.9' } }), res)
    expect(res.body).toEqual({ valid: false })
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it('returns valid:false when the token does not exist', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.body).toEqual({ valid: false })
  })

  it('rejects a missing or malformed token without touching the database', async () => {
    for (const token of [undefined, '', 'abc', "' OR 1=1 --", ['a', 'b'], `${TOKEN}x`]) {
      const res = makeRes()
      await handler(makeReq({ query: { token } as VercelRequest['query'] }), res)
      expect(res.body).toEqual({ valid: false })
    }
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  // 503 (e não 200 valid:false) para o app não tratar uma instabilidade do
  // banco como "token recusado" e deslogar o usuário.
  it('answers 503 valid:false, leaking no detail, when the database errors', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'relation "tokens" does not exist' } })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ valid: false })
  })

  it('answers 503 when the database client throws', async () => {
    maybeSingle.mockRejectedValue(new Error('fetch failed'))
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(503)
  })

  it('returns 429 after 30 attempts per minute from the same IP', async () => {
    let last = makeRes()
    for (let i = 0; i < 31; i++) {
      last = makeRes()
      await handler(makeReq({ headers: { 'x-forwarded-for': '7.7.7.7' } }), last)
    }
    expect(last.statusCode).toBe(429)
    expect(last.headers['Retry-After']).toBeDefined()
  })

  it('never reflects an arbitrary Origin in the CORS header', async () => {
    const res = makeRes()
    await handler(makeReq({ headers: { 'x-forwarded-for': '9.9.9.9', origin: 'https://evil.example' } }), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://minhatize.vercel.app')
  })

  it('returns valid:false for a token whose expires_at is in the past', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 1, expires_at: new Date(Date.now() - 60_000).toISOString() },
      error: null,
    })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.body).toEqual({ valid: false })
  })
})
