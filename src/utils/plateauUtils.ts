import {
  PlateauEvaluation, PlateauNewUserAnswers, PlateauStatus, PlateauTracking, UserProfile, WeightEntry,
} from '../types'

// Fonte única de análise de tendência de peso e status de platô — nenhuma outra
// tela deve reimplementar este cálculo ou ler profile.plateau diretamente.

const LOOKBACK_DAYS = 21
const MIN_SPAN_GATE_DAYS = 7
const MIN_ENTRIES_VERDICT = 3
const MIN_SPAN_VERDICT_DAYS = 14
const FLAT_BAND_PCT = 0.015
const DECLINE_SLOPE_KG_WEEK = -0.3

export type TrendVerdict = 'insuficiente' | 'queda' | 'estagnacao_provavel'
export type ReassessmentVerdict = 'tendencia_queda' | 'oscilacao_inconclusiva' | 'estagnacao_persistente'

export interface WeightTrend {
  points: WeightEntry[]
  spanDays: number
  slopeKgPerWeek: number | null
  amplitude: number
  verdict: TrendVerdict
}

function toDayMs(date: string): number {
  return new Date(date + 'T12:00:00').getTime()
}

function allPoints(profile: UserProfile): WeightEntry[] {
  const points = [{ date: profile.startDate, weight: profile.startWeight }, ...profile.weightHistory]
  return [...points].sort((a, b) => toDayMs(a.date) - toDayMs(b.date))
}

function pointsInWindow(points: WeightEntry[], windowDays: number, from?: string): WeightEntry[] {
  const endMs = from ? toDayMs(from) : Date.now()
  const startMs = endMs - windowDays * 86400000
  return points.filter(p => toDayMs(p.date) >= startMs && toDayMs(p.date) <= endMs)
}

// Regressão linear simples (mínimos quadrados) de peso vs. dias, retorna kg/semana.
function linearSlopeKgPerWeek(points: WeightEntry[]): number | null {
  if (points.length < 2) return null
  const x0 = toDayMs(points[0].date)
  const xs = points.map(p => (toDayMs(p.date) - x0) / 86400000)
  const ys = points.map(p => p.weight)
  const n = xs.length
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0)
  const sumXX = xs.reduce((a, x) => a + x * x, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return 0
  const slopePerDay = (n * sumXY - sumX * sumY) / denom
  return slopePerDay * 7
}

export function hasUsableHistory(profile: UserProfile): boolean {
  const points = allPoints(profile)
  if (points.length < 2) return false
  const span = (toDayMs(points[points.length - 1].date) - toDayMs(points[0].date)) / 86400000
  return span >= MIN_SPAN_GATE_DAYS
}

export function getWeightTrend(profile: UserProfile, windowDays: number = LOOKBACK_DAYS, from?: string): WeightTrend {
  const points = pointsInWindow(allPoints(profile), windowDays, from)
  const spanDays = points.length >= 2
    ? (toDayMs(points[points.length - 1].date) - toDayMs(points[0].date)) / 86400000
    : 0
  const weights = points.map(p => p.weight)
  const amplitude = weights.length > 0 ? Math.max(...weights) - Math.min(...weights) : 0
  const slopeKgPerWeek = linearSlopeKgPerWeek(points)

  if (points.length < MIN_ENTRIES_VERDICT || spanDays < MIN_SPAN_VERDICT_DAYS) {
    return { points, spanDays, slopeKgPerWeek, amplitude, verdict: 'insuficiente' }
  }
  if (slopeKgPerWeek !== null && slopeKgPerWeek <= DECLINE_SLOPE_KG_WEEK) {
    return { points, spanDays, slopeKgPerWeek, amplitude, verdict: 'queda' }
  }
  return { points, spanDays, slopeKgPerWeek, amplitude, verdict: 'estagnacao_provavel' }
}

export function evaluateNewUser(answers: PlateauNewUserAnswers): 'possivel_estagnacao' | 'sem_sinal' {
  const current = parseFloat(answers.currentWeight)
  const past = parseFloat(answers.weightThreeWeeksAgo)
  const hasBoth = !isNaN(current) && current > 0 && !isNaN(past) && past > 0
  const diffPct = hasBoth ? Math.abs(current - past) / current : null

  if (answers.stagnantThreeWeeks === 'sim') return 'possivel_estagnacao'
  if (answers.stagnantThreeWeeks === 'nao_tenho_certeza' && diffPct !== null && diffPct <= FLAT_BAND_PCT) {
    return 'possivel_estagnacao'
  }
  return 'sem_sinal'
}

export function evaluateReassessment(profile: UserProfile, tracking: PlateauTracking): ReassessmentVerdict {
  const today = new Date().toISOString().split('T')[0]
  const points = pointsInWindow(allPoints(profile), 9999, today).filter(
    p => toDayMs(p.date) >= toDayMs(tracking.startDate)
  )
  const weights = points.map(p => p.weight)
  const amplitude = weights.length > 0 ? Math.max(...weights) - Math.min(...weights) : 0
  const slope = linearSlopeKgPerWeek(points)

  if (slope !== null && slope <= DECLINE_SLOPE_KG_WEEK) return 'tendencia_queda'
  if (tracking.baselineWeight > 0 && amplitude / tracking.baselineWeight <= FLAT_BAND_PCT) {
    return 'estagnacao_persistente'
  }
  return 'oscilacao_inconclusiva'
}

export function getPlateauStatus(profile: UserProfile): PlateauStatus {
  return profile.plateau?.status ?? 'sem_sinal'
}

export function getPlateauStatusMeta(status: PlateauStatus): { label: string; shortLabel: string; color: string } {
  switch (status) {
    case 'tendencia_queda':
      return { label: 'Tendência de queda', shortLabel: 'Em queda', color: '#10B981' }
    case 'possivel_estagnacao':
      return { label: 'Possível estagnação identificada', shortLabel: 'Possível estagnação', color: '#F59E0B' }
    case 'em_acompanhamento_14dias':
      return { label: 'Em acompanhamento de 14 dias', shortLabel: 'Acompanhamento', color: '#F59E0B' }
    case 'estagnacao_persistente':
      return { label: 'Possível estagnação persistente', shortLabel: 'Estagnação persistente', color: '#EF4444' }
    default:
      return { label: 'Sem sinal de estagnação', shortLabel: 'Sem sinal', color: 'var(--text-muted)' }
  }
}

export function writePlateauStatus(profile: UserProfile, patch: Partial<PlateauEvaluation>): UserProfile {
  const current: PlateauEvaluation = profile.plateau ?? { status: 'sem_sinal', updatedAt: new Date().toISOString() }
  const next: PlateauEvaluation = { ...current, ...patch, updatedAt: new Date().toISOString() }
  return { ...profile, plateau: next }
}
