import { type AppetiteMode, type DietSex, MEAL_SHARES, MEAL_WINDOW } from '../data/foodPlans'
import { toDateStr, getWeekDays } from './dateUtils'
import { readJSON, writeJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'

export interface ManualItem { id: string; name: string; kcal: number; protein?: number }
// Opção do cardápio escolhida para uma refeição (guardada por extenso para não
// depender da posição da opção na lista, que muda com o modo do dia)
export interface MealPick   { label: string; protein: number; summary?: string }
export interface DayLog {
  meals: string[]
  manual: ManualItem[]
  picks?: Record<string, MealPick>
  mode?: AppetiteMode
}
export type FoodLog  = Record<string, DayLog>
// Água por dia: data → ml de cada registro, na ordem em que foram feitos
export type WaterLog = Record<string, number[]>

export const EMPTY_DAY: DayLog = { meals: [], manual: [] }

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

// ── Proteína ──────────────────────────────────────────────────────────────────
// Meta: 1,6–2,0 g por kg do peso-alvo. O anel fecha no piso da faixa.
export function proteinGoalG(goalWeightKg: number): number {
  return Math.round(1.6 * goalWeightKg)
}

export function proteinRange(goalWeightKg: number): string {
  return `${Math.round(1.6 * goalWeightKg)}–${Math.round(2.0 * goalWeightKg)} g`
}

// "25–30 g" → 28 · "40 g" → 40 · sem número → null
export function parseProtein(text: string | undefined): number | null {
  const nums = (text ?? '').match(/\d+/g)?.map(Number)
  if (!nums?.length) return null
  const [a, b = a] = nums
  return Math.round((a + b) / 2)
}

// Proteína do dia: a da opção escolhida ou, sem escolha, a média prevista da refeição
export function dayProtein(day: DayLog, mealDefaults: Record<string, number>): number {
  const meals  = day.meals.reduce((s, id) => s + (day.picks?.[id]?.protein ?? mealDefaults[id] ?? 0), 0)
  const extras = day.manual.reduce((s, m) => s + (m.protein ?? 0), 0)
  return meals + extras
}

// Kcal do dia: fatia fixa de cada refeição marcada + extras
export function dayKcal(day: DayLog, dailyKcal: number, shares: Record<string, number> = MEAL_SHARES): number {
  const meals  = day.meals.reduce((s, id) => s + Math.round(dailyKcal * (shares[id] ?? 0)), 0)
  const extras = day.manual.reduce((s, m) => s + m.kcal, 0)
  return meals + extras
}

// Refeição da hora (card "Agora" do Início): a da janela atual ou, fora de
// todas, a próxima do dia
export function currentMeal(now = new Date()): { id: string; isCurrent: boolean } {
  const h       = now.getHours() + now.getMinutes() / 60
  const windows = Object.entries(MEAL_WINDOW)
  const cur     = windows.find(([, [start, end]]) => h >= start && h < end)
  if (cur) return { id: cur[0], isCurrent: true }
  return { id: (windows.find(([, [start]]) => start > h) ?? windows[0])[0], isCurrent: false }
}

// Dica abaixo do anel de proteína (o quanto falta já aparece ao lado do anel)
export function proteinTip(consumed: number, goal: number, hour: number): string {
  const left = goal - consumed
  if (left <= 0)       return 'Proteína em dia. Agora é manter a água até a noite.'
  if (consumed === 0)  return 'Comece cada refeição pela proteína: ela segura a fome e protege os músculos.'
  if (left <= 25)      return 'Um scoop de whey ou um iogurte proteico fecha o dia.'
  if (hour >= 20)      return 'Uma ceia leve com proteína ainda ajuda a chegar perto da meta.'
  return 'Priorize a proteína nas próximas refeições.'
}

// ── Semana ────────────────────────────────────────────────────────────────────
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

// Resumo curto de uma opção para a linha da refeição:
// ['Arroz branco cozido (90–120 g)', '170 g de iogurte grego'] → 'Arroz branco cozido, iogurte grego'
export function summarizeItems(items: string[], max = 3): string {
  const clean = items.slice(0, max).map(i => i
    .replace(/\s*\(.*?\)/g, '')
    .replace(/^\d[\d–,.]*\s*(g|ml|scoop)?\s*(de\s+)?/i, '')
    .split(/ — | ou /)[0]
    .trim())
    .map(i => i.charAt(0).toLowerCase() + i.slice(1))
  const text = clean.filter(Boolean).join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// 9.5 → "9h30" · 12 → "12h"
export function formatHour(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`
}

// ── Leitura e gravação ───────────────────────────────────────────────────────
// Água, refeições e plano são lidos também pelo Início, pelos avisos e pelas
// notificações: o tipo de cada chave fica definido só aqui.

// Plano alimentar escolhido. O Início lê a meta de kcal daqui.
export interface DietProfile { sex: DietSex; dailyKcal: number }

export function readDietProfile(): DietProfile | null {
  return readJSON<DietProfile | null>(STORAGE_KEYS.dietProfile, null)
}

export function saveDietProfile(diet: DietProfile) {
  writeJSON(STORAGE_KEYS.dietProfile, diet)
}

export function readFoodLog(): FoodLog {
  return readJSON<FoodLog>(STORAGE_KEYS.foodLog, {})
}

export function saveFoodLog(log: FoodLog) {
  writeJSON(STORAGE_KEYS.foodLog, log)
}

export function readWaterLog(): WaterLog {
  return readJSON<WaterLog>(STORAGE_KEYS.waterLog, {})
}

export function saveWaterLog(log: WaterLog) {
  writeJSON(STORAGE_KEYS.waterLog, log)
}

// Kcal de hoje contra a meta do plano; null sem plano escolhido
export function todayCalories(today: string): { consumed: number; target: number; pct: number } | null {
  const diet = readDietProfile()
  if (!diet?.dailyKcal) return null
  const consumed = dayKcal(readFoodLog()[today] ?? EMPTY_DAY, diet.dailyKcal)
  return { consumed, target: diet.dailyKcal, pct: Math.min(100, Math.round((consumed / diet.dailyKcal) * 100)) }
}
