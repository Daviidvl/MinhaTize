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
 * Escala impressa na seringa, que muda com a capacidade:
 * - 30 e 50 UI: um traço a cada 1 UI, números de 5 em 5
 * - 100 UI:     um traço a cada 2 UI, números de 10 em 10
 *
 * É a graduação mais comum no mercado; modelos específicos podem variar
 * (ex.: 30 UI com traços de 0,5 UI), por isso a tela mostra a escala
 * assumida para o usuário conferir na própria seringa.
 */
export function getSyringeScale(syringeCapacity: number): { unitsPerMark: number; labelEvery: number } {
  return syringeCapacity >= 100
    ? { unitsPerMark: 2, labelEvery: 10 }
    : { unitsPerMark: 1, labelEvery: 5 }
}

export interface SyringeGuidance {
  text: string
  // false quando a dose cai entre dois traços e não pode ser medida nessa seringa
  exact: boolean
  scaleNote: string
}

/**
 * Orientação de aspiração para a dose (em UI) na seringa escolhida.
 * Nunca arredonda a dose: se ela não coincide com um traço da seringa,
 * devolve `exact: false` com um aviso em vez de uma instrução.
 */
export function getSyringeGuidance(ui: number, syringeCapacity: number): SyringeGuidance {
  const { unitsPerMark, labelEvery } = getSyringeScale(syringeCapacity)
  const scaleNote =
    `Escala considerada para a seringa de ${syringeCapacity} UI: cada traço vale ${unitsPerMark} UI ` +
    `e os números aparecem de ${labelEvery} em ${labelEvery}. Confira na sua seringa antes de aspirar.`

  if (ui % unitsPerMark !== 0) {
    const smaller = [30, 50].filter(c => c < syringeCapacity && ui <= c)
    const alternative = smaller.length > 0
      ? `Use uma seringa de ${smaller.join(' ou ')} UI (1 UI por traço) para medir essa dose`
      : 'Essa dose não pode ser medida com precisão nesta seringa'
    return {
      exact: false,
      scaleNote,
      text:
        `Na seringa de ${syringeCapacity} UI cada traço vale ${unitsPerMark} UI, então ${ui} UI fica entre dois traços ` +
        `(${ui - 1} e ${ui + 1}) e não pode ser medido com exatidão. ${alternative}, ` +
        `ou confirme com seu médico ou farmacêutico como proceder.`,
    }
  }

  if (ui % labelEvery === 0) {
    return { exact: true, scaleNote, text: `Localize o número ${ui}.` }
  }

  const baseNumber = Math.floor(ui / labelEvery) * labelEvery
  const steps = (ui - baseNumber) / unitsPerMark
  const stepText = steps === 1 ? 'traço' : 'traços'
  const start = baseNumber === 0 ? 'A partir do zero, avance' : `Localize o número ${baseNumber} e avance`

  return { exact: true, scaleNote, text: `${start} ${steps} ${stepText}.` }
}

/**
 * Texto da orientação de aspiração. Sem informar a seringa, assume a escala
 * de 1 UI por traço (30/50 UI).
 */
export function generateGuidance(ui: number, syringeCapacity = 50): string {
  return getSyringeGuidance(ui, syringeCapacity).text
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
