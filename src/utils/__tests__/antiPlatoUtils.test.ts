import { describe, it, expect } from 'vitest'
import { computeDiagnosis, getDayNumber, DEFAULT_ANSWERS, type Answers } from '../antiPlatoUtils'

function makeAnswers(overrides: Partial<Answers> = {}): Answers {
  return { ...DEFAULT_ANSWERS, ...overrides }
}

describe('computeDiagnosis', () => {
  it('returns no items when everything is on track', () => {
    expect(computeDiagnosis(makeAnswers())).toEqual([])
  })

  it('flags low protein intake as high priority', () => {
    const result = computeDiagnosis(makeAnswers({ meetsProtein: false, currentWeight: '80' }))
    expect(result[0]).toMatchObject({ id: 'protein', level: 'high' })
    expect(result[0].detail).toContain('96')
  })

  it('sorts priorities by severity: high before moderate before low', () => {
    const result = computeDiagnosis(makeAnswers({
      cardio: 'no',                 // low
      sleepHours: 'lt5',            // moderate
      meetsProtein: false,          // high
    }))
    expect(result.map(r => r.level)).toEqual(['high', 'moderate', 'low'])
  })

  it('flags hidden-calorie risk as moderate at 3-5 items and high at 6+', () => {
    const moderate = computeDiagnosis(makeAnswers({ foodItems: ['a', 'b', 'c'] }))
    const high = computeDiagnosis(makeAnswers({ foodItems: ['a', 'b', 'c', 'd', 'e', 'f'] }))
    expect(moderate.find(i => i.id === 'calories')?.level).toBe('moderate')
    expect(high.find(i => i.id === 'calories')?.level).toBe('high')
  })
})

describe('getDayNumber', () => {
  it('clamps to day 1 on the start date', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getDayNumber(today)).toBe(1)
  })

  it('clamps to a maximum of 14', () => {
    const farPast = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    expect(getDayNumber(farPast)).toBe(14)
  })
})
