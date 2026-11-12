import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  isValidWeight, isValidHeight, weightBlock, heightBlock, ageBlock, coherenceBlock, goalWarn, startDateBlock,
  medicationNameOk, doseModeForMedication, customDoseOk, resolveDose, resolvePresentation,
} from '../profileForm'

// Cadastro inicial e edição do perfil usam estas mesmas regras
describe('profileForm — faixas aceitas', () => {
  it('accepts weights from 20 to 500 kg and heights from 80 to 280 cm', () => {
    expect(['20', '72.5', '500'].every(isValidWeight)).toBe(true)
    expect(['19.9', '501', '', 'abc'].some(isValidWeight)).toBe(false)
    expect(['80', '168', '280'].every(isValidHeight)).toBe(true)
    expect(['79', '281', ''].some(isValidHeight)).toBe(false)
  })

  it('blocks impossible values with a message and leaves empty fields alone', () => {
    expect(weightBlock('')).toBeNull()
    expect(weightBlock('10')).toMatch(/impossível/)
    expect(weightBlock('600')).toMatch(/fora dos limites/)
    expect(heightBlock('1.70')).toMatch(/impossível/)
    expect(heightBlock('170')).toBeNull()
  })

  it('requires adults when the age is informed', () => {
    expect(ageBlock('')).toBeNull()
    expect(ageBlock('17')).toMatch(/maiores de 18/)
    expect(ageBlock('30.5')).toMatch(/idade válida/)
    expect(ageBlock('35')).toBeNull()
  })

  it('catches a height/weight pair whose BMI is impossible', () => {
    expect(coherenceBlock('80', '500')).toMatch(/valor extremo/)
    expect(coherenceBlock('170', '70')).toBeNull()
  })

  it('warns about aggressive goals', () => {
    expect(goalWarn('150', '60')).toMatch(/muito agressiva/)
    expect(goalWarn('90', '75')).toBeNull()
  })

  describe('startDateBlock', () => {
    afterEach(() => { vi.useRealTimers() })
    it('rejects a missing or future start date', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 10, 11, 10))
      expect(startDateBlock('')).toMatch(/Informe/)
      expect(startDateBlock('2026-11-12')).toMatch(/futuro/)
      expect(startDateBlock('2026-11-11')).toBeNull()
    })
  })
})

describe('profileForm — medicamento e dose', () => {
  it('requires the name only for "outro"', () => {
    expect(medicationNameOk('outro', ' X ')).toBe(false)
    expect(medicationNameOk('outro', 'Saxenda')).toBe(true)
    expect(medicationNameOk('tirzepatida', '')).toBe(true)
  })

  it('leaves the fixed-dose grid when switching to retatrutida', () => {
    expect(doseModeForMedication('retatrutida', 'fixed')).toBe('custom')
    expect(doseModeForMedication('retatrutida', 'unknown')).toBe('unknown')
    expect(doseModeForMedication('mounjaro', 'fixed')).toBe('fixed')
  })

  it('resolves the dose for each mode', () => {
    expect(resolveDose('fixed', 7.5, '')).toBe(7.5)
    expect(resolveDose('custom', 2.5, '6')).toBe(6)
    expect(resolveDose('custom', 2.5, '0')).toBeUndefined()
    expect(resolveDose('unknown', 2.5, '6')).toBeUndefined()
    expect(customDoseOk('custom', '')).toBe(false)
    expect(customDoseOk('fixed', '')).toBe(true)
  })

  it('keeps the presentation only when both mg and mL are filled', () => {
    expect(resolvePresentation('30', '1')).toEqual({ presentationMg: 30, presentationMl: 1 })
    expect(resolvePresentation('30', '')).toEqual({ presentationMg: undefined, presentationMl: undefined })
  })
})
