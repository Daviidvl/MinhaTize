import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest } from '@vercel/node'

const maybeSingle = vi.fn()
vi.mock('../supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    }),
  }),
}))

const { UUID_RE, getClientIp, extractBearerToken, isActiveToken, secretsMatch } = await import('../auth')

function makeReq(headers: Record<string, string>): VercelRequest {
  return { headers } as unknown as VercelRequest
}

describe('secretsMatch', () => {
  it('accepts only the exact secret', () => {
    expect(secretsMatch('s3cret-value', 's3cret-value')).toBe(true)
    expect(secretsMatch('s3cret-valuE', 's3cret-value')).toBe(false)
    expect(secretsMatch('s3cret-value ', 's3cret-value')).toBe(false)
  })

  // Mesmo número de caracteres, mais bytes: timingSafeEqual sobre os textos
  // lançaria RangeError (500) em vez de recusar
  it('refuses without throwing when the input has as many characters but more bytes', () => {
    expect(() => secretsMatch('s3cret-valué', 's3cret-value')).not.toThrow()
    expect(secretsMatch('s3cret-valué', 's3cret-value')).toBe(false)
  })

  it('never matches when no secret is configured or the input is not a non-empty string', () => {
    expect(secretsMatch('', '')).toBe(false)
    expect(secretsMatch('anything', undefined)).toBe(false)
    expect(secretsMatch(undefined, 's3cret')).toBe(false)
    expect(secretsMatch({ toString: () => 's3cret' }, 's3cret')).toBe(false)
    expect(secretsMatch(['s3cret'], 's3cret')).toBe(false)
  })
})

describe('UUID_RE', () => {
  it('matches a valid UUID v4', () => {
    expect(UUID_RE.test('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
  })

  it('rejects malformed strings', () => {
    expect(UUID_RE.test('not-a-uuid')).toBe(false)
    expect(UUID_RE.test('')).toBe(false)
  })
})

describe('getClientIp', () => {
  it('returns the first IP from x-forwarded-for', () => {
    expect(getClientIp(makeReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
  })

  it('returns empty string when header is absent', () => {
    expect(getClientIp(makeReq({}))).toBe('')
  })
})

describe('extractBearerToken', () => {
  it('extracts the token from a Bearer header', () => {
    expect(extractBearerToken(makeReq({ authorization: 'Bearer abc123' }))).toBe('abc123')
  })

  it('returns empty string when header is missing or malformed', () => {
    expect(extractBearerToken(makeReq({}))).toBe('')
    expect(extractBearerToken(makeReq({ authorization: 'Basic abc123' }))).toBe('')
  })
})

describe('isActiveToken', () => {
  beforeEach(() => {
    maybeSingle.mockReset()
  })

  it('returns true when an active token row exists with no expiration', async () => {
    maybeSingle.mockResolvedValue({ data: { id: '1', expires_at: null }, error: null })
    expect(await isActiveToken('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
  })

  it('returns true when the token has a future expiration', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    maybeSingle.mockResolvedValue({ data: { id: '1', expires_at: future }, error: null })
    expect(await isActiveToken('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
  })

  it('returns false when the token has already expired', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString()
    maybeSingle.mockResolvedValue({ data: { id: '1', expires_at: past }, error: null })
    expect(await isActiveToken('123e4567-e89b-42d3-a456-426614174000')).toBe(false)
  })

  it('returns false when no row is found', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await isActiveToken('123e4567-e89b-42d3-a456-426614174000')).toBe(false)
  })

  it('returns false and logs when Supabase returns an error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await isActiveToken('123e4567-e89b-42d3-a456-426614174000')).toBe(false)
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
