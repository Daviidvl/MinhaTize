import { describe, it, expect, afterEach, vi } from 'vitest'
import { toDateStr, todayStr, addDays, diffDays, weekdayOf, getMondayOf, getWeekDays } from '../dateUtils'

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

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('counts calendar days between dates, signed', () => {
    expect(diffDays('2026-11-11', '2026-11-11')).toBe(0)
    expect(diffDays('2026-11-11', '2026-11-04')).toBe(7)
    expect(diffDays('2026-11-04', '2026-11-11')).toBe(-7)
    expect(diffDays('2027-01-01', '2026-12-31')).toBe(1)
  })

  it('reads the weekday of a date string without timezone drift', () => {
    expect(weekdayOf('2026-10-25')).toBe(0) // domingo
    expect(weekdayOf('2026-10-26')).toBe(1) // segunda
  })

  it('finds the Monday of the week (Sunday belongs to the week that started on Monday)', () => {
    expect(getMondayOf(new Date(2026, 9, 25, 12))).toBe('2026-10-19') // domingo
    expect(getMondayOf(new Date(2026, 9, 26, 12))).toBe('2026-10-26') // segunda
    expect(getMondayOf(new Date(2026, 9, 28, 23, 59))).toBe('2026-10-26') // quarta à noite
  })

  it('lists the 7 days of the current week, Sunday first', () => {
    const days = getWeekDays(new Date(2026, 9, 28, 15)).map(toDateStr)
    expect(days).toEqual([
      '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31',
    ])
  })
})
