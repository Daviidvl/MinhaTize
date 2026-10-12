import { describe, it, expect } from 'vitest'
import {
  calcStreak, getMotivation, toDateStr,
  getWeeklyStats, calcBestStreak, getFavoriteDay, getEvolutionInsight, isWorkoutComplete,
} from '../exerciseUtils'

describe('toDateStr', () => {
  it('uses the local date, even late at night', () => {
    expect(toDateStr(new Date(2026, 9, 15, 23, 30))).toBe('2026-10-15')
  })
})

describe('isWorkoutComplete', () => {
  it('is false while any exercise is unchecked', () => {
    expect(isWorkoutComplete([0, 2], 3)).toBe(false)
    expect(isWorkoutComplete(undefined, 3)).toBe(false)
  })

  it('is true once every exercise is checked, in any order', () => {
    expect(isWorkoutComplete([2, 0, 1], 3)).toBe(true)
  })

  it('is false for a workout with no exercises', () => {
    expect(isWorkoutComplete([], 0)).toBe(false)
  })
})

// Quarta, 14/10/2026 — a semana (dom–sáb) começa em 11/10
const NOW = new Date(2026, 9, 14, 12)
const LOG = ['2026-10-12', '2026-10-13', '2026-10-05', '2026-09-20']

describe('getWeeklyStats', () => {
  it('counts workouts per week, oldest first', () => {
    expect(getWeeklyStats(LOG, [], 4, NOW).map(s => s.workouts)).toEqual([1, 0, 1, 2])
  })

  it('carries the last known weight forward and flags weeks with a weigh-in', () => {
    const weights = [{ date: '2026-10-06', weight: 88 }, { date: '2026-09-01', weight: 90 }]
    const stats = getWeeklyStats([], weights, 4, NOW)
    expect(stats.map(s => s.weight)).toEqual([90, 90, 88, 88])
    expect(stats.map(s => s.weighed)).toEqual([false, false, true, false])
  })

  it('leaves weight null before the first record', () => {
    const stats = getWeeklyStats([], [{ date: '2026-10-06', weight: 88 }], 3, NOW)
    expect(stats.map(s => s.weight)).toEqual([null, 88, 88])
  })
})

describe('calcBestStreak', () => {
  it('returns 0 for an empty log', () => {
    expect(calcBestStreak([], NOW)).toBe(0)
  })

  it('finds the longest run of consecutive weeks', () => {
    expect(calcBestStreak(LOG, NOW)).toBe(2)
  })
})

describe('getFavoriteDay', () => {
  it('returns null for an empty log', () => {
    expect(getFavoriteDay([])).toBeNull()
  })

  it('returns the most trained weekday', () => {
    expect(getFavoriteDay(LOG)).toBe(1)
  })
})

describe('getEvolutionInsight', () => {
  it('asks for the first log when there are no workouts', () => {
    expect(getEvolutionInsight(0, 3, 0, 0)).toContain('Marque todos os exercícios')
  })

  it('ties weight loss to consistency when the target is met in most weeks', () => {
    expect(getEvolutionInsight(10, 3.5, 3, 4)).toContain('3.5kg a menos')
  })
})

describe('calcStreak', () => {
  it('returns 0 for an empty log', () => {
    expect(calcStreak([])).toBe(0)
  })

  it('counts the current week when at least one workout is logged', () => {
    expect(calcStreak([toDateStr(new Date())])).toBeGreaterThanOrEqual(1)
  })
})

describe('getMotivation', () => {
  it('celebrates a 12+ week streak above all else', () => {
    expect(getMotivation(0, 3, 12)).toContain('Três meses seguidos')
  })

  it('encourages the first log of the week when nothing is done yet', () => {
    expect(getMotivation(0, 3, 0)).toBe('A primeira marcação da semana faz toda a diferença.')
  })

  it('celebrates hitting the weekly target', () => {
    expect(getMotivation(3, 3, 1)).toBe('Meta da semana batida. Você arrasou.')
  })

  it('nudges when one workout remains to hit the target', () => {
    expect(getMotivation(3, 4, 1)).toBe('Falta só um treino para bater a meta da semana.')
  })
})
