import type { PlanData } from '../types'
import { getStoredToken } from './token'

// Relatório educativo do plano anti-platô, gerado por IA no servidor
// (api/generate-report.ts). Só estes cinco campos saem do aparelho — o servidor
// descarta qualquer outro.

export interface PlateauReportPayload {
  prioridades: string
  proteina: 'insuficiente' | 'adequada'
  passos_meta: string
  peso_kg: string
  resultado_14_dias: string
}

export function buildReportPayload(plan: PlanData): PlateauReportPayload {
  return {
    prioridades: plan.priorities.map(p => `${p.level}: ${p.label}`).join(' | '),
    proteina:    plan.priorities.some(p => p.id === 'protein') ? 'insuficiente' : 'adequada',
    passos_meta: plan.stepsGoal,
    peso_kg:     plan.weighIns['1'] ?? 'não informado',
    resultado_14_dias: plan.reevalResult ?? 'sem dado',
  }
}

// Texto do relatório; lança erro se o servidor recusar ou não responder
export async function requestPlateauReport(plan: PlanData): Promise<string> {
  const res = await fetch('/api/generate-report', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${getStoredToken() ?? ''}` },
    body: JSON.stringify(buildReportPayload(plan)),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json() as { text?: string; error?: string }
  if (data.error) throw new Error(data.error)
  return data.text ?? 'Relatório não disponível.'
}
