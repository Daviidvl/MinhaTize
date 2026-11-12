import { describe, it, expect } from 'vitest'
import {
  getMedicationLabel, getDoseValue, getDoseLabel, hasPresentation, getAppsLeft, isLowStock, stockMonths,
  resolveDoseMode, LOW_STOCK_APPS,
} from '../medicationUtils'
import { UserProfile } from '../../types'

const PROFILE: UserProfile = {
  name: 'Ana', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
  startDate: '2026-01-01', currentDose: 5, weightHistory: [], diary: [], sideEffects: [],
}

describe('medicationUtils', () => {
  it('labels the medication, using the typed name for "outro"', () => {
    expect(getMedicationLabel(PROFILE)).toBe('Tirzepatida')
    expect(getMedicationLabel({ ...PROFILE, medication: 'outro', medicationName: ' Saxenda ' })).toBe('Saxenda')
    expect(getMedicationLabel({ ...PROFILE, medication: 'outro' })).toBe('Outro')
  })

  it('treats a missing or zero dose as unknown', () => {
    expect(getDoseValue({ ...PROFILE, currentDose: 0 })).toBeNull()
    expect(getDoseLabel({ ...PROFILE, currentDose: undefined })).toBe('Dose não informada')
    expect(getDoseLabel(PROFILE)).toBe('5mg')
  })

  it('needs mg and mL to have a presentation', () => {
    expect(hasPresentation({ ...PROFILE, presentationMg: 30 })).toBe(false)
    expect(hasPresentation({ ...PROFILE, presentationMg: 30, presentationMl: 1 })).toBe(true)
  })

  it('counts whole applications left in the stock', () => {
    expect(getAppsLeft(PROFILE)).toBeNull()
    expect(getAppsLeft({ ...PROFILE, stock: { amouleMg: 30, ampouleML: 1, ampouleCount: 2 } })).toBe(12)
    expect(getAppsLeft({ ...PROFILE, currentDose: 7.5, stock: { amouleMg: 20, ampouleML: 1, ampouleCount: 1 } })).toBe(2)
  })

  it('flags low stock below the shared threshold and converts to months', () => {
    expect(isLowStock(null)).toBe(false)
    expect(isLowStock(LOW_STOCK_APPS - 1)).toBe(true)
    expect(isLowStock(LOW_STOCK_APPS)).toBe(false)
    expect(stockMonths(12)).toBe(3)
    expect(stockMonths(1)).toBe(0)
  })

  it('derives the dose editing mode from a saved profile', () => {
    expect(resolveDoseMode(PROFILE)).toEqual({ mode: 'fixed', fixedValue: 5, customValue: '' })
    expect(resolveDoseMode({ ...PROFILE, currentDose: 6 })).toEqual({ mode: 'custom', fixedValue: 2.5, customValue: '6' })
    expect(resolveDoseMode({ ...PROFILE, currentDose: undefined }).mode).toBe('unknown')
  })
})
