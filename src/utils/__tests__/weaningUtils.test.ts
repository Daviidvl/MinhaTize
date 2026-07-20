import { describe, it, expect } from 'vitest'
import { classify, type Answers } from '../weaningUtils'

function makeAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    q1: 'Sim',
    q2: 'Mais de 3 meses',
    q3: 'Muito controlada',
    q4: 'Bem estruturada',
    q5: 'Sim, 3 ou mais vezes por semana',
    q6: 'Peso estabilizado',
    q7: [],
    q8: '5',
    ...overrides,
  }
}

describe('classify', () => {
  it('classifies as green when all criteria are favorable', () => {
    expect(classify(makeAnswers())).toBe('green')
  })

  it('classifies as blue when a severe symptom is present, regardless of other answers', () => {
    expect(classify(makeAnswers({ q7: ['Vômitos'] }))).toBe('blue')
  })

  it('classifies as blue when the user is regaining weight', () => {
    expect(classify(makeAnswers({ q6: 'Estou recuperando peso' }))).toBe('blue')
  })

  it('classifies as yellow when a single green criterion is not met', () => {
    expect(classify(makeAnswers({ q1: 'Não' }))).toBe('yellow')
  })

  it('treats "Nenhum dos sintomas acima" as no symptoms for green classification', () => {
    expect(classify(makeAnswers({ q7: ['Nenhum dos sintomas acima'] }))).toBe('green')
  })
})
