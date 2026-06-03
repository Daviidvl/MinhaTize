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

export interface UserProfile {
  name: string
  startWeight: number
  goalWeight: number
  height: number
  startDate: string
  currentDose: number
  weightHistory: WeightEntry[]
}

export type Tab = 'dashboard' | 'progress' | 'calculator'
