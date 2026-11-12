import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { hasConsent, saveConsent, readConsent, revokeConsent } from '../consent'
import { saveToken } from '../token'
import { STORAGE_KEYS } from '../storageKeys'

const TOKEN = '123e4567-e89b-42d3-a456-426614174000'

describe('consent', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('is missing until accepted, and an old terms version does not count', () => {
    expect(hasConsent()).toBe(false)
    localStorage.setItem(STORAGE_KEYS.consent, JSON.stringify({ version: '1.0', date: '2026-06-01' }))
    expect(hasConsent()).toBe(false)
  })

  it('saves locally and registers on the server with the token in the header only', () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}')))
    vi.stubGlobal('fetch', fetchMock)
    saveToken(TOKEN)
    saveConsent()
    expect(hasConsent()).toBe(true)
    expect(readConsent()?.date).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/register-consent')
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`)
    expect(String(init.body)).not.toContain(TOKEN)
  })

  it('keeps the local consent when the server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    saveToken(TOKEN)
    saveConsent()
    await Promise.resolve()
    expect(hasConsent()).toBe(true)
  })

  it('revoking erases consent and health data but keeps the access token', () => {
    saveToken(TOKEN)
    localStorage.setItem(STORAGE_KEYS.consent, JSON.stringify({ version: '1.1' }))
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ name: 'Ana' }))
    localStorage.setItem(STORAGE_KEYS.waterLog, JSON.stringify({ '2026-11-11': [200] }))
    revokeConsent()
    expect(localStorage.getItem(STORAGE_KEYS.consent)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.waterLog)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBe(TOKEN)
  })
})
