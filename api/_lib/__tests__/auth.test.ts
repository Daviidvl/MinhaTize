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

const { UUID_RE, getClientIp, extractBearerToken, isActiveToken } = await import('../auth')

function makeReq(headers: Record<string, string>): VercelRequest {
  return { headers } as unknown as VercelRequest
}

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

  it('returns true when an active token row exists', async () => {
    maybeSingle.mockResolvedValue({ data: { id: '1' }, error: null })
    expect(await isActiveToken('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
  })

  it('returns false when no row is found', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await isActiveToken('123e4567-e89b-42d3-a456-426614174000')).toBe(false)
  })
})
