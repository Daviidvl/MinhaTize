import { describe, it, expect, afterEach, vi } from 'vitest'
import { buildReportPayload, requestPlateauReport } from '../plateauReport'
import type { PlanData } from '../../types'

const PLAN: PlanData = {
  startDate: '2026-10-01', checks: {}, weighIns: { '1': '88.4' }, proteinMin: 106, proteinMax: 133, stepsGoal: '7000',
  priorities: [
    { id: 'protein', level: 'high', label: 'Baixa ingestão de proteínas', detail: '' },
    { id: 'sleep', level: 'moderate', label: 'Sono insuficiente', detail: '' },
  ],
}

describe('buildReportPayload', () => {
  it('sends only the five summarized fields', () => {
    expect(buildReportPayload(PLAN)).toEqual({
      prioridades: 'high: Baixa ingestão de proteínas | moderate: Sono insuficiente',
      proteina: 'insuficiente',
      passos_meta: '7000',
      peso_kg: '88.4',
      resultado_14_dias: 'sem dado',
    })
  })

  it('reports adequate protein and missing data explicitly', () => {
    const p = buildReportPayload({ ...PLAN, priorities: [], weighIns: {}, reevalResult: 'same' })
    expect(p).toMatchObject({ proteina: 'adequada', peso_kg: 'não informado', resultado_14_dias: 'same' })
  })
})

describe('requestPlateauReport', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns the report text', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ text: 'Relatório' })))))
    await expect(requestPlateauReport(PLAN)).resolves.toBe('Relatório')
  })

  it('fails on HTTP errors and on error bodies', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 429 }))))
    await expect(requestPlateauReport(PLAN)).rejects.toThrow('HTTP 429')
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error: 'x' })))))
    await expect(requestPlateauReport(PLAN)).rejects.toThrow('x')
  })
})
