export interface AmpolaOption {
  value: string
  label: string
  mg: number
  ml: number
}

export interface DoseOption {
  value: number
  label: string
}

export interface SyringeOption {
  value: number
  label: string
  maxUI: number
}

export interface CalculationResult {
  concentration: number
  volume: number
  ui: number
  isValid: boolean
  error?: string
}

export interface WeightEntry {
  date: string
  weight: number
}

export type PlateauStatus =
  | 'sem_sinal'
  | 'tendencia_queda'
  | 'possivel_estagnacao'
  | 'em_acompanhamento_14dias'
  | 'estagnacao_persistente'

export interface PlateauScreeningAnswers {
  fomeAumentou: boolean | null
  mudouRotina: boolean | null
  retencao: 'sim' | 'nao' | 'nao_sei' | null
  pesoEstavel: 'estavel' | 'oscilando' | 'nao_sei' | null
}

export interface PlateauNewUserAnswers {
  currentWeight: string
  weightThreeWeeksAgo: string
  stagnantThreeWeeks: 'sim' | 'nao' | 'nao_tenho_certeza' | null
}

export interface PlateauTracking {
  startDate: string
  origin: 'com_historico' | 'sem_historico'
  baselineWeight: number
}

export interface PlateauEvaluation {
  status: PlateauStatus
  updatedAt: string
  screeningAnswers?: PlateauScreeningAnswers
  newUserAnswers?: PlateauNewUserAnswers
  tracking?: PlateauTracking
  lastCycleResult?: { date: string; status: PlateauStatus; note: string }
  habitsPlan?: import('./utils/antiPlatoUtils').PlanData
}

export interface DiaryEntry {
  date: string
  dose: number
  feeling: 'great' | 'good' | 'okay' | 'hard'
  notes: string
}

export interface SideEffectEntry {
  date: string
  symptoms: { id: string; intensity: 0 | 1 | 2 | 3 }[]
  notes: string
}

export interface StockInfo {
  amouleMg: number
  ampouleML: number
  ampouleCount: number
}

export type Medication =
  | 'tirzepatida' | 'semaglutida' | 'ozempic' | 'wegovy' | 'mounjaro'
  | 'retatrutida' | 'outro'
export type Sex = 'female' | 'male' | 'other'

export const MEDICATION_LABELS: Record<Medication, string> = {
  tirzepatida: 'Tirzepatida',
  semaglutida: 'Semaglutida',
  ozempic: 'Ozempic',
  wegovy: 'Wegovy',
  mounjaro: 'Mounjaro',
  retatrutida: 'Retatrutida',
  outro: 'Outro',
}

// Doses rápidas oferecidas no cadastro — fonte única (não duplicar em outras telas)
export const DOSE_OPTIONS = [2.5, 5, 7.5, 10, 12.5, 15]

export const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const WEEK_DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export interface LabResult {
  examId: string
  value: number
  date: string
}

export interface UserProfile {
  name: string
  age?: number
  sex?: Sex
  medication: Medication
  medicationName?: string
  startWeight: number
  currentWeight?: number
  goalWeight: number
  height: number
  startDate: string
  currentDose?: number
  presentationMg?: number
  presentationMl?: number
  applicationDay?: number
  weightHistory: WeightEntry[]
  diary: DiaryEntry[]
  sideEffects: SideEffectEntry[]
  lastApplication?: string
  applicationLog?: string[]
  applicationNotes?: Record<string, string>
  applicationSites?: Record<string, string>
  stock?: StockInfo
  labResults?: LabResult[]
  plateau?: PlateauEvaluation
}

export type Tab = 'dashboard' | 'progress' | 'health' | 'calculator' | 'profile' | 'laboratory'
