import { describe, it, expect, beforeEach } from 'vitest'
import {
  getWorkoutPlan, getSplitDays, readWorkoutPlan, saveWorkoutProfile, WORKOUT_SCHEDULE,
  calcStreak, getMotivation,
  getWeeklyStats, calcBestStreak, getFavoriteDay, getEvolutionInsight, isWorkoutComplete,
  summarizeDay, nextWorkoutLabel, plannedLabel, focusWorkoutLabel,
} from '../exerciseUtils'
import { toDateStr } from '../dateUtils'

describe('focusWorkoutLabel', () => {
  const L = ['A', 'B', 'C']
  const S = [1, 3, 5]  // seg, qua, sex
  const done = (label: string) => ({ label, done: 5, total: 5 })

  it('maps scheduled weekdays to workouts', () => {
    expect(plannedLabel(S, L, '2026-11-11')).toBe('B')  // quarta
    expect(plannedLabel(S, L, '2026-11-10')).toBeUndefined()  // terça
  })

  it('uses the workout already started today', () => {
    expect(focusWorkoutLabel({ '2026-11-11': { label: 'C', done: 1, total: 5 } }, L, S, '2026-11-11')).toBe('C')
  })

  it('follows the schedule on planned days, even after a skipped one', () => {
    expect(focusWorkoutLabel({}, L, S, '2026-11-11')).toBe('B')
  })

  it('suggests the next of the rotation on rest days', () => {
    expect(focusWorkoutLabel({ '2026-11-09': done('A') }, L, S, '2026-11-10')).toBe('B')
  })
})

describe('summarizeDay', () => {
  const W = [{ label: 'A', total: 3 }, { label: 'B', total: 2 }]

  it('is null when nothing is checked', () => {
    expect(summarizeDay(W, {})).toBeNull()
    expect(summarizeDay(W, { A: [] })).toBeNull()
  })

  it('prefers a complete workout over a more advanced partial one', () => {
    expect(summarizeDay(W, { A: [0, 1], B: [0, 1] })).toEqual({ label: 'B', done: 2, total: 2 })
  })

  it('picks the most advanced workout, breaking ties by the last touched', () => {
    expect(summarizeDay(W, { A: [0, 1], B: [0] })).toEqual({ label: 'A', done: 2, total: 3 })
    expect(summarizeDay(W, { A: [0], B: [1] }, 'B')).toEqual({ label: 'B', done: 1, total: 2 })
  })

  it('ignores stale indexes beyond the workout size', () => {
    expect(summarizeDay(W, { B: [0, 5] })).toEqual({ label: 'B', done: 1, total: 2 })
  })
})

describe('nextWorkoutLabel', () => {
  const L = ['A', 'B', 'C']

  it('starts at the first workout without history', () => {
    expect(nextWorkoutLabel({}, L, '2026-11-10')).toBe('A')
  })

  it('follows the last completed workout and wraps around', () => {
    expect(nextWorkoutLabel({ '2026-11-08': { label: 'A', done: 5, total: 5 } }, L, '2026-11-10')).toBe('B')
    expect(nextWorkoutLabel({ '2026-11-08': { label: 'C', done: 5, total: 5 } }, L, '2026-11-10')).toBe('A')
  })

  it('repeats a workout left unfinished and ignores today and later', () => {
    const h = {
      '2026-11-07': { label: 'A', done: 5, total: 5 },
      '2026-11-09': { label: 'B', done: 2, total: 5 },
      '2026-11-10': { label: 'B', done: 5, total: 5 },
    }
    expect(nextWorkoutLabel(h, L, '2026-11-10')).toBe('B')
  })

  it('falls back to the first workout when the last label left the plan', () => {
    expect(nextWorkoutLabel({ '2026-11-08': { label: 'E', done: 5, total: 5 } }, L, '2026-11-10')).toBe('A')
  })
})

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

// O plano por dia da semana vem dos mesmos dados da tela de treino (SPLITS)
describe('getWorkoutPlan', () => {
  beforeEach(() => { localStorage.clear() })

  it('maps each scheduled weekday to the workout of the split', () => {
    const plan = getWorkoutPlan({ sex: 'M', level: 'beginner', location: 'gym', days: 3 })
    expect(Object.keys(plan).map(Number)).toEqual(WORKOUT_SCHEDULE[3])
    expect(plan[1]).toEqual({ label: 'A', name: 'Peito + Tríceps' })
    expect(plan[5]).toEqual({ label: 'C', name: 'Pernas + Core' })
  })

  it('has one workout per scheduled day for every split', () => {
    for (const days of [2, 3, 4, 5] as const) {
      for (const sex of ['M', 'F'] as const) {
        const wp = { sex, level: 'beginner' as const, location: 'home' as const, days }
        expect(getSplitDays(wp)).toHaveLength(days)
        expect(Object.keys(getWorkoutPlan(wp))).toHaveLength(days)
      }
    }
  })

  it('is empty without a saved plan, and reads the saved one', () => {
    expect(readWorkoutPlan()).toEqual({})
    saveWorkoutProfile({ sex: 'F', level: 'advanced', location: 'gym', days: 2 })
    expect(readWorkoutPlan()).toEqual({ 1: { label: 'A', name: 'Glúteos + Pernas' }, 4: { label: 'B', name: 'Superior + Core' } })
  })
})
