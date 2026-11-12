import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFlash } from '../useFlash'

describe('useFlash', () => {
  afterEach(() => { vi.useRealTimers() })

  it('turns on and switches itself off after the delay', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useFlash(2000))
    expect(result.current[0]).toBe(false)
    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)
    act(() => { vi.advanceTimersByTime(1999) })
    expect(result.current[0]).toBe(true)
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current[0]).toBe(false)
  })

  it('restarts the countdown on a new flash', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useFlash(1000))
    act(() => result.current[1]())
    act(() => { vi.advanceTimersByTime(800) })
    act(() => result.current[1]())
    act(() => { vi.advanceTimersByTime(800) })
    expect(result.current[0]).toBe(true)
    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current[0]).toBe(false)
  })

  it('cancels the timer when unmounted', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => useFlash(1000))
    act(() => result.current[1]())
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
