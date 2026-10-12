import { toDateStr, getWeekDays } from './exerciseUtils'

export interface ManualItem { id: string; name: string; kcal: number }
export interface DayLog     { meals: string[]; manual: ManualItem[] }
export type FoodLog  = Record<string, DayLog>
// Água por dia: data → ml de cada registro, na ordem em que foram feitos
export type WaterLog = Record<string, number[]>

// Piso da faixa recomendada (35–40 ml por kg de peso corporal)
const WATER_ML_PER_KG = 35

// Meta diária de água em ml, arredondada para múltiplos de 50
export function waterGoalMl(weightKg: number): number {
  return Math.round((weightKg * WATER_ML_PER_KG) / 50) * 50
}

export function waterTotal(entries: number[] | undefined): number {
  return (entries ?? []).reduce((sum, ml) => sum + ml, 0)
}

export function formatMl(ml: number): string {
  return ml.toLocaleString('pt-BR')
}

// Dias em que todas as refeições obrigatórias foram registradas
export function mealDays(log: FoodLog, required: string[]): string[] {
  return Object.keys(log).filter(d => required.every(id => log[d].meals.includes(id)))
}

// Dias em que a meta de água foi atingida (sempre contra a meta atual)
export function waterDays(log: WaterLog, goalMl: number): string[] {
  return Object.keys(log).filter(d => waterTotal(log[d]) >= goalMl)
}

export function countThisWeek(days: string[]): number {
  return getWeekDays().filter(d => days.includes(toDateStr(d))).length
}

// Dias seguidos até hoje. Hoje ainda em aberto não quebra a sequência.
export function calcDayStreak(days: string[], now = new Date()): number {
  const d = new Date(now)
  if (!days.includes(toDateStr(d))) d.setDate(d.getDate() - 1)
  let streak = 0
  while (days.includes(toDateStr(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
