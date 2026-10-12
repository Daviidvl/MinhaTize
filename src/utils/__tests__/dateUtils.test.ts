import { describe, it, expect, afterEach, vi } from 'vitest'
import { toDateStr, todayStr } from '../dateUtils'
import { toDateStr as calendarToDateStr } from '../applicationCalendarUtils'
import { toDateStr as exerciseToDateStr } from '../exerciseUtils'

describe('dateUtils', () => {
  afterEach(() => { vi.useRealTimers() })

  it('formats the calendar date in the device timezone, zero-padded', () => {
    expect(toDateStr(new Date(2026, 0, 5, 9, 30))).toBe('2026-01-05')
    expect(toDateStr(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })

  // O bug original: toISOString() é UTC, então um registro feito tarde da noite
  // (fuso negativo, como o do Brasil) saía com a data do dia seguinte.
  it('does not roll over to the next day late at night', () => {
    const lateNight = new Date(2026, 9, 12, 23, 30)
    vi.useFakeTimers()
    vi.setSystemTime(lateNight)
    expect(todayStr()).toBe('2026-10-12')
  })

  it('does not roll back to the previous day just after midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 13, 0, 5))
    expect(todayStr()).toBe('2026-10-13')
  })

  it('is the single implementation used by the calendar and exercise utils', () => {
    expect(calendarToDateStr).toBe(toDateStr)
    expect(exerciseToDateStr).toBe(toDateStr)
  })
})
