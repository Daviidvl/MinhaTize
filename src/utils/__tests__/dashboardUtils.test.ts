import { describe, it, expect } from 'vitest'
import { getMotivation } from '../dashboardUtils'

describe('getMotivation', () => {
  it('celebrates when the goal has been reached', () => {
    expect(getMotivation(12, 0, 10, 70, true).text).toBe('Meta atingida!')
  })

  it('highlights large weight loss over reaching the goal soon', () => {
    expect(getMotivation(11, 5, 10, 70, false).text).toBe('11.0 kg eliminados')
  })

  it('highlights being close to the goal', () => {
    expect(getMotivation(4, 2, 5, 40, false).text).toBe('Faltam apenas 2.0 kg')
  })

  it('welcomes brand-new users in their first few days', () => {
    expect(getMotivation(0, 20, 0, 2, false).text).toBe('Bem-vindo ao protocolo!')
  })

  it('falls back to a generic prompt when no other condition matches', () => {
    expect(getMotivation(0, 20, 1, 10, false).text).toBe('Registre seu peso')
  })
})
