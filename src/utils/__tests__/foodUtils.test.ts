import { describe, it, expect } from 'vitest'
import {
  waterGoalMl, waterTotal, mealDays, waterDays, calcDayStreak,
} from '../foodUtils'

describe('waterGoalMl', () => {
  it('uses 35 ml per kg, rounded to the nearest 50 ml', () => {
    expect(waterGoalMl(80)).toBe(2800)
    expect(waterGoalMl(82)).toBe(2850)
  })
})

describe('waterTotal', () => {
  it('sums the entries of the day', () => {
    expect(waterTotal([200, 300, 500])).toBe(1000)
  })

  it('is 0 for a day with no entries', () => {
    expect(waterTotal(undefined)).toBe(0)
  })
})

describe('mealDays', () => {
  const required = ['cafe', 'almoco', 'jantar']

  it('keeps only the days with every required meal', () => {
    const log = {
      '2026-10-12': { meals: ['cafe', 'almoco', 'jantar', 'ceia'], manual: [] },
      '2026-10-13': { meals: ['cafe', 'lanche-m', 'jantar'], manual: [] },
    }
    expect(mealDays(log, required)).toEqual(['2026-10-12'])
  })
})

describe('waterDays', () => {
  it('keeps only the days that reached the goal', () => {
    const log = { '2026-10-12': [1000, 1000, 800], '2026-10-13': [500, 500] }
    expect(waterDays(log, 2800)).toEqual(['2026-10-12'])
  })
})

describe('calcDayStreak', () => {
  // Quarta, 14/10/2026
  const NOW = new Date(2026, 9, 14, 12)

  it('returns 0 with no days', () => {
    expect(calcDayStreak([], NOW)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(calcDayStreak(['2026-10-12', '2026-10-13', '2026-10-14'], NOW)).toBe(3)
  })

  it('does not break the streak while today is still open', () => {
    expect(calcDayStreak(['2026-10-12', '2026-10-13'], NOW)).toBe(2)
  })

  it('stops at the first missing day', () => {
    expect(calcDayStreak(['2026-10-10', '2026-10-12', '2026-10-13'], NOW)).toBe(2)
  })
})
