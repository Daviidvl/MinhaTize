import { describe, it, expect } from 'vitest'
import { getInsights, type InsightContext } from '../insightUtils'
import { UserProfile } from '../../types'

// 2026-10-25 é um domingo (dia 0); a semana começa na segunda 2026-10-19
const PROFILE: UserProfile = {
  name: 'Ana', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
  startDate: '2026-01-01', currentDose: 5,
  weightHistory: [{ date: '2026-10-20', weight: 85 }], diary: [], sideEffects: [],
}

const PLAN = { 1: { label: 'A', name: 'Peito' }, 3: { label: 'B', name: 'Costas' }, 5: { label: 'C', name: 'Pernas' } }

function ctx(over: Partial<InsightContext> = {}, profile: Partial<UserProfile> = {}): InsightContext {
  return {
    today: '2026-10-25', nowMin: 10 * 60, workoutTarget: null, workoutPlan: {}, workoutLog: [], waterLog: {}, waterGoalMl: 0,
    ...over, profile: { ...PROFILE, ...profile },
  }
}

const ids = (c: InsightContext) => getInsights(c).map(i => i.id)

describe('getInsights — aplicação', () => {
  it('avisa que o dia de aplicar está próximo', () => {
    // Aplicação na terça (2): faltam 2 dias
    expect(ids(ctx({}, { applicationDay: 2 }))).toContain('insight-application-soon-2026-10-27')
    // Aplicação na segunda (1): é amanhã
    const [first] = getInsights(ctx({}, { applicationDay: 1 }))
    expect(first.title).toBe('Amanhã é dia de aplicar')
  })

  it('no dia, fica em primeiro e cita a dose', () => {
    const [first] = getInsights(ctx({}, { applicationDay: 0 }))
    expect(first.id).toBe('insight-application-2026-10-25')
    expect(first.body).toContain('5 mg')
  })

  it('some quando a aplicação do dia é registrada', () => {
    expect(ids(ctx({}, { applicationDay: 0, applicationLog: ['2026-10-25'] })).some(id => id.startsWith('insight-application-2'))).toBe(false)
  })

  it('reconhece semanas seguidas em dia', () => {
    const log = ['2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25']
    // No dia da aplicação, a sequência entra no aviso de aplicação registrada
    const [done] = getInsights(ctx({}, { applicationDay: 0, applicationLog: log }))
    expect(done.id).toBe('insight-application-done-2026-10-25')
    expect(done.body).toContain('4 semanas seguidas')
    // Nos dias seguintes, vira um aviso próprio
    expect(ids(ctx({ today: '2026-10-27' }, { applicationDay: 0, applicationLog: log }))).toContain('insight-application-streak-4')
  })
})

describe('getInsights — treino', () => {
  it('avisa quem ainda não treinou na semana', () => {
    const [w] = getInsights(ctx({ today: '2026-10-22', workoutTarget: 3, workoutPlan: PLAN, workoutLog: ['2026-10-16'] }))
      .filter(i => i.kind === 'workout')
    expect(w.id).toBe('insight-workout-none-2026-10-19')
    expect(w.body).toContain('há 6 dias')
  })

  it('não cobra no começo da semana', () => {
    const w = getInsights(ctx({ today: '2026-10-20', workoutTarget: 3, workoutPlan: PLAN })).filter(i => i.kind === 'workout')
    expect(w).toEqual([])
  })

  it('comemora a meta da semana batida', () => {
    const log = ['2026-10-19', '2026-10-21', '2026-10-23']
    expect(ids(ctx({ workoutTarget: 3, workoutPlan: PLAN, workoutLog: log }))).toContain('insight-workout-goal-2026-10-19')
  })

  it('sugere montar o plano para quem não tem', () => {
    expect(ids(ctx())).toContain('insight-workout-setup')
  })
})

describe('getInsights — pesagem, evolução e água', () => {
  it('sugere se pesar depois de mais de uma semana', () => {
    expect(ids(ctx({}, { weightHistory: [{ date: '2026-10-10', weight: 85 }] }))).toContain('insight-weigh-gap-2026-10-10')
  })

  it('mostra a perda de peso das últimas semanas', () => {
    const history = [{ date: '2026-09-20', weight: 88 }, { date: '2026-10-24', weight: 85.5 }]
    const p = getInsights(ctx({}, { weightHistory: history })).find(i => i.kind === 'progress')
    expect(p?.title).toBe('2,5 kg a menos em 5 semanas')
  })

  it('avisa quando a água de ontem ficou abaixo da meta', () => {
    expect(ids(ctx({ waterGoalMl: 2000, waterLog: { '2026-10-24': [500, 300] } }))).toContain('insight-water-yesterday-2026-10-24')
  })

  it('não fala de água com quem não registra', () => {
    expect(getInsights(ctx({ waterGoalMl: 2000, nowMin: 16 * 60 })).some(i => i.kind === 'water')).toBe(false)
  })
})

describe('getInsights — alerta cumprido vira positivo', () => {
  const water = (i: ReturnType<typeof getInsights>) => i.filter(x => x.kind === 'water')

  it('água abaixo do esperado → meta batida', () => {
    const base = { waterGoalMl: 2000, nowMin: 16 * 60 }
    const [low] = water(getInsights(ctx({ ...base, waterLog: { '2026-10-25': [250] } })))
    expect(low.id).toBe('insight-water-today-2026-10-25')
    expect(low.tone).toBe('info')

    const done = water(getInsights(ctx({ ...base, waterLog: { '2026-10-25': [1000, 1000] } })))
    expect(done.map(i => [i.id, i.tone])).toEqual([['insight-water-done-2026-10-25', 'good']])
  })

  it('aplicação do dia → aplicação registrada', () => {
    const app = getInsights(ctx({}, { applicationDay: 0, applicationLog: ['2026-10-25'] })).filter(i => i.kind === 'application')
    expect(app.map(i => [i.id, i.tone])).toEqual([['insight-application-done-2026-10-25', 'good']])
  })

  it('treino pendente → treino de hoje concluído', () => {
    const w = getInsights(ctx({ today: '2026-10-22', workoutTarget: 3, workoutPlan: PLAN, workoutLog: ['2026-10-22'] }))
      .filter(i => i.kind === 'workout')
    expect(w.map(i => i.id)).toEqual(['insight-workout-done-2026-10-22'])
    expect(w[0].body).toContain('1 de 3')
  })

  it('pesagem atrasada → peso registrado, com a diferença', () => {
    const history = [{ date: '2026-10-10', weight: 85 }, { date: '2026-10-25', weight: 84.2 }]
    const [p] = getInsights(ctx({}, { weightHistory: history })).filter(i => i.kind === 'weighIn')
    expect(p.id).toBe('insight-weigh-done-2026-10-25')
    expect(p.body).toContain('0,8 kg a menos')
  })

  it('sintomas pedidos → sintomas registrados', () => {
    const s = getInsights(ctx({ today: '2026-10-26' }, {
      applicationLog: ['2026-10-25'], sideEffects: [{ date: '2026-10-26', symptoms: [], notes: '' }],
    })).filter(i => i.kind === 'symptoms')
    expect(s.map(i => [i.id, i.tone])).toEqual([['insight-symptoms-done-2026-10-25', 'good']])
  })
})
