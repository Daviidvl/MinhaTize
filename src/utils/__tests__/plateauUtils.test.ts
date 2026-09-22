import { describe, it, expect } from 'vitest'
import { UserProfile, WeightEntry } from '../../types'
import {
  hasUsableHistory, getWeightTrend, evaluateNewUser, evaluateReassessment,
  getPlateauStatus, writePlateauStatus,
} from '../plateauUtils'

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
}

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: 'Teste',
    medication: 'tirzepatida',
    startWeight: 90,
    goalWeight: 70,
    height: 170,
    startDate: daysAgo(60),
    weightHistory: [],
    diary: [],
    sideEffects: [],
    ...overrides,
  }
}

describe('hasUsableHistory', () => {
  it('is false with no weigh-ins beyond the initial weight', () => {
    expect(hasUsableHistory(makeProfile())).toBe(false)
  })

  it('is false for a brand-new profile whose only weigh-in is too recent (span < 7 days)', () => {
    const profile = makeProfile({ startDate: daysAgo(2), weightHistory: [{ date: daysAgo(2), weight: 89 }] })
    expect(hasUsableHistory(profile)).toBe(false)
  })

  it('is true once entries span at least 7 days', () => {
    const profile = makeProfile({ startDate: daysAgo(10), weightHistory: [{ date: daysAgo(0), weight: 89 }] })
    expect(hasUsableHistory(profile)).toBe(true)
  })
})

describe('getWeightTrend', () => {
  it('returns "insuficiente" with too few points in the window', () => {
    const profile = makeProfile({ weightHistory: [{ date: daysAgo(10), weight: 89 }] })
    expect(getWeightTrend(profile).verdict).toBe('insuficiente')
  })

  it('returns "queda" for a consistent decline over 3 weeks', () => {
    const history: WeightEntry[] = [
      { date: daysAgo(21), weight: 90 },
      { date: daysAgo(14), weight: 89 },
      { date: daysAgo(7),  weight: 88 },
      { date: daysAgo(0),  weight: 87 },
    ]
    const profile = makeProfile({ startWeight: 91, weightHistory: history })
    expect(getWeightTrend(profile).verdict).toBe('queda')
  })

  it('returns "estagnacao_provavel" when weight barely moves over 3 weeks', () => {
    const history: WeightEntry[] = [
      { date: daysAgo(21), weight: 80 },
      { date: daysAgo(14), weight: 80.2 },
      { date: daysAgo(7),  weight: 79.9 },
      { date: daysAgo(0),  weight: 80.1 },
    ]
    const profile = makeProfile({ startWeight: 80, weightHistory: history })
    expect(getWeightTrend(profile).verdict).toBe('estagnacao_provavel')
  })
})

describe('evaluateNewUser', () => {
  it('flags possible stagnation when the user reports being stagnant', () => {
    expect(evaluateNewUser({ currentWeight: '80', weightThreeWeeksAgo: '82', stagnantThreeWeeks: 'sim' }))
      .toBe('possivel_estagnacao')
  })

  it('finds no signal when the user reports no stagnation', () => {
    expect(evaluateNewUser({ currentWeight: '80', weightThreeWeeksAgo: '82', stagnantThreeWeeks: 'nao' }))
      .toBe('sem_sinal')
  })

  it('falls back to the computed diff when unsure and the weights barely differ', () => {
    expect(evaluateNewUser({ currentWeight: '80', weightThreeWeeksAgo: '80.2', stagnantThreeWeeks: 'nao_tenho_certeza' }))
      .toBe('possivel_estagnacao')
  })

  it('finds no signal when unsure but the computed diff is large', () => {
    expect(evaluateNewUser({ currentWeight: '80', weightThreeWeeksAgo: '85', stagnantThreeWeeks: 'nao_tenho_certeza' }))
      .toBe('sem_sinal')
  })
})

describe('evaluateReassessment', () => {
  it('detects a declining trend since tracking started', () => {
    const tracking = { startDate: daysAgo(14), origin: 'com_historico' as const, baselineWeight: 80 }
    const profile = makeProfile({
      startWeight: 82,
      weightHistory: [
        { date: daysAgo(14), weight: 80 },
        { date: daysAgo(7),  weight: 79 },
        { date: daysAgo(0),  weight: 78 },
      ],
    })
    expect(evaluateReassessment(profile, tracking)).toBe('tendencia_queda')
  })

  it('detects persistent stagnation when weight barely moves', () => {
    const tracking = { startDate: daysAgo(14), origin: 'com_historico' as const, baselineWeight: 80 }
    const profile = makeProfile({
      startWeight: 80,
      weightHistory: [
        { date: daysAgo(14), weight: 80 },
        { date: daysAgo(7),  weight: 80.1 },
        { date: daysAgo(0),  weight: 79.9 },
      ],
    })
    expect(evaluateReassessment(profile, tracking)).toBe('estagnacao_persistente')
  })

  it('reports an inconclusive oscillation otherwise', () => {
    const tracking = { startDate: daysAgo(14), origin: 'com_historico' as const, baselineWeight: 80 }
    const profile = makeProfile({
      startWeight: 80,
      weightHistory: [
        { date: daysAgo(14), weight: 80 },
        { date: daysAgo(7),  weight: 78.5 },
        { date: daysAgo(0),  weight: 80.5 },
      ],
    })
    expect(evaluateReassessment(profile, tracking)).toBe('oscilacao_inconclusiva')
  })
})

describe('getPlateauStatus / writePlateauStatus', () => {
  it('defaults to "sem_sinal" when no evaluation exists', () => {
    expect(getPlateauStatus(makeProfile())).toBe('sem_sinal')
  })

  it('writes a status without mutating the original profile', () => {
    const profile = makeProfile()
    const next = writePlateauStatus(profile, { status: 'tendencia_queda' })
    expect(profile.plateau).toBeUndefined()
    expect(getPlateauStatus(next)).toBe('tendencia_queda')
    expect(next.plateau?.updatedAt).toBeTruthy()
  })

  it('merges patches onto the existing evaluation', () => {
    const profile = makeProfile({ plateau: { status: 'possivel_estagnacao', updatedAt: daysAgo(1) } })
    const next = writePlateauStatus(profile, { status: 'em_acompanhamento_14dias', tracking: { startDate: daysAgo(0), origin: 'com_historico', baselineWeight: 80 } })
    expect(next.plateau?.status).toBe('em_acompanhamento_14dias')
    expect(next.plateau?.tracking?.origin).toBe('com_historico')
  })
})
