import { describe, it, expect } from 'vitest'
import { getGlobalNextApp, calcStreak, calcAdherence, toDateStr } from '../applicationCalendarUtils'

describe('getGlobalNextApp', () => {
  it('returns today when today is the application day', () => {
    // 2026-07-18 is a Saturday (day 6)
    expect(getGlobalNextApp(6, '2026-07-18')).toBe('2026-07-18')
  })

  it('returns the next occurrence of the application day', () => {
    // 2026-07-18 (Sat) -> next Monday (day 1) is 2026-07-20
    expect(getGlobalNextApp(1, '2026-07-18')).toBe('2026-07-20')
  })
})

describe('calcStreak', () => {
  it('counts consecutive confirmed weekly applications up to today', () => {
    const todayStr = '2026-07-18' // Saturday
    const confirmed = new Set(['2026-07-18', '2026-07-11', '2026-07-04'])
    expect(calcStreak(confirmed, 6, todayStr)).toBe(3)
  })

  it('stops counting at the first missed week', () => {
    const todayStr = '2026-07-18'
    const confirmed = new Set(['2026-07-18', '2026-06-27']) // gap on 07-11 and 07-04
    expect(calcStreak(confirmed, 6, todayStr)).toBe(1)
  })

  it('returns 0 when the most recent scheduled date is not confirmed', () => {
    const todayStr = '2026-07-18'
    expect(calcStreak(new Set(), 6, todayStr)).toBe(0)
  })
})

describe('calcAdherence', () => {
  it('returns 100 when every scheduled date in the window was confirmed', () => {
    const todayStr = '2026-07-18'
    const confirmed = new Set(['2026-07-18', '2026-07-11'])
    expect(calcAdherence(confirmed, 6, todayStr, 2)).toBe(100)
  })

  it('returns a partial percentage when some dates were missed', () => {
    const todayStr = '2026-07-18'
    const confirmed = new Set(['2026-07-18'])
    expect(calcAdherence(confirmed, 6, todayStr, 2)).toBe(50)
  })

  it('returns 0 when there is nothing scheduled', () => {
    expect(calcAdherence(new Set(), 6, '2026-07-18', 0)).toBe(0)
  })
})

describe('toDateStr', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toDateStr(new Date('2026-07-18T12:00:00'))).toBe('2026-07-18')
  })
})
