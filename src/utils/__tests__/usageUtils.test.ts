import { describe, it, expect } from 'vitest'
import { learnUsage, DEFAULT_USAGE, type AppOpen } from '../usageUtils'
import { UserProfile } from '../../types'

const PROFILE: UserProfile = {
  name: 'Ana', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
  startDate: '2026-01-01', weightHistory: [], diary: [], sideEffects: [],
}

const TODAY = '2026-10-25'
const at = (d: string, h: number, m = 0): AppOpen => ({ d, m: h * 60 + m })

describe('learnUsage', () => {
  it('sem histórico usa os horários padrão', () => {
    expect(learnUsage([], PROFILE, {}, TODAY)).toEqual(DEFAULT_USAGE)
  })

  it('aprende as janelas pelo horário em que o app costuma ser aberto', () => {
    const opens = [
      at('2026-10-20', 7, 50), at('2026-10-21', 8, 5), at('2026-10-22', 7, 55),
      at('2026-10-20', 13, 10), at('2026-10-21', 13, 20), at('2026-10-22', 13, 35),
      at('2026-10-20', 20, 10), at('2026-10-21', 20, 40), at('2026-10-23', 21, 0),
    ]
    const u = learnUsage(opens, PROFILE, {}, TODAY)
    expect(u.morningMin).toBe(8 * 60)
    expect(u.afternoonMin).toBe(13 * 60 + 15)
    expect(u.eveningMin).toBe(20 * 60 + 45)
  })

  it('mantém as janelas dentro dos limites (nada de madrugada nem de noite)', () => {
    const opens = [at('2026-10-20', 5, 30), at('2026-10-21', 5, 40), at('2026-10-22', 5, 50),
      at('2026-10-20', 21, 50), at('2026-10-21', 21, 55), at('2026-10-22', 21, 59)]
    const u = learnUsage(opens, PROFILE, {}, TODAY)
    expect(u.morningMin).toBe(7 * 60 + 30)
    expect(u.eveningMin).toBe(21 * 60 + 30)
  })

  it('ignora as aberturas de hoje, para o horário não mudar no meio do dia', () => {
    const opens = [at(TODAY, 11), at(TODAY, 11, 30), at(TODAY, 12)]
    expect(learnUsage(opens, PROFILE, {}, TODAY).morningMin).toBe(DEFAULT_USAGE.morningMin)
  })

  it('pesagem no dia da semana em que a pessoa costuma se pesar', () => {
    const weightHistory = [
      { date: '2026-10-04', weight: 88 }, { date: '2026-10-11', weight: 87 }, { date: '2026-10-15', weight: 86.5 },
    ]
    // Dois domingos e uma quinta
    expect(learnUsage([], { ...PROFILE, weightHistory }, {}, TODAY).weighInWeekday).toBe(0)
  })

  it('água só entra para quem registra (ou nos primeiros dias de uso)', () => {
    const veteran = [at('2026-10-01', 9)]
    expect(learnUsage(veteran, PROFILE, {}, TODAY).usesWater).toBe(false)
    expect(learnUsage(veteran, PROFILE, { '2026-10-20': [250] }, TODAY).usesWater).toBe(true)
    expect(learnUsage([at('2026-10-22', 9)], PROFILE, {}, TODAY).usesWater).toBe(true)
  })
})
