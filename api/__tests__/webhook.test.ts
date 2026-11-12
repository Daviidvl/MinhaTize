import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const insert = vi.fn()
const maybeSingleTokens = vi.fn()
const sendMock = vi.fn()

vi.mock('../_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleTokens }) }),
      insert,
    }),
  }),
}))

// Classe (e não vi.fn) para sobreviver ao vi.restoreAllMocks() do afterEach
vi.mock('resend', () => ({
  Resend: class { emails = { send: sendMock } },
}))

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' },
    body: {},
    ...overrides,
  } as unknown as VercelRequest
}

type MockRes = VercelResponse & { statusCode?: number; body?: unknown; headers: Record<string, string> }

function makeRes(): MockRes {
  const res = { headers: {} } as MockRes
  res.status     = vi.fn((code: number) => { res.statusCode = code; return res }) as unknown as MockRes['status']
  res.json       = vi.fn((data: unknown) => { res.body = data; return res }) as unknown as MockRes['json']
  res.end        = vi.fn(() => res) as unknown as MockRes['end']
  res.setHeader  = vi.fn((k: string, v: string) => { res.headers[k] = v; return res }) as unknown as MockRes['setHeader']
  return res
}

describe('api/webhook handler', () => {
  let handler: typeof import('../webhook').default

  beforeEach(async () => {
    vi.resetModules()
    process.env.WIVEN_WEBHOOK_SECRET = 'super-secret-value'
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    insert.mockReset().mockResolvedValue({ error: null })
    maybeSingleTokens.mockReset().mockResolvedValue({ data: null, error: null })
    sendMock.mockReset().mockResolvedValue({})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    ;({ default: handler } = await import('../webhook'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.WIVEN_WEBHOOK_SECRET
  })

  it('rejects a request with no secret/token at all', async () => {
    const req = makeReq({ body: { event: 'TRANSACTION_PAID' } })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('rejects a request with an invalid secret', async () => {
    const req = makeReq({ body: { event: 'TRANSACTION_PAID', token: 'not-the-right-secret' } })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  // Antes: mesmo .length do segredo com um caractere acentuado fazia o
  // timingSafeEqual lançar RangeError → 500 em vez de 401
  it('rejects (401, no exception) a token with the secret length in characters but more bytes', async () => {
    const forged = 'super-secret-valu' + 'é' // 18 caracteres, 19 bytes
    expect(forged.length).toBe('super-secret-value'.length)
    const res = makeRes()
    await handler(makeReq({ body: { event: 'TRANSACTION_PAID', token: forged } }), res) // lançar = teste falha
    expect(res.statusCode).toBe(401)
    expect(insert).not.toHaveBeenCalled()
  })

  it('rejects a token sent as a non-string (array/object) without throwing', async () => {
    for (const token of [['super-secret-value'], { value: 'super-secret-value' }, 123]) {
      const res = makeRes()
      await handler(makeReq({ body: { event: 'TRANSACTION_PAID', token } }), res)
      expect(res.statusCode).toBe(401)
    }
    expect(insert).not.toHaveBeenCalled()
  })

  it('accepts a request with the correct secret and stores a new token', async () => {
    const req = makeReq({
      body: {
        event: 'TRANSACTION_PAID',
        token: 'super-secret-value',
        client: { email: 'buyer@example.com', name: 'Buyer' },
        transaction: { id: 'tx-1' },
      },
    })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    expect(insert).toHaveBeenCalled()
  })

  it('blocks repeated requests from the same IP once the rate limit is exceeded', async () => {
    const ip = '5.5.5.5'
    let last: MockRes = makeRes()
    for (let i = 0; i < 61; i++) {
      const req = makeReq({
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: { event: 'TRANSACTION_PAID', token: 'not-the-right-secret' },
      })
      last = makeRes()
      await handler(req, last)
    }
    expect(last.statusCode).toBe(429)
    expect(last.headers['Retry-After']).toBeDefined()
  })

  it('does not let the rate limit affect a different IP', async () => {
    const req = makeReq({ headers: { 'content-type': 'application/json', 'x-forwarded-for': '8.8.8.8' }, body: { event: 'TRANSACTION_PAID' } })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).not.toBe(429)
  })
})
