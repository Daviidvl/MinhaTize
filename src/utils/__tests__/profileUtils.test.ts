import { describe, it, expect, afterEach, vi } from 'vitest'
import { getInitials, getCurrentWeight, getWeightProgress, protocolDays, weekSideEffects } from '../profileUtils'
import { UserProfile } from '../../types'

const PROFILE: UserProfile = {
  name: 'Ana Clara Souza', medication: 'tirzepatida', startWeight: 100, goalWeight: 80, height: 170,
  startDate: '2026-10-01', weightHistory: [], diary: [], sideEffects: [],
}

describe('getInitials', () => {
  it('uses the first letters of the first two names', () => {
    expect(getInitials('Ana Clara Souza')).toBe('AC')
    expect(getInitials('bia')).toBe('B')
  })
})

describe('getCurrentWeight', () => {
  it('prefers the last weigh-in, then the current weight, then the start weight', () => {
    expect(getCurrentWeight(PROFILE)).toBe(100)
    expect(getCurrentWeight({ ...PROFILE, currentWeight: 97 })).toBe(97)
    expect(getCurrentWeight({ ...PROFILE, currentWeight: 97, weightHistory: [{ date: '2026-10-08', weight: 95 }] })).toBe(95)
  })
})

describe('getWeightProgress', () => {
  it('reports loss, distance to goal and the share of the way done', () => {
    const p = getWeightProgress({ ...PROFILE, weightHistory: [{ date: '2026-10-08', weight: 90 }] })
    expect(p).toEqual({ current: 90, lost: 10, toGoal: 10, hasGoal: true, pct: 50, reachedGoal: false })
  })

  it('clamps the share between 0 and 100 and flags the goal', () => {
    expect(getWeightProgress({ ...PROFILE, weightHistory: [{ date: '2026-10-08', weight: 104 }] }).pct).toBe(0)
    const done = getWeightProgress({ ...PROFILE, weightHistory: [{ date: '2026-10-08', weight: 78 }] })
    expect(done.pct).toBe(100)
    expect(done.reachedGoal).toBe(true)
  })

  it('has no goal when the goal equals the start weight', () => {
    expect(getWeightProgress({ ...PROFILE, goalWeight: 100 })).toMatchObject({ hasGoal: false, pct: 0, reachedGoal: false })
  })
})

describe('protocolDays', () => {
  afterEach(() => { vi.useRealTimers() })

  it('counts calendar days since the start date', () => {
    expect(protocolDays(PROFILE, '2026-10-01')).toBe(0)
    expect(protocolDays(PROFILE, '2026-10-15')).toBe(14)
  })

  // Antes: Date.now() - new Date('AAAA-MM-DD') (meia-noite UTC). No Brasil,
  // depois das 21h o app já contava um dia a mais.
  it('does not count an extra day late at night', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 23, 30))
    expect(protocolDays(PROFILE)).toBe(6)
  })
})

describe('weekSideEffects', () => {
  it('finds the entry of the Monday-to-Sunday week that contains the date', () => {
    const entry = { date: '2026-10-19', symptoms: [], notes: '' }
    const profile = { ...PROFILE, sideEffects: [entry] }
    expect(weekSideEffects(profile, new Date(2026, 9, 25, 12))).toBe(entry) // domingo da mesma semana
    expect(weekSideEffects(profile, new Date(2026, 9, 26, 12))).toBeUndefined() // segunda seguinte
  })
})
