import { CalculationResult } from '../types'

/**
 * Calcula a dose em unidades (UI) baseado na fórmula da Tirzepatida
 * 
 * Fórmula:
 * 1. Concentração = mg ÷ mL
 * 2. Volume = doseDesejada ÷ concentração
 * 3. UI = volume × 100
 * 4. UI = Math.round(UI)
 * 
 * @param ampola - Objeto com { mg, mL }
 * @param doseDesejada - Dose em mg
 * @param syringeCapacity - Capacidade da seringa em UI
 * @returns CalculationResult com os detalhes do cálculo
 */
export function calculateDose(
  ampola: { mg: number; ml: number },
  doseDesejada: number,
  syringeCapacity: number
): CalculationResult {
  try {
    // Validações
    if (!ampola || ampola.mg <= 0 || ampola.ml <= 0) {
      return {
        concentration: 0,
        volume: 0,
        ui: 0,
        isValid: false,
        error: 'Ampola inválida',
      }
    }

    if (doseDesejada <= 0) {
      return {
        concentration: 0,
        volume: 0,
        ui: 0,
        isValid: false,
        error: 'Dose desejada inválida',
      }
    }

    // 1. Calcular concentração (mg/mL)
    const concentration = ampola.mg / ampola.ml

    // 2. Calcular volume (mL)
    const volume = doseDesejada / concentration

    // 3. Converter para UI
    const ui = Math.round(volume * 100)

    // 4. Verificar se cabe na seringa
    if (ui > syringeCapacity) {
      return {
        concentration,
        volume,
        ui,
        isValid: false,
        error: `Esta dose não cabe em uma seringa de ${syringeCapacity} UI.`,
      }
    }

    return {
      concentration,
      volume,
      ui,
      isValid: true,
    }
  } catch {
    return {
      concentration: 0,
      volume: 0,
      ui: 0,
      isValid: false,
      error: 'Erro ao realizar cálculo',
    }
  }
}

/**
 * Gera instrução de orientação baseada na quantidade de UI
 * 
 * Regras:
 * - Se é múltiplo de 5: usa marcações
 * - Senão: arredonda para o mais próximo múltiplo de 5
 * 
 * @param ui - Quantidade de unidades
 * @returns String com a orientação
 */
export function generateGuidance(ui: number): string {
  // Se é um múltiplo de 5
  if (ui % 5 === 0) {
    return `Localize o número ${ui}.`
  }

  // Se não é múltiplo de 5, encontrar o mais próximo
  const baseNumber = Math.floor(ui / 5) * 5
  const steps = ui - baseNumber
  const stepText = steps === 1 ? 'traço' : 'traços'

  return `Localize o número ${baseNumber} e avance ${steps} ${stepText}.`
}

/**
 * Valida se uma combinação ampola + dose + seringa é viável
 */
export function isValidCombination(
  ampola: { mg: number; ml: number },
  doseDesejada: number,
  syringeCapacity: number
): boolean {
  const result = calculateDose(ampola, doseDesejada, syringeCapacity)
  return result.isValid
}
