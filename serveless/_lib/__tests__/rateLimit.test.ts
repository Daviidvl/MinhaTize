import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRateLimiter } from '../rateLimit'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests up to the limit', () => {
    const checkRateLimit = createRateLimiter(3, 60_000)
    expect(checkRateLimit('1.2.3.4')).toBe(true)
    expect(checkRateLimit('1.2.3.4')).toBe(true)
    expect(checkRateLimit('1.2.3.4')).toBe(true)
  })

  it('blocks requests once the limit is exceeded within the window', () => {
    const checkRateLimit = createRateLimiter(2, 60_000)
    expect(checkRateLimit('1.2.3.4')).toBe(true)
    expect(checkRateLimit('1.2.3.4')).toBe(true)
    expect(checkRateLimit('1.2.3.4')).toBe(false)
  })

  it('resets the count after the window elapses', () => {
    const checkRateLimit = createRateLimiter(1, 60_000)
    expect(checkRateLimit('1.2.3.4')).toBe(true)
    expect(checkRateLimit('1.2.3.4')).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect(checkRateLimit('1.2.3.4')).toBe(true)
  })

  it('tracks limits independently per IP', () => {
    const checkRateLimit = createRateLimiter(1, 60_000)
    expect(checkRateLimit('1.1.1.1')).toBe(true)
    expect(checkRateLimit('2.2.2.2')).toBe(true)
    expect(checkRateLimit('1.1.1.1')).toBe(false)
  })
})
