import { describe, it, expect } from 'vitest'
import {
  getDueReminders, buildPushSchedule, pruneReminderState, reminderUrl, MAX_PER_DAY,
  type ReminderContext, type PushScheduleInput,
} from '../reminderUtils'
import { DEFAULT_USAGE, type UsageProfile } from '../usageUtils'
import { UserProfile } from '../../types'

// 2026-10-25 é um domingo (dia 0)
const PROFILE: UserProfile = {
  name: 'Ana', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
  startDate: '2026-01-01', currentDose: 5, applicationDay: 0,
  weightHistory: [], diary: [], sideEffects: [],
}

// Sem água e com a pesagem num dia que não cai nos testes, para isolar cada regra
const QUIET: UsageProfile = { ...DEFAULT_USAGE, usesWater: false, weighInWeekday: 3 }

function ctx(over: Partial<ReminderContext> = {}, profile: Partial<UserProfile> = {}): ReminderContext {
  return {
    today: '2026-10-25', nowMin: 23 * 60, waterMl: 0, waterGoalMl: 0, workoutPlan: {}, workoutDoneToday: false,
    usage: QUIET, ...over, profile: { ...PROFILE, ...profile },
  }
}

const ids = (c: ReminderContext) => getDueReminders(c).map(r => r.id)

describe('getDueReminders — aplicação', () => {
  it('lembra no dia, na janela da manhã, sem citar a dose', () => {
    const [r] = getDueReminders(ctx())
    expect(r.id).toBe('application-2026-10-25')
    expect(r.at).toBe(QUIET.morningMin)
    expect(r.body).not.toContain('mg')
  })

  it('só conta depois que a hora da janela chega', () => {
    expect(ids(ctx({ nowMin: QUIET.morningMin - 1 }))).toEqual([])
  })

  it('some depois que a aplicação do dia é registrada', () => {
    expect(ids(ctx({}, { applicationLog: ['2026-10-25'] }))).toEqual([])
  })

  it('avisa da aplicação atrasada nos dias seguintes', () => {
    expect(ids(ctx({ today: '2026-10-27' }, { applicationLog: ['2026-10-18'] }))).toEqual(['application-late-2026-10-25'])
  })

  it('aceita a aplicação feita com atraso como a da semana', () => {
    expect(ids(ctx({ today: '2026-10-27' }, { applicationLog: ['2026-10-18', '2026-10-26'] }))).toEqual([])
  })

  it('não cobra atraso de quem não usa o calendário', () => {
    expect(ids(ctx({ today: '2026-10-27' }))).toEqual([])
  })

  it('avisa na véspera, na janela do fim do dia', () => {
    const [r] = getDueReminders(ctx({ today: '2026-10-24' }, { applicationLog: ['2026-10-18'] }))
    expect(r.id).toBe('application-eve-2026-10-24')
    expect(r.at).toBe(QUIET.eveningMin)
  })
})

describe('getDueReminders — hábitos', () => {
  const workoutPlan = { 1: { label: 'A', name: 'Peito + Tríceps' } }

  it('treino do dia ainda não feito, no fim do dia', () => {
    const r = getDueReminders(ctx({ today: '2026-10-26', workoutPlan }))
    expect(r.map(x => x.id)).toEqual(['workout-2026-10-26'])
    expect(r[0].at).toBe(QUIET.eveningMin)
    expect(ids(ctx({ today: '2026-10-26', workoutPlan, workoutDoneToday: true }))).toEqual([])
  })

  it('pesagem no dia em que a pessoa costuma se pesar, se não se pesou nos últimos dias', () => {
    const usage = { ...QUIET, weighInWeekday: 1 }
    expect(ids(ctx({ today: '2026-10-26', usage }))).toEqual(['weighIn-2026-10-26'])
    expect(ids(ctx({ today: '2026-10-26', usage }, { weightHistory: [{ date: '2026-10-25', weight: 80 }] }))).toEqual([])
  })

  it('água só para quem usa o registro e enquanto a meta não foi batida', () => {
    const c = { today: '2026-10-26', waterGoalMl: 2000 }
    expect(ids(ctx({ ...c, usage: { ...QUIET, usesWater: true } }))).toEqual(['water-2026-10-26'])
    expect(ids(ctx({ ...c, usage: { ...QUIET, usesWater: true }, waterMl: 2000 }))).toEqual([])
    expect(ids(ctx(c))).toEqual([])
  })
})

describe('getDueReminders — limite diário', () => {
  it(`no máximo ${MAX_PER_DAY} por dia, os mais importantes primeiro`, () => {
    // Segunda: véspera de nada, pesagem, treino e água disputando duas janelas
    const r = getDueReminders(ctx({
      today: '2026-10-26', waterGoalMl: 2000,
      workoutPlan: { 1: { label: 'A', name: 'Peito' } },
      usage: { ...QUIET, usesWater: true, weighInWeekday: 1 },
    }))
    expect(r.map(x => x.id)).toEqual(['weighIn-2026-10-26', 'workout-2026-10-26'])
  })

  it('a pesagem não cai no fim do dia: se a manhã está ocupada, fica de fora', () => {
    // Domingo: aplicação ocupa a manhã
    const r = getDueReminders(ctx({ usage: { ...QUIET, weighInWeekday: 0 } }))
    expect(r.map(x => x.id)).toEqual(['application-2026-10-25'])
  })

  it('o treino vai para a manhã quando a véspera da aplicação ocupa o fim do dia', () => {
    const r = getDueReminders(ctx({ today: '2026-10-24', workoutPlan: { 6: { label: 'B', name: 'Costas' } } }, { applicationLog: ['2026-10-18'] }))
    expect(r.map(x => [x.id, x.at])).toEqual([
      ['workout-2026-10-24', QUIET.morningMin],
      ['application-eve-2026-10-24', QUIET.eveningMin],
    ])
  })

  it('usa os horários aprendidos', () => {
    const usage = { ...QUIET, morningMin: 7 * 60 + 45 }
    expect(getDueReminders(ctx({ usage }))[0].at).toBe(7 * 60 + 45)
  })
})

describe('buildPushSchedule', () => {
  // Sábado 24/10 às 10:00 (horário local do aparelho)
  const NOW = new Date(2026, 9, 24, 10, 0)

  function input(over: Partial<PushScheduleInput> = {}, profile: Partial<UserProfile> = {}): PushScheduleInput {
    return {
      now: NOW, profile: { ...PROFILE, applicationLog: ['2026-10-18'], ...profile },
      workoutPlan: {}, workoutDoneToday: false, waterGoalMetToday: false, usage: QUIET, dismissed: {},
      ...over,
    }
  }

  it('agenda véspera, dia e atraso da aplicação com horário local em UTC', () => {
    const byId = Object.fromEntries(buildPushSchedule(input()).map(i => [i.id, i]))
    expect(byId['application-eve-2026-10-24'].at).toBe(new Date(2026, 9, 24, 18, 30).toISOString())
    expect(byId['application-2026-10-25'].at).toBe(new Date(2026, 9, 25, 9, 0).toISOString())
    expect(byId['application-late-2026-10-25'].at).toBe(new Date(2026, 9, 26, 9, 0).toISOString())
    expect(byId['application-2026-10-25'].url).toBe('/?tab=dashboard')
  })

  it('o atraso só vale na primeira vez e libera a vaga dos dias seguintes', () => {
    const items = buildPushSchedule(input({ usage: { ...QUIET, weighInWeekday: 2 } }))
    expect(items.filter(i => i.id === 'application-late-2026-10-25')).toHaveLength(1)
    // Terça: o atraso já foi avisado na segunda, então a pesagem fica com a manhã
    expect(items.map(i => i.id)).toContain('weighIn-2026-10-27')
  })

  it('nunca passa do limite diário', () => {
    const items = buildPushSchedule(input({
      workoutPlan: { 0: { label: 'A', name: 'A' }, 1: { label: 'B', name: 'B' }, 2: { label: 'C', name: 'C' } },
      usage: { ...QUIET, usesWater: true, weighInWeekday: 1 },
    }))
    const perDay: Record<string, number> = {}
    for (const i of items) {
      const d = new Date(i.at).toDateString()
      perDay[d] = (perDay[d] ?? 0) + 1
    }
    expect(Math.max(...Object.values(perDay))).toBeLessThanOrEqual(MAX_PER_DAY)
  })

  it('não agenda o que já passou nem o que foi dispensado', () => {
    const items = buildPushSchedule(input({ dismissed: { 'application-eve-2026-10-24': '2026-10-24' } }))
    expect(items.map(i => i.id)).not.toContain('application-eve-2026-10-24')
    expect(items.every(i => Date.parse(i.at) > NOW.getTime())).toBe(true)
  })

  it('água: nenhuma hoje se a meta já foi batida', () => {
    const usage = { ...QUIET, usesWater: true }
    const todayIds = (inp: PushScheduleInput) => buildPushSchedule(inp, 1).map(i => i.id)
    // Hoje (sáb) o atraso da aplicação de quarta fica com a manhã (já passou) e a água, com o fim do dia
    expect(todayIds(input({ usage }, { applicationDay: 3 }))).toEqual(['water-2026-10-24'])
    expect(todayIds(input({ usage, waterGoalMetToday: true }, { applicationDay: 3 }))).toEqual([])
  })

  it('treino nos dias do plano; o de hoje some quando feito', () => {
    const workoutPlan = { 6: { label: 'B', name: 'Costas' }, 1: { label: 'A', name: 'Peito' } }
    const workouts = (inp: PushScheduleInput) => buildPushSchedule(inp).map(i => i.id).filter(id => id.startsWith('workout'))
    // Horizonte de 7 dias: sábado 24 a sexta 30
    expect(workouts(input({ workoutPlan }, { applicationDay: 3 }))).toEqual(['workout-2026-10-24', 'workout-2026-10-26'])
    expect(workouts(input({ workoutPlan, workoutDoneToday: true }, { applicationDay: 3 }))).toEqual(['workout-2026-10-26'])
  })
})

describe('utilitários', () => {
  it('pruneReminderState descarta registros com mais de 14 dias', () => {
    const state = pruneReminderState({ dismissed: { a: '2026-10-01', b: '2026-10-20' } }, '2026-10-25')
    expect(state).toEqual({ dismissed: { b: '2026-10-20' } })
  })

  it('reminderUrl leva à tela do lembrete', () => {
    const [r] = getDueReminders(ctx({ today: '2026-10-26', waterGoalMl: 2000, usage: { ...QUIET, usesWater: true } }))
    expect(reminderUrl(r)).toBe('/?tab=health&section=food%3Ahydration')
  })
})
