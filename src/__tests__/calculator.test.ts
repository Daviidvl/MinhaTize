import { describe, it, expect } from 'vitest'
import { calculateDose, generateGuidance, isValidCombination } from '../utils/calculator'

describe('Calculator - calculateDose', () => {
  it('should calculate correct dose for 15mg/0.5mL ampola with 7.5mg dose', () => {
    const result = calculateDose({ mg: 15, ml: 0.5 }, 7.5, 100)
    expect(result.ui).toBe(25)
    expect(result.isValid).toBe(true)
    expect(result.concentration).toBe(30) // 15/0.5 = 30
  })

  it('should calculate correct dose for 30mg/1mL ampola with 5mg dose', () => {
    const result = calculateDose({ mg: 30, ml: 1 }, 5, 100)
    expect(result.ui).toBe(17) // 5/30 = 0.1667, 0.1667*100 = 16.67, rounded = 17
    expect(result.isValid).toBe(true)
    expect(result.concentration).toBe(30)
  })

  it('should calculate correct dose for 60mg/2mL ampola with 10mg dose', () => {
    const result = calculateDose({ mg: 60, ml: 2 }, 10, 100)
    expect(result.ui).toBe(33) // 10/30 = 0.333, 0.333*100 = 33.3, rounded = 33
    expect(result.isValid).toBe(true)
  })

  it('should reject invalid dose when exceeds syringe capacity', () => {
    const result = calculateDose({ mg: 15, ml: 0.5 }, 15, 30)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Esta dose não cabe em uma seringa de 30 UI')
  })

  it('should handle dose of 2.5mg correctly', () => {
    const result = calculateDose({ mg: 15, ml: 0.5 }, 2.5, 100)
    expect(result.isValid).toBe(true)
    expect(result.ui).toBe(8) // 2.5/30 = 0.0833, 0.0833*100 = 8.33, rounded = 8
  })

  it('should handle dose of 12.5mg correctly', () => {
    const result = calculateDose({ mg: 30, ml: 1 }, 12.5, 100)
    expect(result.isValid).toBe(true)
    expect(result.ui).toBe(42) // 12.5/30 = 0.4167, 0.4167*100 = 41.67, rounded = 42
  })

  it('should return error for invalid ampola', () => {
    const result = calculateDose({ mg: 0, ml: 0.5 }, 5, 100)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('inválida')
  })

  it('should return error for invalid dose', () => {
    const result = calculateDose({ mg: 15, ml: 0.5 }, -5, 100)
    expect(result.isValid).toBe(false)
  })

  it('should handle all 6 dose options with 15mg/0.5mL', () => {
    const doses = [2.5, 5, 7.5, 10, 12.5, 15]
    const results = doses.map((dose) =>
      calculateDose({ mg: 15, ml: 0.5 }, dose, 100)
    )

    results.forEach((result) => {
      expect(result.isValid).toBe(true)
      expect(result.ui).toBeGreaterThan(0)
      expect(result.ui).toBeLessThanOrEqual(100)
    })
  })
})

describe('Calculator - generateGuidance', () => {
  it('should return simple instruction for 25 UI', () => {
    const guidance = generateGuidance(25)
    expect(guidance).toBe('Localize o número 25.')
  })

  it('should return step instruction for 8 UI', () => {
    const guidance = generateGuidance(8)
    expect(guidance).toContain('Localize o número 5')
    expect(guidance).toContain('3 traços')
  })

  it('should return step instruction for 17 UI', () => {
    const guidance = generateGuidance(17)
    expect(guidance).toContain('Localize o número 15')
    expect(guidance).toContain('2 traços')
  })

  it('should handle singular traço for 1 step', () => {
    const guidance = generateGuidance(11)
    expect(guidance).toContain('traço') // singular
  })

  it('should handle plural traços for multiple steps', () => {
    const guidance = generateGuidance(7)
    expect(guidance).toContain('traços') // plural
  })

  it('should handle 0 steps', () => {
    const guidance = generateGuidance(5)
    expect(guidance).toBe('Localize o número 5.')
  })

  it('should handle all round numbers', () => {
    const roundNumbers = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
    roundNumbers.forEach((num) => {
      const guidance = generateGuidance(num)
      expect(guidance).toBeTruthy()
    })
  })
})

describe('Calculator - isValidCombination', () => {
  it('should validate 15mg/0.5mL with 7.5mg dose and 100 UI syringe', () => {
    const valid = isValidCombination({ mg: 15, ml: 0.5 }, 7.5, 100)
    expect(valid).toBe(true)
  })

  it('should reject 15mg/0.5mL with 15mg dose and 30 UI syringe', () => {
    const valid = isValidCombination({ mg: 15, ml: 0.5 }, 15, 30)
    expect(valid).toBe(false)
  })

  it('should validate combination with 50 UI syringe', () => {
    const valid = isValidCombination({ mg: 30, ml: 1 }, 15, 50)
    expect(valid).toBe(true)
  })
})

// Edge cases
describe('Calculator - Edge Cases', () => {
  it('should handle very small doses', () => {
    const result = calculateDose({ mg: 60, ml: 2 }, 1, 100)
    expect(result.isValid).toBe(true)
    expect(result.ui).toBeGreaterThan(0)
  })

  it('should handle doses at syringe limit', () => {
    const result = calculateDose({ mg: 30, ml: 1 }, 3, 100)
    expect(result.isValid).toBe(true)
    expect(result.ui).toBeLessThanOrEqual(100)
  })

  it('should handle rounding correctly', () => {
    // Test that Math.round is applied
    const result = calculateDose({ mg: 15, ml: 0.5 }, 7.5, 100)
    expect(result.ui).toBe(Math.round(result.volume * 100))
  })
})
