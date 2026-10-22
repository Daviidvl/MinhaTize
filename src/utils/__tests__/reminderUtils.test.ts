import { describe, it, expect } from 'vitest'
import {
  DEFAULT_REMINDER_SETTINGS as D, getDueReminders, buildPushSchedule, isQuietTime,
  pruneReminderState, notificationText, reminderUrl,
  type ReminderContext, type ReminderSettings, type PushScheduleInput,
} from '../reminderUtils'
import { UserProfile } from '../../types'

// 2026-10-25 é um domingo (dia 0)
const PROFILE: UserProfile = {
  name: 'Ana', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
  startDate: '2026-01-01', currentDose: 5, applicationDay: 0,
  weightHistory: [], diary: [], sideEffects: [],
}

const OFF: ReminderSettings = {
  ...D,
  quietFrom: '00:00', quietTo: '00:00',
  application: { ...D.application, enabled: false, eveBefore: false },
  stock: { enabled: false }, postDose: { enabled: false },
  water: { ...D.water, enabled: false }, weighIn: { ...D.weighIn, enabled: false },
  workout: { ...D.workout, enabled: false },
}

function ctx(over: Partial<ReminderContext> = {}, profile: Partial<UserProfile> = {}): ReminderContext {
  return {
    today: '2026-10-25', nowMin: 10 * 60, waterMl: 0, waterGoalMl: 0, workoutPlan: {}, workoutDoneToday: false,
    ...over, profile: { ...PROFILE, ...profile },
  }
}

function only(s: Partial<ReminderSettings>): ReminderSettings {
  return { ...OFF, ...s }
}

const ids = (s: ReminderSettings, c: ReminderContext) => getDueReminders(s, c).map(r => r.id)

describe('getDueReminders — aplicação', () => {
  const s = only({ application: { enabled: true, time: '09:00', eveBefore: true } })

  it('lembra no dia da aplicação enquanto ela não foi registrada', () => {
    const [r] = getDueReminders(s, ctx())
    expect(r.id).toBe('application-2026-10-25')
    expect(r.at).toBe(9 * 60)
    // O texto também vai para o servidor de push: não cita a dose
    expect(r.body).not.toContain('mg')
  })

  it('some depois que a aplicação do dia é registrada', () => {
    expect(ids(s, ctx({}, { applicationLog: ['2026-10-25'] }))).toEqual([])
  })

  it('avisa da aplicação atrasada nos dias seguintes', () => {
    const r = getDueReminders(s, ctx({ today: '2026-10-27' }, { applicationLog: ['2026-10-18'] }))
    expect(r.map(x => x.id)).toEqual(['application-late-2026-10-25'])
    expect(r[0].tone).toBe('warn')
  })

  it('aceita a aplicação feita com atraso como a da semana', () => {
    expect(ids(s, ctx({ today: '2026-10-27' }, { applicationLog: ['2026-10-18', '2026-10-26'] }))).toEqual([])
  })

  it('não cobra atraso de quem não usa o calendário', () => {
    expect(ids(s, ctx({ today: '2026-10-27' }))).toEqual([])
  })

  it('avisa na véspera', () => {
    expect(ids(s, ctx({ today: '2026-10-24' }, { applicationLog: ['2026-10-18'] }))).toEqual(['application-eve-2026-10-24'])
  })

  it('ignora quem não tem dia de aplicação', () => {
    expect(ids(s, ctx({}, { applicationDay: undefined }))).toEqual([])
  })
})

describe('getDueReminders — demais lembretes', () => {
  it('estoque baixo', () => {
    const r = getDueReminders(only({ stock: { enabled: true } }),
      ctx({}, { stock: { amouleMg: 10, ampouleML: 1, ampouleCount: 1 } }))
    expect(r).toHaveLength(1)
    expect(r[0].title).toBe('Estoque baixo')
    expect(r[0].body).toContain('Restam 2 aplicações')
    expect(r[0].section).toBe('stock')
  })

  it('estoque confortável não avisa', () => {
    expect(ids(only({ stock: { enabled: true } }),
      ctx({}, { stock: { amouleMg: 50, ampouleML: 1, ampouleCount: 1 } }))).toEqual([])
  })

  it('pós-dose: pergunta no dia seguinte se a semana não tem sintomas registrados', () => {
    const s = only({ postDose: { enabled: true } })
    expect(ids(s, ctx({ today: '2026-10-26' }, { applicationLog: ['2026-10-25'] }))).toEqual(['postDose-2026-10-25'])
    expect(ids(s, ctx({ today: '2026-10-26' }, {
      applicationLog: ['2026-10-25'],
      sideEffects: [{ date: '2026-10-26', symptoms: [], notes: '' }],
    }))).toEqual([])
    expect(ids(s, ctx({ today: '2026-10-28' }, { applicationLog: ['2026-10-25'] }))).toEqual([])
  })

  it('água: só quando está atrás do esperado para o horário', () => {
    const s = only({ water: { enabled: true, from: '08:00', to: '20:00', everyHours: 2 } })
    const at14 = { nowMin: 14 * 60, waterGoalMl: 2000 }
    const [r] = getDueReminders(s, ctx({ ...at14, waterMl: 500 }))
    expect(r.id).toBe('water-2026-10-25-3')
    expect(r.at).toBe(14 * 60)
    expect(r.body).toContain('Faltam 1.500 ml')
    expect(ids(s, ctx({ ...at14, waterMl: 900 }))).toEqual([])
    expect(ids(s, ctx({ nowMin: 9 * 60, waterGoalMl: 2000 }))).toEqual([])
  })

  it('treino do dia ainda não feito', () => {
    const s = only({ workout: { enabled: true, time: '18:00' } })
    const workoutPlan = { 0: { label: 'A', name: 'Peito + Tríceps' } }
    expect(ids(s, ctx({ workoutPlan }))).toEqual(['workout-2026-10-25'])
    expect(ids(s, ctx({ workoutPlan, workoutDoneToday: true }))).toEqual([])
    expect(ids(s, ctx({ workoutPlan, today: '2026-10-26' }))).toEqual([])
  })

  it('pesagem no dia escolhido, se o peso não foi registrado', () => {
    const s = only({ weighIn: { enabled: true, weekday: 0, time: '08:00' } })
    expect(ids(s, ctx())).toEqual(['weighIn-2026-10-25'])
    expect(ids(s, ctx({}, { weightHistory: [{ date: '2026-10-25', weight: 80 }] }))).toEqual([])
    expect(ids(s, ctx({ today: '2026-10-26' }))).toEqual([])
  })
})

describe('buildPushSchedule', () => {
  // Sábado 24/10 às 10:00 (horário local do aparelho)
  const NOW = new Date(2026, 9, 24, 10, 0)

  function input(over: Partial<PushScheduleInput> = {}, profile: Partial<UserProfile> = {}): PushScheduleInput {
    return {
      now: NOW, profile: { ...PROFILE, applicationLog: ['2026-10-18'], ...profile },
      workoutPlan: {}, workoutDoneToday: false, waterGoalMetToday: false, dismissed: {},
      ...over,
    }
  }

  const sched = (s: ReminderSettings, inp = input()) => buildPushSchedule(s, inp)

  it('agenda véspera, dia e atraso da aplicação com horário local em UTC', () => {
    const items = sched(only({ application: { enabled: true, time: '09:00', eveBefore: true } }))
    const byId = Object.fromEntries(items.map(i => [i.id, i]))
    expect(byId['application-eve-2026-10-24'].at).toBe(new Date(2026, 9, 24, 20, 0).toISOString())
    expect(byId['application-2026-10-25'].at).toBe(new Date(2026, 9, 25, 9, 0).toISOString())
    // O atraso só vale na primeira ocorrência (dia seguinte), não nos três dias
    expect(items.filter(i => i.id === 'application-late-2026-10-25')).toHaveLength(1)
    expect(byId['application-late-2026-10-25'].at).toBe(new Date(2026, 9, 26, 9, 0).toISOString())
    expect(byId['application-2026-10-25'].url).toBe('/?tab=dashboard')
  })

  it('não agenda o que já passou nem o que foi dispensado', () => {
    const s = only({ application: { enabled: true, time: '09:00', eveBefore: true } })
    const items = sched(s, input({ dismissed: { 'application-eve-2026-10-24': '2026-10-24' } }))
    expect(items.map(i => i.id)).not.toContain('application-eve-2026-10-24')
    expect(items.every(i => Date.parse(i.at) > NOW.getTime())).toBe(true)
  })

  it('estoque baixo: um aviso por semana, sem repetir se o de hoje já passou', () => {
    const items = sched(only({ stock: { enabled: true } }), input({}, { stock: { amouleMg: 10, ampouleML: 1, ampouleCount: 1 } }))
    // Hoje (sáb) 10:00 já passou e a semana é a mesma até domingo; a próxima começa na segunda 26/10
    expect(items.map(i => i.id)).toEqual(['stock-2026-10-26'])
    expect(items[0].at).toBe(new Date(2026, 9, 26, 10, 0).toISOString())
  })

  it('água: um aviso por intervalo, e nenhum hoje se a meta já foi batida', () => {
    const s = only({ water: { enabled: true, from: '08:00', to: '20:00', everyHours: 3 } })
    const todayIds = (inp: PushScheduleInput) => buildPushSchedule(s, inp, 1).map(i => i.id)
    expect(todayIds(input())).toEqual(['water-2026-10-24-1', 'water-2026-10-24-2', 'water-2026-10-24-3', 'water-2026-10-24-4'])
    expect(todayIds(input({ waterGoalMetToday: true }))).toEqual([])
    // 11h, 14h, 17h, 20h × 7 dias
    expect(sched(s)).toHaveLength(28)
  })

  it('respeita o horário de silêncio', () => {
    const s = only({ quietFrom: '19:00', quietTo: '07:00', water: { enabled: true, from: '08:00', to: '20:00', everyHours: 3 } })
    expect(buildPushSchedule(s, input(), 1).map(i => i.id)).toEqual(['water-2026-10-24-1', 'water-2026-10-24-2', 'water-2026-10-24-3'])
  })

  it('modo discreto troca o texto', () => {
    const s = only({ discreet: true, application: { enabled: true, time: '09:00', eveBefore: false } })
    const [first] = sched(s)
    expect(first.title).toBe('MinhaTize')
    expect(first.body).not.toMatch(/aplica/i)
  })

  it('treino nos dias do plano; o de hoje some quando feito', () => {
    const s = only({ workout: { enabled: true, time: '18:00' } })
    const workoutPlan = { 6: { label: 'B', name: 'Costas' }, 1: { label: 'A', name: 'Peito' } }
    expect(sched(s, input({ workoutPlan })).map(i => i.id)).toEqual(['workout-2026-10-24', 'workout-2026-10-26'])
    expect(sched(s, input({ workoutPlan, workoutDoneToday: true })).map(i => i.id)).toEqual(['workout-2026-10-26'])
  })
})

describe('utilitários', () => {
  it('isQuietTime atravessa a meia-noite', () => {
    expect(isQuietTime(23 * 60, '22:00', '07:00')).toBe(true)
    expect(isQuietTime(6 * 60 + 59, '22:00', '07:00')).toBe(true)
    expect(isQuietTime(7 * 60, '22:00', '07:00')).toBe(false)
    expect(isQuietTime(13 * 60, '12:00', '14:00')).toBe(true)
    expect(isQuietTime(13 * 60, '08:00', '08:00')).toBe(false)
  })

  it('pruneReminderState descarta registros com mais de 14 dias', () => {
    const state = pruneReminderState({ dismissed: { a: '2026-10-01', b: '2026-10-20' } }, '2026-10-25')
    expect(state).toEqual({ dismissed: { b: '2026-10-20' } })
  })

  it('modo discreto esconde o conteúdo', () => {
    const [r] = getDueReminders(only({ application: { enabled: true, time: '09:00', eveBefore: false } }), ctx())
    expect(notificationText(r, true).body).not.toMatch(/aplica/i)
    expect(notificationText(r, false).title).toBe(r.title)
  })

  it('reminderUrl leva à tela do lembrete', () => {
    const [r] = getDueReminders(only({ water: { enabled: true, from: '08:00', to: '20:00', everyHours: 2 } }),
      ctx({ nowMin: 14 * 60, waterGoalMl: 2000 }))
    expect(reminderUrl(r)).toBe('/?tab=health&section=food%3Ahydration')
  })
})
