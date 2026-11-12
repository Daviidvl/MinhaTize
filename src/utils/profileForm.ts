import type { Medication } from '../types'
import { calcIMC } from './bmiUtils'
import type { DoseMode } from './medicationUtils'
import { todayStr } from './dateUtils'

// Regras dos formulários de perfil — o cadastro inicial (ProfileSetup) e a
// edição (ProfilePage) aceitam exatamente os mesmos valores.
//
// Os campos chegam como texto do <input>. "Block" impede salvar; "Warn" só
// pede confirmação. Campo vazio não gera mensagem: a obrigatoriedade é
// verificada por quem monta o formulário.

export const WEIGHT_KG  = { min: 20, max: 500 }
const HEIGHT_CM  = { min: 80, max: 280 }
const AGE_YEARS  = { min: 18, max: 120 }

const isBlank = (val: string) => !val || val.trim() === ''

function inRange(val: string, { min, max }: { min: number; max: number }): boolean {
  const n = parseFloat(val)
  return n >= min && n <= max
}

export const isValidWeight = (val: string) => inRange(val, WEIGHT_KG)
export const isValidHeight = (val: string) => inRange(val, HEIGHT_CM)

export function weightBlock(val: string): string | null {
  if (isBlank(val)) return null
  const w = parseFloat(val)
  if (isNaN(w) || w <= 0) return 'Informe um peso válido em kg.'
  if (w < WEIGHT_KG.min) return `${val}kg é um peso impossível. Verifique o valor informado.`
  if (w > WEIGHT_KG.max) return `${val}kg está fora dos limites. Verifique o valor informado.`
  return null
}

export function weightWarn(val: string): string | null {
  const w = parseFloat(val)
  if (!val || isNaN(w)) return null
  if (w < 30) return `${val}kg parece muito baixo. Confirme se o peso está correto.`
  if (w > 350) return `${val}kg é um valor incomum. Confirme se o peso está correto.`
  return null
}

export function heightBlock(val: string): string | null {
  if (isBlank(val)) return null
  const h = parseFloat(val)
  if (isNaN(h) || h <= 0) return 'Informe uma altura válida em centímetros.'
  if (h < HEIGHT_CM.min) return `${val}cm é uma altura impossível. Verifique o valor informado.`
  if (h > HEIGHT_CM.max) return `${val}cm está fora dos limites. Verifique o valor informado.`
  return null
}

export function heightWarn(val: string): string | null {
  const h = parseFloat(val)
  if (!val || isNaN(h)) return null
  if (h < 100) return `${val}cm é muito baixo. A altura deve ser em centímetros (ex: 168).`
  if (h > 230) return `${val}cm parece incomum. Confirme se a altura está em centímetros.`
  return null
}

// A idade é opcional, mas quando informada precisa ser válida: os Termos de Uso
// restringem o app a maiores de 18 anos.
export function ageBlock(val: string): string | null {
  if (isBlank(val)) return null
  const a = Number(val)
  if (!Number.isInteger(a) || a <= 0 || a > AGE_YEARS.max) return 'Informe uma idade válida.'
  if (a < AGE_YEARS.min) return 'O MinhaTize é destinado a maiores de 18 anos.'
  return null
}

export function ageWarn(val: string): string | null {
  const a = parseInt(val)
  if (!val || isNaN(a)) return null
  if (a > 110) return 'Idade muito alta. Confirme o valor informado.'
  return null
}

// Altura e peso válidos isoladamente, mas que juntos dão um IMC impossível
export function coherenceBlock(height: string, weight: string): string | null {
  const h = parseFloat(height), w = parseFloat(weight)
  if (!h || !w || h < HEIGHT_CM.min || w < WEIGHT_KG.min) return null
  const bmi = calcIMC(w, h)
  if (bmi === null) return null
  if (bmi < 8)  return `Com ${h}cm e ${w}kg, o IMC seria ${bmi.toFixed(1)} — fisicamente impossível. Verifique se altura está em cm e peso em kg.`
  if (bmi > 90) return `Com ${h}cm e ${w}kg, o IMC seria ${bmi.toFixed(1)} — valor extremo. Confirme se os dados estão corretos.`
  return null
}

export function goalWarn(start: string, goal: string): string | null {
  const s = parseFloat(start), g = parseFloat(goal)
  if (!s || !g || g >= s) return null
  const loss    = s - g
  const lossPct = (loss / s) * 100
  if (g < 30) return 'Meta abaixo de 30kg pode não ser saudável. Considere revisar a meta.'
  if (loss > 80 || lossPct > 60)
    return `Perder ${loss.toFixed(0)}kg (${lossPct.toFixed(0)}% do peso) é uma meta muito agressiva para um protocolo GLP-1. Considere uma meta mais gradual.`
  if (loss > 40)
    return `Meta de perder ${loss.toFixed(0)}kg é significativa. O GLP-1 apoiará este processo de forma gradual e segura.`
  return null
}

export function startDateBlock(date: string): string | null {
  if (!date) return 'Informe a data de início do protocolo.'
  if (date > todayStr()) return 'A data de início não pode ser no futuro.'
  return null
}

// ── Medicamento e dose ────────────────────────────────────────────────────────

const MIN_MEDICATION_NAME = 2

// "Outro" exige o nome do medicamento
export function medicationNameOk(medication: Medication, name: string): boolean {
  return medication !== 'outro' || name.trim().length >= MIN_MEDICATION_NAME
}

// A retatrutida não tem grade de doses fixas: escolher ela sai do modo "fixa"
export function doseModeForMedication(medication: Medication, mode: DoseMode): DoseMode {
  return medication === 'retatrutida' && mode === 'fixed' ? 'custom' : mode
}

export function customDoseOk(mode: DoseMode, customDose: string): boolean {
  return mode !== 'custom' || parseFloat(customDose) > 0
}

// Dose por aplicação a gravar no perfil (undefined = "não sei informar")
export function resolveDose(mode: DoseMode, fixedDose: number, customDose: string): number | undefined {
  if (mode === 'unknown') return undefined
  if (mode === 'fixed') return fixedDose
  const n = parseFloat(customDose)
  return n > 0 ? n : undefined
}

// Apresentação (mg / mL) só vale com os dois campos preenchidos
export function resolvePresentation(mg: string, ml: string): { presentationMg?: number; presentationMl?: number } {
  const presMg = parseFloat(mg), presMl = parseFloat(ml)
  return presMg > 0 && presMl > 0 ? { presentationMg: presMg, presentationMl: presMl } : { presentationMg: undefined, presentationMl: undefined }
}
