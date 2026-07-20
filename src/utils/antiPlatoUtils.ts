export const FOOD_ITEMS = [
  'Café com açúcar',
  'Molhos (maionese, ketchup, etc.)',
  'Refrigerantes',
  'Bebidas alcoólicas',
  'Beliscos entre refeições',
  'Doces diários',
  'Bebidas calóricas (sucos, vitaminas)',
  'Óleo em excesso',
  'Fast food frequente',
  'Petiscos noturnos',
]

export const MEDS_LIST = [
  'Antidepressivos',
  'Corticoides',
  'Antipsicóticos',
  'Insulina',
  'Outros',
]

export const CHECK_ITEMS = [
  { id: 'water',    label: 'Água',               detail: '2–3 litros' },
  { id: 'food',     label: 'Registro alimentar',  detail: ''           },
  { id: 'protein',  label: 'Proteína',            detail: ''           },
  { id: 'steps',    label: 'Passos',              detail: ''           },
  { id: 'exercise', label: 'Treino',              detail: ''           },
  { id: 'sleep',    label: 'Sono',                detail: '7+ horas'   },
]

export const WEIGH_DAYS = [1, 4, 8, 12, 14]

export type WizardStep =
  | 'intro' | 'step1' | 'not-plateau'
  | 'step2' | 'step3' | 'step4' | 'step5' | 'step6'
  | 'diagnosis' | 'plan' | 'reeval' | 'report'

export const STEP_NUMS: Partial<Record<WizardStep, number>> = {
  step1: 1, step2: 2, step3: 3, step4: 4, step5: 5, step6: 6,
}

export interface Answers {
  usingMed: boolean | null
  stableDuration: 'lt2' | '2to4' | 'gt4' | null
  recentExcess: boolean | null
  routineChange: boolean | null
  menstruating: 'yes' | 'no' | 'na' | null
  weightGainDay: boolean | null
  foodItems: string[]
  currentWeight: string
  meetsProtein: boolean | null
  usesWhey: boolean | null
  dailySteps: string | null
  strengthTraining: string | null
  cardio: string | null
  sleepHours: string | null
  stressLevel: number
  medications: string[]
}

export interface PriorityItem {
  id: string
  level: 'high' | 'moderate' | 'low'
  label: string
  detail: string
}

export interface PlanData {
  startDate: string
  checks: Record<string, boolean[]>
  weighIns: Record<string, string>
  proteinMin: number
  proteinMax: number
  stepsGoal: string
  priorities: PriorityItem[]
  reevalResult?: 'dropped' | 'same' | 'increased'
  aiReport?: string
}

export const DEFAULT_ANSWERS: Answers = {
  usingMed: null, stableDuration: null, recentExcess: null,
  routineChange: null, menstruating: null, weightGainDay: null,
  foodItems: [], currentWeight: '', meetsProtein: null, usesWhey: null,
  dailySteps: null, strengthTraining: null, cardio: null,
  sleepHours: null, stressLevel: 5, medications: [],
}

export function computeDiagnosis(a: Answers): PriorityItem[] {
  const items: PriorityItem[] = []
  const w = parseFloat(a.currentWeight) || 0
  if (a.meetsProtein === false)
    items.push({ id: 'protein', level: 'high', label: 'Baixa ingestão de proteínas', detail: w > 0 ? `Meta: ${Math.round(w * 1.2)}–${Math.round(w * 1.5)} g/dia` : '' })
  if (a.foodItems.length >= 6)
    items.push({ id: 'calories', level: 'high', label: 'Possível excesso calórico oculto', detail: `${a.foodItems.length} fatores identificados` })
  else if (a.foodItems.length >= 3)
    items.push({ id: 'calories', level: 'moderate', label: 'Calorias ocultas — risco moderado', detail: `${a.foodItems.length} fatores identificados` })
  if (a.dailySteps && ['lt3000', '3to5k', '5to7k'].includes(a.dailySteps))
    items.push({ id: 'steps', level: 'moderate', label: 'Pouca movimentação diária', detail: 'Meta: 7.000–8.000 passos/dia' })
  if (a.strengthTraining && ['never', '1x'].includes(a.strengthTraining))
    items.push({ id: 'strength', level: 'moderate', label: 'Treino de força insuficiente', detail: 'Recomendado: 2–3x por semana' })
  if (a.sleepHours && ['lt5', '5to6'].includes(a.sleepHours))
    items.push({ id: 'sleep', level: 'moderate', label: 'Sono insuficiente', detail: 'Meta: 7+ horas por noite' })
  if (a.stressLevel > 7)
    items.push({ id: 'stress', level: 'moderate', label: 'Estresse elevado', detail: `Nível ${a.stressLevel}/10` })
  if (a.cardio && ['no', '1x'].includes(a.cardio))
    items.push({ id: 'cardio', level: 'low', label: 'Cardio abaixo do recomendado', detail: 'Recomendado: 2x por semana' })
  if (a.medications.length > 0)
    items.push({ id: 'meds', level: 'low', label: 'Medicamentos que podem interferir', detail: a.medications.join(', ') })
  return items.sort((x, y) =>
    ['high', 'moderate', 'low'].indexOf(x.level) - ['high', 'moderate', 'low'].indexOf(y.level)
  )
}

export function getDayNumber(startDate: string): number {
  const startMs = new Date(startDate).getTime()
  const todayMs = new Date(new Date().toISOString().split('T')[0]).getTime()
  const diff    = Math.round((todayMs - startMs) / 86400000)
  return Math.min(14, Math.max(1, diff + 1))
}

export function getRawDay(startDate: string): number {
  const startMs = new Date(startDate).getTime()
  const todayMs = new Date(new Date().toISOString().split('T')[0]).getTime()
  return Math.round((todayMs - startMs) / 86400000) + 1
}
