import { describe, it, expect, beforeEach } from 'vitest'
import {
  waterGoalMl, waterTotal, mealDays, waterDays, calcDayStreak,
  parseProtein, dayProtein, dayKcal, proteinGoalG, proteinTip, formatHour, summarizeItems,
  currentMeal, todayCalories, saveDietProfile, saveFoodLog,
} from '../foodUtils'
import { DIET_F, mealOptions, mealsForMode, LOW_APPETITE_OPTIONS, EXTREME_OPTIONS } from '../../data/foodPlans'

describe('parseProtein', () => {
  it('uses the midpoint of a range', () => {
    expect(parseProtein('25–30 g')).toBe(28)
    expect(parseProtein('35–40 g')).toBe(38)
  })
  it('reads a single value', () => {
    expect(parseProtein('40 g')).toBe(40)
  })
  it('is null without a number', () => {
    expect(parseProtein(undefined)).toBeNull()
    expect(parseProtein('')).toBeNull()
  })
})

describe('dayProtein', () => {
  const defaults = { cafe: 28, almoco: 40, jantar: 35 }

  it('uses the picked option, falling back to the meal default', () => {
    const day = {
      meals: ['cafe', 'almoco'], manual: [],
      picks: { cafe: { label: 'Opção 5', protein: 38 } },
    }
    expect(dayProtein(day, defaults)).toBe(38 + 40)
  })

  it('adds the protein of the extras', () => {
    const day = { meals: ['jantar'], manual: [{ id: '1', name: 'Whey', kcal: 120, protein: 24 }, { id: '2', name: 'Bolo', kcal: 300 }] }
    expect(dayProtein(day, defaults)).toBe(35 + 24)
  })

  it('ignores picks of meals that were unchecked', () => {
    const day = { meals: [], manual: [], picks: { cafe: { label: 'Opção 1', protein: 30 } } }
    expect(dayProtein(day, defaults)).toBe(0)
  })
})

describe('dayKcal', () => {
  it('sums the share of each meal plus extras', () => {
    const day = { meals: ['cafe', 'almoco'], manual: [{ id: '1', name: 'Fruta', kcal: 70 }] }
    expect(dayKcal(day, 1600, { cafe: 0.25, almoco: 0.30 })).toBe(400 + 480 + 70)
  })
})

describe('proteinGoalG', () => {
  it('is 1.6 g per kg of goal weight', () => {
    expect(proteinGoalG(65)).toBe(104)
  })
})

describe('proteinTip', () => {
  it('celebrates when the goal is reached', () => {
    expect(proteinTip(110, 104, 14)).toMatch(/em dia/)
  })
  it('suggests a quick snack when little is missing', () => {
    expect(proteinTip(90, 104, 14)).toMatch(/whey/)
  })
})

describe('summarizeItems', () => {
  it('drops quantities and keeps the first items', () => {
    expect(summarizeItems(['Arroz branco cozido (90–120 g)', 'Feijão (70–100 g)', 'Frango grelhado (120–150 g)', 'Legumes cozidos']))
      .toBe('Arroz branco cozido, feijão, frango grelhado')
    expect(summarizeItems(['170 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana']))
      .toBe('Iogurte grego natural, whey, morangos')
  })
})

describe('formatHour', () => {
  it('formats whole and half hours', () => {
    expect(formatHour(12)).toBe('12h')
    expect(formatHour(9.5)).toBe('9h30')
  })
})

describe('mealOptions / mealsForMode', () => {
  const cafe  = DIET_F.find(m => m.id === 'cafe')!
  const ceia  = DIET_F.find(m => m.id === 'ceia')!

  it('switches the options with the appetite mode', () => {
    expect(mealOptions(cafe, 'normal')).toBe(cafe.options)
    expect(mealOptions(cafe, 'low')).toBe(LOW_APPETITE_OPTIONS.cafe)
    expect(mealOptions(cafe, 'extreme')).toBe(EXTREME_OPTIONS.cafe)
  })

  it('falls back to the regular menu when the mode has no list', () => {
    expect(mealOptions(ceia, 'low')).toBe(ceia.options)
  })

  it('keeps only the main meals on "no appetite" days', () => {
    expect(mealsForMode(DIET_F, 'extreme').map(m => m.id)).toEqual(['cafe', 'almoco', 'jantar'])
    expect(mealsForMode(DIET_F, 'normal')).toHaveLength(6)
  })
})

describe('waterGoalMl', () => {
  it('uses 35 ml per kg, rounded to the nearest 50 ml', () => {
    expect(waterGoalMl(80)).toBe(2800)
    expect(waterGoalMl(82)).toBe(2850)
  })
})

describe('waterTotal', () => {
  it('sums the entries of the day', () => {
    expect(waterTotal([200, 300, 500])).toBe(1000)
  })

  it('is 0 for a day with no entries', () => {
    expect(waterTotal(undefined)).toBe(0)
  })
})

describe('mealDays', () => {
  const required = ['cafe', 'almoco', 'jantar']

  it('keeps only the days with every required meal', () => {
    const log = {
      '2026-10-12': { meals: ['cafe', 'almoco', 'jantar', 'ceia'], manual: [] },
      '2026-10-13': { meals: ['cafe', 'lanche-m', 'jantar'], manual: [] },
    }
    expect(mealDays(log, required)).toEqual(['2026-10-12'])
  })
})

describe('waterDays', () => {
  it('keeps only the days that reached the goal', () => {
    const log = { '2026-10-12': [1000, 1000, 800], '2026-10-13': [500, 500] }
    expect(waterDays(log, 2800)).toEqual(['2026-10-12'])
  })
})

describe('calcDayStreak', () => {
  // Quarta, 14/10/2026
  const NOW = new Date(2026, 9, 14, 12)

  it('returns 0 with no days', () => {
    expect(calcDayStreak([], NOW)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(calcDayStreak(['2026-10-12', '2026-10-13', '2026-10-14'], NOW)).toBe(3)
  })

  it('does not break the streak while today is still open', () => {
    expect(calcDayStreak(['2026-10-12', '2026-10-13'], NOW)).toBe(2)
  })

  it('stops at the first missing day', () => {
    expect(calcDayStreak(['2026-10-10', '2026-10-12', '2026-10-13'], NOW)).toBe(2)
  })
})

// Card "Agora" do Início: mesmas janelas de horário do cardápio (MEAL_WINDOW)
describe('currentMeal', () => {
  const at = (h: number, m = 0) => currentMeal(new Date(2026, 10, 11, h, m))

  it('picks the meal whose window contains the time', () => {
    expect(at(7)).toEqual({ id: 'cafe', isCurrent: true })
    expect(at(9, 30)).toEqual({ id: 'lanche-m', isCurrent: true })
    expect(at(13)).toEqual({ id: 'almoco', isCurrent: true })
    expect(at(23, 59)).toEqual({ id: 'ceia', isCurrent: true })
  })

  it('points to the next meal outside every window', () => {
    expect(at(3)).toEqual({ id: 'cafe', isCurrent: false })
  })
})

describe('todayCalories', () => {
  beforeEach(() => { localStorage.clear() })

  it('is null without a diet plan', () => {
    expect(todayCalories('2026-11-11')).toBeNull()
  })

  it('adds the fixed share of each logged meal and the extras', () => {
    saveDietProfile({ sex: 'F', dailyKcal: 1600 })
    saveFoodLog({ '2026-11-11': { meals: ['cafe', 'almoco'], manual: [{ id: '1', name: 'Whey', kcal: 120 }] } })
    // 25% + 30% de 1600 = 880, + 120 de extras
    expect(todayCalories('2026-11-11')).toEqual({ consumed: 1000, target: 1600, pct: 63 })
    expect(todayCalories('2026-11-12')).toEqual({ consumed: 0, target: 1600, pct: 0 })
  })
})
