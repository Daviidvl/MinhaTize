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

export interface UserProfile {
  name: string
  startWeight: number
  goalWeight: number
  height: number
  startDate: string
  currentDose: number
  weightHistory: WeightEntry[]
  diary: DiaryEntry[]
  sideEffects: SideEffectEntry[]
  lastApplication?: string
}

export type Tab = 'dashboard' | 'progress' | 'calculator' | 'health' | 'settings'
