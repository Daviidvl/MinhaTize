import { describe, it, expect } from 'vitest'
import {
  getGlobalNextApp, calcStreak, calcAdherence, applicationWeek, isApplicationLate, lastApplicationDate,
} from '../applicationCalendarUtils'
import { UserProfile } from '../../types'
import { toDateStr } from '../dateUtils'

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

// Mesma leitura para os avisos do Início e para as notificações
describe('applicationWeek / isApplicationLate', () => {
  // Aplicação aos domingos (0); 2026-10-25 é domingo
  it('measures the days since the last scheduled date', () => {
    expect(applicationWeek(0, '2026-10-25', [])).toEqual({ offset: 0, lastScheduled: '2026-10-25', doneSince: false })
    expect(applicationWeek(0, '2026-10-27', [])).toMatchObject({ offset: 2, lastScheduled: '2026-10-25' })
  })

  it('counts a late application as done for the week', () => {
    expect(applicationWeek(0, '2026-10-27', ['2026-10-26']).doneSince).toBe(true)
    expect(applicationWeek(0, '2026-10-27', ['2026-10-24']).doneSince).toBe(false)
  })

  it('is late only for 3 days, for people who log applications, after the protocol start', () => {
    const log = ['2026-10-18']
    expect(isApplicationLate(applicationWeek(0, '2026-10-28', log), log, '2026-01-01')).toBe(true)
    expect(isApplicationLate(applicationWeek(0, '2026-10-29', log), log, '2026-01-01')).toBe(false)
    expect(isApplicationLate(applicationWeek(0, '2026-10-28', []), [], '2026-01-01')).toBe(false)
    expect(isApplicationLate(applicationWeek(0, '2026-10-28', log), log, '2026-10-26')).toBe(false)
  })
})

describe('lastApplicationDate', () => {
  const BASE: UserProfile = {
    name: 'Ana', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
    startDate: '2026-01-01', applicationDay: 0, weightHistory: [], diary: [], sideEffects: [],
  }

  it('is the latest logged date, or null when the log is empty', () => {
    expect(lastApplicationDate({ ...BASE, applicationLog: ['2026-10-11', '2026-10-25', '2026-10-18'] })).toBe('2026-10-25')
    // Aplicação apagada: o legado lastApplication não volta a valer
    expect(lastApplicationDate({ ...BASE, applicationLog: [], lastApplication: '2026-10-25' })).toBeNull()
  })

  it('falls back to the legacy lastApplication field', () => {
    expect(lastApplicationDate({ ...BASE, lastApplication: '2026-10-25' })).toBe('2026-10-25')
  })
})
