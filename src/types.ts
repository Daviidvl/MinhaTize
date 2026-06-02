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
  concentration: number // mg/mL
  volume: number // mL
  ui: number // UI arredondado
  isValid: boolean
  error?: string
}
