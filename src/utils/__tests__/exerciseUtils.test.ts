import { describe, it, expect } from 'vitest'
import { calcStreak, getMotivation, toDateStr } from '../exerciseUtils'

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
