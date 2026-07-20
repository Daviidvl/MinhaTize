import { readJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'

export function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
}

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function getFormattedDate() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export const DOSE_PHASE: Record<number, string> = {
  2.5: 'Fase inicial', 5: 'Adaptação', 7.5: 'Progresso',
  10: 'Consolidação', 12.5: 'Avançado', 15: 'Dose máxima',
}

export function getMotivation(lost: number, toGoal: number, weeks: number, days: number, reachedGoal: boolean) {
  if (reachedGoal)               return { text: 'Meta atingida!', sub: 'Resultado incrível. Continue cuidando dos hábitos.' }
  if (lost >= 10)                return { text: `${lost.toFixed(1)} kg eliminados`, sub: 'Resultado extraordinário. Parabéns pela consistência.' }
  if (toGoal > 0 && toGoal <= 3) return { text: `Faltam apenas ${toGoal.toFixed(1)} kg`, sub: 'Você está na reta final!' }
  if (lost >= 5)                 return { text: `${lost.toFixed(1)} kg a menos`, sub: 'Cada semana de consistência conta.' }
  if (weeks >= 8)                return { text: `${weeks} semanas de protocolo`, sub: 'Consistência é o maior diferencial.' }
  if (lost >= 2)                 return { text: `Já perdeu ${lost.toFixed(1)} kg`, sub: `Faltam ${toGoal.toFixed(1)} kg para a meta.` }
  if (weeks >= 2)                return { text: `${weeks}ª semana em protocolo`, sub: 'A dedicação já está gerando resultados.' }
  if (days <= 3)                 return { text: 'Bem-vindo ao protocolo!', sub: 'Registre seu peso toda semana.' }
  return { text: 'Registre seu peso', sub: 'Acompanhe sua evolução no gráfico.' }
}

// ── Helpers de dieta ─────────────────────────────────────────────────────────

function getTodayStr() { return new Date().toISOString().split('T')[0] }

const FIXED_MEAL_SHARES: Record<string, number> = {
  'cafe': 0.25, 'lanche-m': 0.10, 'almoco': 0.30,
  'lanche-t': 0.10, 'jantar': 0.20, 'ceia': 0.05,
}

export function getCalorieStatus(): { consumed: number; target: number; pct: number } | null {
  const diet = readJSON<{ dailyKcal: number } | null>(STORAGE_KEYS.dietProfile, null)
  if (!diet?.dailyKcal) return null
  const log = readJSON<Record<string, { meals: string[]; manual: { kcal: number }[] }>>(STORAGE_KEYS.foodLog, {})
  const day = log[getTodayStr()] ?? { meals: [], manual: [] }
  const mealKcal   = day.meals.reduce((s: number, id: string) => s + Math.round(diet.dailyKcal * (FIXED_MEAL_SHARES[id] ?? 0)), 0)
  const manualKcal = day.manual.reduce((s: number, m: { kcal: number }) => s + m.kcal, 0)
  const consumed   = mealKcal + manualKcal
  return { consumed, target: diet.dailyKcal, pct: Math.min(100, Math.round((consumed / diet.dailyKcal) * 100)) }
}

// ── Dados de treino ───────────────────────────────────────────────────────────
export const SPLIT_INFO: Record<string, { label: string; name: string; color: string }[]> = {
  '2_M': [{ label: 'A', name: 'Empurrar + Core',         color: '#059669' }, { label: 'B', name: 'Puxar + Posterior',        color: '#7C3AED' }],
  '2_F': [{ label: 'A', name: 'Glúteos + Pernas',        color: '#EC4899' }, { label: 'B', name: 'Superior + Core',          color: '#7C3AED' }],
  '3_M': [{ label: 'A', name: 'Peito + Tríceps',         color: '#059669' }, { label: 'B', name: 'Costas + Bíceps',          color: '#7C3AED' }, { label: 'C', name: 'Pernas + Core',             color: '#0EA5E9' }],
  '3_F': [{ label: 'A', name: 'Glúteos + Isquios',       color: '#EC4899' }, { label: 'B', name: 'Peito + Costas + Ombros', color: '#7C3AED' }, { label: 'C', name: 'Pernas + Core',             color: '#059669' }],
  '4_M': [{ label: 'A', name: 'Peito + Tríceps',         color: '#059669' }, { label: 'B', name: 'Costas + Bíceps',         color: '#7C3AED' }, { label: 'C', name: 'Pernas',                   color: '#0EA5E9' }, { label: 'D', name: 'Ombros + Core',           color: '#F59E0B' }],
  '4_F': [{ label: 'A', name: 'Glúteos',                 color: '#EC4899' }, { label: 'B', name: 'Peito + Tríceps',        color: '#059669' }, { label: 'C', name: 'Pernas + Panturrilha',     color: '#0EA5E9' }, { label: 'D', name: 'Costas + Bíceps',         color: '#7C3AED' }],
  '5_M': [{ label: 'A', name: 'Peito',                   color: '#059669' }, { label: 'B', name: 'Costas',                 color: '#7C3AED' }, { label: 'C', name: 'Pernas',                   color: '#0EA5E9' }, { label: 'D', name: 'Ombros',                 color: '#F59E0B' }, { label: 'E', name: 'Bíceps + Tríceps', color: '#DC2626' }],
  '5_F': [{ label: 'A', name: 'Glúteos',                 color: '#EC4899' }, { label: 'B', name: 'Pernas',                 color: '#0EA5E9' }, { label: 'C', name: 'Peito + Costas',           color: '#7C3AED' }, { label: 'D', name: 'Glúteos 2 + Isquios',    color: '#F97316' }, { label: 'E', name: 'Ombros + Braços + Core', color: '#059669' }],
}
export const WORKOUT_SCHEDULE: Record<number, number[]> = { 2: [1,4], 3: [1,3,5], 4: [1,2,4,5], 5: [1,2,3,4,5] }
export const LEVEL_LABEL: Record<string, string> = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }

// ── Dados de refeições ────────────────────────────────────────────────────────
export interface MealSlot { label: string; color: string; startH: number; endH: number; sub_M: string; sub_F: string }
export const MEAL_SLOTS: MealSlot[] = [
  { label: 'Café da manhã',   color: '#D97706', startH: 6,    endH: 9.5,  sub_M: 'Ovos · pão · fruta',                 sub_F: 'Ovos · queijo · fruta' },
  { label: 'Lanche manhã',    color: '#F59E0B', startH: 9.5,  endH: 12,   sub_M: 'Whey ou iogurte proteico',           sub_F: 'Whey ou iogurte proteico' },
  { label: 'Almoço',          color: '#059669', startH: 12,   endH: 14.5, sub_M: 'Arroz · feijão · frango · legumes',  sub_F: 'Arroz · feijão · frango · legumes' },
  { label: 'Lanche tarde',    color: '#0891B2', startH: 14.5, endH: 18,   sub_M: 'Whey + fruta ou sanduíche',          sub_F: 'Whey + fruta ou 2 ovos' },
  { label: 'Jantar',          color: '#7C3AED', startH: 18,   endH: 21,   sub_M: 'Arroz · proteína magra · legumes',   sub_F: 'Arroz · proteína magra · legumes' },
  { label: 'Ceia',            color: '#1E40AF', startH: 21,   endH: 24,   sub_M: 'Whey com água ou leite desnatado',   sub_F: 'Whey ou iogurte grego natural' },
]
export function getMealNow(): { slot: MealSlot; isCurrent: boolean } {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  const cur = MEAL_SLOTS.find(s => h >= s.startH && h < s.endH)
  if (cur) return { slot: cur, isCurrent: true }
  return { slot: MEAL_SLOTS.find(s => s.startH > h) ?? MEAL_SLOTS[0], isCurrent: false }
}
