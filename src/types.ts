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

export type Medication = 'tirzepatida' | 'semaglutida' | 'ozempic' | 'wegovy' | 'mounjaro'
export type Sex = 'female' | 'male' | 'other'

export const MEDICATION_LABELS: Record<Medication, string> = {
  tirzepatida: 'Tirzepatida',
  semaglutida: 'Semaglutida',
  ozempic: 'Ozempic',
  wegovy: 'Wegovy',
  mounjaro: 'Mounjaro',
}

export const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const WEEK_DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export interface UserProfile {
  name: string
  age?: number
  sex?: Sex
  medication: Medication
  startWeight: number
  currentWeight?: number
  goalWeight: number
  height: number
  startDate: string
  currentDose: number
  applicationDay?: number
  weightHistory: WeightEntry[]
  diary: DiaryEntry[]
  sideEffects: SideEffectEntry[]
  lastApplication?: string
  stock?: StockInfo
}

export type Tab = 'dashboard' | 'progress' | 'health' | 'calculator' | 'profile'
