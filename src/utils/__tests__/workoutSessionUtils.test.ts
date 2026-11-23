import { describe, it, expect, beforeEach } from 'vitest'
import {
  READY_MS, MAX_SET_MS, AUTO_PAUSE_MS,
  parseRange, parseSeconds, setOptions, holdSecs, buildSessionPlan, estimatePlan, estimateKcal,
  startSession, tick, completeSet, startSet, addRest, skipExercise, pauseSession, resumeSession, finishSession,
  phaseRemaining, sessionElapsed, completedExercises, isBetweenExercises, totalSetsDone,
  summarizeSession, sessionTotals, phaseCue, fmtClock, fmtCountdown, fmtDuration, spokenSecs, spokenReps,
  readActiveSession, saveActiveSession, clearActiveSession, appendSession, readSessions,
  readWorkoutPrefs, saveWorkoutPrefs,
  type SessionPlan, type WorkoutSessionRecord,
} from '../workoutSessionUtils'

const T0 = 1_700_000_000_000
const S  = 1000

type PlanOpts = Parameters<typeof buildSessionPlan>[2]

function plan(over: Partial<PlanOpts> = {}): SessionPlan {
  return buildSessionPlan(
    { label: 'A', name: 'Peito + Tríceps' },
    [{ name: 'Supino' }, { name: 'Prancha', secs: [30, 45] }],
    { level: 'intermediate', sets: 2, reps: '8–12', restSecs: 60, ...over },
  )
}

describe('parsing', () => {
  it('reads ranges and durations', () => {
    expect(parseRange('2–3')).toEqual([2, 3])
    expect(parseRange('12')).toEqual([12, 12])
    expect(parseRange('')).toEqual([0, 0])
    expect(parseSeconds('60s')).toBe(60)
    expect(parseSeconds('2min')).toBe(120)
    expect(setOptions('3–4')).toEqual([3, 4])
    expect(setOptions('')).toEqual([3])
  })

  it('picks the hold time by level', () => {
    expect(holdSecs([30, 45], 'beginner')).toBe(30)
    expect(holdSecs([30, 45], 'intermediate')).toBe(40)
    expect(holdSecs([30, 45], 'advanced')).toBe(45)
  })

  it('builds timed and rep-based exercises', () => {
    const p = plan()
    expect(p.exercises[0]).toMatchObject({ name: 'Supino', sets: 2, reps: '8–12' })
    expect(p.exercises[0].secs).toBeUndefined()
    expect(p.exercises[1].secs).toBe(40)
  })
})

describe('calories', () => {
  it('uses MET × 3.5 × kg / 200 per minute', () => {
    // 10 min a 5,0 MET + 20 min a 2,0 MET, 80 kg → (50 + 40) × 3,5 × 80 / 200 = 126
    expect(estimateKcal(600, 1200, 80, 'intermediate')).toBe(126)
  })

  it('is zero without a weight', () => {
    expect(estimateKcal(600, 600, 0, 'beginner')).toBe(0)
  })

  it('estimates the plan before starting', () => {
    const e = estimatePlan(plan(), 80)
    // Supino: 2 × (10 reps × 3 s) · Prancha: 2 × 40 s
    expect(e.workSecs).toBe(140)
    // Preparação + 3 descansos de 60 s
    expect(e.restSecs).toBe(READY_MS / 1000 + 180)
    expect(e.totalSecs).toBe(e.workSecs + e.restSecs)
    expect(e.kcal).toBeGreaterThan(0)
  })
})

describe('session flow', () => {
  it('goes ready → work → rest → work → … → done', () => {
    let s = startSession(plan(), '2026-11-23', T0)
    expect(s.phase).toBe('ready')

    // Preparação acaba sozinha e a série começa no instante exato do fim
    s = tick(s, T0 + READY_MS + 500)
    expect(s).toMatchObject({ phase: 'work', ex: 0, set: 1, phaseAt: T0 + READY_MS, phaseLen: 0 })

    s = completeSet(s, T0 + READY_MS + 30 * S)
    expect(s).toMatchObject({ phase: 'rest', ex: 0, set: 2 })
    expect(isBetweenExercises(s)).toBe(false)
    expect(s.setsDone).toEqual([1, 0])

    // Descanso acaba sozinho
    s = tick(s, T0 + READY_MS + 95 * S)
    expect(s).toMatchObject({ phase: 'work', ex: 0, set: 2 })

    s = completeSet(s, T0 + READY_MS + 120 * S)
    expect(s).toMatchObject({ phase: 'rest', ex: 1, set: 1 })
    expect(isBetweenExercises(s)).toBe(true)
    expect(completedExercises(s)).toEqual([0])

    // Pular descanso → prancha (isometria cronometrada)
    s = startSet(s, T0 + READY_MS + 150 * S)
    expect(s).toMatchObject({ phase: 'work', ex: 1, phaseLen: 40 * S })

    // Duas séries de prancha passam sozinhas (com o descanso entre elas)
    s = tick(s, T0 + READY_MS + 150 * S + 40 * S + 60 * S + 40 * S)
    expect(s.phase).toBe('done')
    expect(s.setsDone).toEqual([2, 2])
    expect(totalSetsDone(s)).toBe(4)
    expect(s.endedAt).toBe(T0 + READY_MS + 290 * S)
  })

  it('accounts work and rest time without gaps', () => {
    let s = startSession(plan({ sets: 1 }), '2026-11-23', T0)
    s = startSet(s, T0 + 4 * S)               // 4 s de preparação
    s = completeSet(s, T0 + 34 * S)           // 30 s de execução
    s = tick(s, T0 + 94 * S)                  // 60 s de descanso → prancha
    s = tick(s, T0 + 134 * S)                 // 40 s de prancha → fim
    expect(s.phase).toBe('done')
    expect(s.workMs).toBe(70 * S)
    expect(s.restMs).toBe(64 * S)
    expect(sessionElapsed(s, T0 + 999 * S)).toBe(134 * S)
  })

  it('adds rest time on demand', () => {
    let s = startSession(plan(), '2026-11-23', T0)
    s = startSet(s, T0)
    s = completeSet(s, T0 + 10 * S)
    s = addRest(s, 15 * S)
    expect(phaseRemaining(s, T0 + 10 * S)).toBe(75 * S)
    expect(tick(s, T0 + 80 * S).phase).toBe('rest')
    expect(tick(s, T0 + 85 * S).phase).toBe('work')
  })

  it('skips to the next exercise, or finishes on the last one', () => {
    let s = startSession(plan(), '2026-11-23', T0)
    s = startSet(s, T0)
    s = skipExercise(s, T0 + 5 * S)
    expect(s).toMatchObject({ phase: 'ready', ex: 1, set: 1, phaseLen: READY_MS })
    expect(s.setsDone).toEqual([0, 0])
    s = skipExercise(s, T0 + 6 * S)
    expect(s.phase).toBe('done')
  })

  it('pauses: timers freeze and paused time is not counted', () => {
    let s = startSession(plan(), '2026-11-23', T0)
    s = startSet(s, T0)
    s = completeSet(s, T0 + 30 * S)                    // descanso de 60 s começa
    s = pauseSession(s, T0 + 40 * S)
    expect(phaseRemaining(s, T0 + 500 * S)).toBe(50 * S)
    expect(tick(s, T0 + 500 * S)).toBe(s)              // pausado não avança
    expect(completeSet(s, T0 + 500 * S)).toBe(s)
    s = resumeSession(s, T0 + 340 * S)                 // 300 s de pausa
    expect(phaseRemaining(s, T0 + 340 * S)).toBe(50 * S)
    expect(sessionElapsed(s, T0 + 340 * S)).toBe(40 * S)
  })

  it('finishing while paused ignores the trailing pause', () => {
    let s = startSession(plan(), '2026-11-23', T0)
    s = startSet(s, T0)
    s = pauseSession(s, T0 + 20 * S)
    s = finishSession(s, T0 + 3_600 * S)
    expect(s).toMatchObject({ phase: 'done', endedAt: T0 + 20 * S, workMs: 20 * S })
    expect(sessionElapsed(s, T0 + 9_999 * S)).toBe(20 * S)
  })

  it('caps a forgotten set and auto-pauses an abandoned workout', () => {
    let s = startSession(plan(), '2026-11-23', T0)
    s = startSet(s, T0)
    s = tick(s, T0 + AUTO_PAUSE_MS + 60 * S)
    expect(s.pausedAt).toBe(T0 + AUTO_PAUSE_MS)
    s = finishSession(s, T0 + 5 * 3_600 * S)
    expect(s.workMs).toBe(MAX_SET_MS)
    expect(s.restMs).toBe(AUTO_PAUSE_MS - MAX_SET_MS)
    expect(sessionElapsed(s, T0)).toBe(AUTO_PAUSE_MS)
  })
})

describe('summary', () => {
  it('summarizes time, sets and calories', () => {
    let s = startSession(plan({ sets: 1 }), '2026-11-23', T0)
    s = startSet(s, T0 + 10 * S)
    s = completeSet(s, T0 + 40 * S)
    s = finishSession(s, T0 + 70 * S)
    const r = summarizeSession(s, 80)
    expect(r).toMatchObject({
      date: '2026-11-23', label: 'A', totalSecs: 70, workSecs: 30, restSecs: 40,
      sets: 1, setsPlanned: 2, exercises: 1, exercisesTotal: 2, weightKg: 80,
    })
    expect(r.kcal).toBe(estimateKcal(30, 40, 80, 'intermediate'))
  })

  it('sums sessions since a date', () => {
    const r = (date: string, totalSecs: number, kcal: number) => ({ date, totalSecs, kcal }) as WorkoutSessionRecord
    expect(sessionTotals([r('2026-10-01', 999, 99), r('2026-11-20', 1800, 150), r('2026-11-22', 2400, 210)], '2026-11-01'))
      .toEqual({ count: 2, totalSecs: 4200, kcal: 360 })
  })
})

describe('texts', () => {
  it('formats clocks and durations', () => {
    expect(fmtClock(65_000)).toBe('1:05')
    expect(fmtClock(3_725_000)).toBe('1:02:05')
    expect(fmtCountdown(4_100)).toBe('0:05')
    expect(fmtCountdown(0)).toBe('0:00')
    expect(fmtDuration(45)).toBe('45 s')
    expect(fmtDuration(2520)).toBe('42 min')
    expect(fmtDuration(3900)).toBe('1 h 05 min')
  })

  it('speaks in Portuguese', () => {
    expect(spokenSecs(45)).toBe('45 segundos')
    expect(spokenSecs(60)).toBe('1 minuto')
    expect(spokenSecs(90)).toBe('1 minuto e 30 segundos')
    expect(spokenSecs(120)).toBe('2 minutos')
    expect(spokenReps('8–12')).toBe('8 a 12')
  })

  it('cues each phase like a trainer', () => {
    let s = startSession(plan(), '2026-11-23', T0)
    expect(phaseCue(s)).toMatch(/^Vamos lá! Treino A\. Primeiro exercício: Supino\. 2 séries de 8 a 12 repetições/)
    s = startSet(s, T0)
    expect(phaseCue(s)).toBe('Série 1 de 2. 8 a 12 repetições. Vai!')
    s = completeSet(s, T0 + 30 * S)
    expect(phaseCue(s)).toBe('Boa! Descanse 1 minuto.')
    s = startSet(s, T0 + 40 * S)
    expect(phaseCue(s)).toBe('Última série! 8 a 12 repetições. Capricha!')
    s = completeSet(s, T0 + 70 * S)
    expect(phaseCue(s)).toBe('Exercício concluído! Descanse 1 minuto. Próximo: Prancha.')
    s = startSet(s, T0 + 80 * S)
    expect(phaseCue(s)).toBe('Série 1 de 2. Segure 40 segundos. Vai!')
  })
})

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('resumes only an unfinished session from today', () => {
    const s = startSession(plan(), '2026-11-23', T0)
    saveActiveSession(s)
    expect(readActiveSession('2026-11-23')).toEqual(s)
    expect(readActiveSession('2026-11-24')).toBeNull()
    saveActiveSession(finishSession(s, T0 + S))
    expect(readActiveSession('2026-11-23')).toBeNull()
    clearActiveSession()
    expect(readActiveSession('2026-11-23')).toBeNull()
  })

  it('appends session records', () => {
    const r = { date: '2026-11-23', label: 'A' } as WorkoutSessionRecord
    expect(appendSession(r)).toEqual([r])
    expect(appendSession(r)).toHaveLength(2)
    expect(readSessions()).toHaveLength(2)
  })

  it('keeps preferences with voice on by default', () => {
    expect(readWorkoutPrefs()).toEqual({ voice: true })
    saveWorkoutPrefs({ voice: false, sets: 3, restSecs: 90 })
    expect(readWorkoutPrefs()).toEqual({ voice: false, sets: 3, restSecs: 90 })
  })
})
