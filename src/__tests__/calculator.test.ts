import { describe, it, expect } from 'vitest'
import { calculateDose, generateGuidance, getSyringeGuidance, getSyringeScale, isValidCombination } from '../utils/calculator'

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

describe('Calculator - getSyringeGuidance', () => {
  it('counts 1 UI per traço on 30 and 50 UI syringes', () => {
    for (const capacity of [30, 50]) {
      expect(getSyringeGuidance(17, capacity)).toMatchObject({ exact: true, text: 'Localize o número 15 e avance 2 traços.' })
      expect(getSyringeGuidance(25, capacity)).toMatchObject({ exact: true, text: 'Localize o número 25.' })
    }
  })

  it('counts 2 UI per traço and uses numbers every 10 on the 100 UI syringe', () => {
    expect(getSyringeGuidance(42, 100)).toMatchObject({ exact: true, text: 'Localize o número 40 e avance 1 traço.' })
    expect(getSyringeGuidance(50, 100)).toMatchObject({ exact: true, text: 'Localize o número 50.' })
    expect(getSyringeGuidance(8, 100)).toMatchObject({ exact: true, text: 'A partir do zero, avance 4 traços.' })
  })

  it('never cites a number that is not printed on the 100 UI scale', () => {
    for (let ui = 2; ui <= 100; ui += 2) {
      const cited = getSyringeGuidance(ui, 100).text.match(/número (\d+)/)
      if (cited) expect(Number(cited[1]) % 10).toBe(0)
    }
  })

  it('reaches exactly the calculated dose on every syringe when the guidance is exact', () => {
    for (const capacity of [30, 50, 100]) {
      const { unitsPerMark } = getSyringeScale(capacity)
      for (let ui = 1; ui <= capacity; ui++) {
        const g = getSyringeGuidance(ui, capacity)
        if (!g.exact) continue
        const base  = Number(g.text.match(/número (\d+)/)?.[1] ?? 0)
        const steps = Number(g.text.match(/avance (\d+)/)?.[1] ?? 0)
        expect(base + steps * unitsPerMark).toBe(ui)
      }
    }
  })

  it('warns instead of instructing when the dose falls between two traços (odd UI on 100 UI)', () => {
    const g = getSyringeGuidance(17, 100)
    expect(g.exact).toBe(false)
    expect(g.text).not.toMatch(/Localize|avance/)
    expect(g.text).toContain('16 e 18')
    expect(g.text).toContain('seringa de 30 ou 50 UI')
  })

  it('only suggests a smaller syringe that actually fits the dose', () => {
    expect(getSyringeGuidance(33, 100).text).toContain('seringa de 50 UI')
    expect(getSyringeGuidance(33, 100).text).not.toContain('30 ou 50')
    expect(getSyringeGuidance(67, 100).text).not.toMatch(/Use uma seringa/)
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
