import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('createRateLimiter — fallback em memória (Upstash não configurado)', () => {
  let createRateLimiter: typeof import('../rateLimit').createRateLimiter

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;({ createRateLimiter } = await import('../rateLimit'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('allows requests up to the limit', async () => {
    const checkRateLimit = createRateLimiter('test', 3, 60_000)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(true)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(true)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(true)
  })

  it('blocks requests once the limit is exceeded within the window', async () => {
    const checkRateLimit = createRateLimiter('test', 2, 60_000)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(true)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(true)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(false)
  })

  it('resets the count after the window elapses', async () => {
    const checkRateLimit = createRateLimiter('test', 1, 60_000)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(true)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(true)
  })

  it('tracks limits independently per IP', async () => {
    const checkRateLimit = createRateLimiter('test', 1, 60_000)
    expect((await checkRateLimit('1.1.1.1')).allowed).toBe(true)
    expect((await checkRateLimit('2.2.2.2')).allowed).toBe(true)
    expect((await checkRateLimit('1.1.1.1')).allowed).toBe(false)
  })

  it('tracks limits independently per namespace (mesmo IP, endpoints diferentes)', async () => {
    const limitA = createRateLimiter('endpoint-a', 1, 60_000)
    const limitB = createRateLimiter('endpoint-b', 1, 60_000)
    expect((await limitA('1.1.1.1')).allowed).toBe(true)
    expect((await limitB('1.1.1.1')).allowed).toBe(true)
    expect((await limitA('1.1.1.1')).allowed).toBe(false)
  })
})

describe('createRateLimiter — Upstash Redis (distribuído)', () => {
  let createRateLimiter: typeof import('../rateLimit').createRateLimiter
  const fetchMock = vi.fn()

  beforeEach(async () => {
    vi.resetModules()
    process.env.UPSTASH_REDIS_REST_URL   = 'https://example.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ createRateLimiter } = await import('../rateLimit'))
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('allows when the INCR count is within the limit', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }],
    })
    const checkRateLimit = createRateLimiter('test', 5, 60_000)
    const result = await checkRateLimit('1.2.3.4')
    expect(result.allowed).toBe(true)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.upstash.io/pipeline')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer test-token')
    expect(JSON.parse(init.body)).toEqual([
      ['INCR', 'rl:test:1.2.3.4'],
      ['EXPIRE', 'rl:test:1.2.3.4', '60', 'NX'],
    ])
  })

  it('blocks when the INCR count exceeds the limit', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ result: 6 }, { result: 1 }],
    })
    const checkRateLimit = createRateLimiter('test', 5, 60_000)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(false)
  })

  it('fails closed (denies) when Upstash responds with a non-OK status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 })
    const checkRateLimit = createRateLimiter('test', 5, 60_000)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(false)
  })

  it('fails closed (denies) when the network call throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const checkRateLimit = createRateLimiter('test', 5, 60_000)
    expect((await checkRateLimit('1.2.3.4')).allowed).toBe(false)
  })
})
