import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readJSON, writeJSON, readRaw, writeRaw, removeKey } from '../storage'

describe('readJSON', () => {
  beforeEach(() => localStorage.clear())

  it('returns the fallback when the key is missing', () => {
    expect(readJSON('missing', { a: 1 })).toEqual({ a: 1 })
  })

  it('parses and returns stored JSON', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }))
    expect(readJSON('k', null)).toEqual({ a: 1 })
  })

  it('returns the fallback when the stored value is corrupted JSON', () => {
    localStorage.setItem('k', '{not valid json')
    expect(readJSON('k', 'fallback')).toBe('fallback')
  })

  it('logs a warning instead of throwing when localStorage.getItem fails', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => readJSON('k', 'fallback')).not.toThrow()
    expect(readJSON('k', 'fallback')).toBe('fallback')
    expect(warnSpy).toHaveBeenCalled()

    getItemSpy.mockRestore()
    warnSpy.mockRestore()
  })
})

describe('writeJSON', () => {
  beforeEach(() => localStorage.clear())

  it('stores the value as JSON and returns true', () => {
    expect(writeJSON('k', { a: 1 })).toBe(true)
    expect(localStorage.getItem('k')).toBe(JSON.stringify({ a: 1 }))
  })

  it('returns false and logs a warning instead of throwing on quota errors', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(writeJSON('k', { a: 1 })).toBe(false)
    expect(warnSpy).toHaveBeenCalled()

    setItemSpy.mockRestore()
    warnSpy.mockRestore()
  })
})

describe('readRaw / writeRaw', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a plain string value', () => {
    writeRaw('theme', 'dark')
    expect(readRaw('theme')).toBe('dark')
  })

  it('returns null for a missing key', () => {
    expect(readRaw('missing')).toBeNull()
  })
})

describe('removeKey', () => {
  beforeEach(() => localStorage.clear())

  it('removes the key and returns true', () => {
    localStorage.setItem('k', 'v')
    expect(removeKey('k')).toBe(true)
    expect(localStorage.getItem('k')).toBeNull()
  })
})
