import type { WeightEntry } from '../types'
import { SPLITS, type SplitKey, type WorkoutDay, type WorkoutProfile } from '../data/exercisePlans'
import { parseDay, toDateStr, weekdayOf } from './dateUtils'
import { readJSON, writeJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'

export const DAY_INITIALS  = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const DAY_FULL      = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

// ── Plano ─────────────────────────────────────────────────────────────────────

// Dias da semana (0 = domingo) de cada divisão: a mesma agenda no Início, na
// tela de treino, nos avisos e nas notificações
export const WORKOUT_SCHEDULE: Record<number, number[]> = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5] }

export function getSplitDays(wp: WorkoutProfile): WorkoutDay[] {
  return SPLITS[`${wp.days}_${wp.sex}` as SplitKey] ?? []
}

// Dia da semana (0 = domingo) → treino do plano
export type WorkoutPlan = Record<number, { label: string; name: string }>

export function getWorkoutPlan(wp: WorkoutProfile | null): WorkoutPlan {
  if (!wp) return {}
  const splits = getSplitDays(wp)
  const plan: WorkoutPlan = {}
  ;(WORKOUT_SCHEDULE[wp.days] ?? []).forEach((dow, i) => {
    if (splits[i]) plan[dow] = { label: splits[i].label, name: splits[i].name }
  })
  return plan
}

// Exercícios marcados hoje, por treino (label → índices). Vale só para a data gravada.
export interface DayChecks {
  date: string
  done: Record<string, number[]>
}

// O treino só conta como feito quando todos os exercícios foram marcados
export function isWorkoutComplete(checked: number[] | undefined, total: number): boolean {
  return total > 0 && Array.from({ length: total }, (_, i) => i).every(i => checked?.includes(i))
}

// ── Histórico por dia ────────────────────────────────────────────────────────
// Complementa o workoutLog (lista de datas concluídas, usada por Dashboard,
// Evolução e lembretes): guarda qual treino foi feito e quanto dele.

export interface WorkoutDayLog {
  label: string  // 'A' … 'E'
  done: number   // exercícios marcados
  total: number  // exercícios do treino
}
export type WorkoutHistory = Record<string, WorkoutDayLog>  // AAAA-MM-DD → registro

// Resume as marcações de hoje num único registro: um treino completo tem
// prioridade; senão, o mais avançado (empate → o último tocado). null = nada marcado.
export function summarizeDay(
  workouts: { label: string; total: number }[],
  done: Record<string, number[]>,
  preferLabel?: string,
): WorkoutDayLog | null {
  const entries = workouts.map(w => ({
    label: w.label,
    total: w.total,
    done: Array.from({ length: w.total }, (_, i) => i).filter(i => done[w.label]?.includes(i)).length,
  }))
  const complete = entries.find(e => isWorkoutComplete(done[e.label], e.total))
  if (complete) return complete
  const best = entries
    .filter(e => e.done > 0)
    .sort((a, b) => b.done - a.done || Number(b.label === preferLabel) - Number(a.label === preferLabel))[0]
  return best ?? null
}

// Próximo treino do rodízio: o seguinte ao último treino concluído antes de `before`
export function nextWorkoutLabel(history: WorkoutHistory, labels: string[], before: string): string {
  if (labels.length === 0) return 'A'
  const last = Object.keys(history)
    .filter(d => d < before && history[d].total > 0 && history[d].done >= history[d].total)
    .sort()
    .at(-1)
  if (!last) return labels[0]
  const i = labels.indexOf(history[last].label)
  return labels[(i + 1) % labels.length]
}

// Treino planejado para a data pela agenda fixa (WORKOUT_SCHEDULE) — a mesma do Início e das notificações
export function plannedLabel(schedule: number[], labels: string[], date: string): string | undefined {
  const idx = schedule.indexOf(weekdayOf(date))
  return idx === -1 ? undefined : labels[idx]
}

// Treino em foco hoje: o já começado; senão o da agenda; em dia de descanso, o próximo do rodízio
export function focusWorkoutLabel(
  history: WorkoutHistory, labels: string[], schedule: number[], today: string,
): string {
  return history[today]?.label
    ?? plannedLabel(schedule, labels, today)
    ?? nextWorkoutLabel(history, labels, today)
}

export function calcStreak(log: string[]): number {
  if (log.length === 0) return 0
  let streak = 0
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  sunday.setHours(0, 0, 0, 0)

  for (let w = 0; w <= 52; w++) {
    const weekStart = new Date(sunday)
    weekStart.setDate(sunday.getDate() - w * 7)
    let done = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      if (d > now) continue
      if (log.includes(toDateStr(d))) done++
    }
    if (done > 0) streak++
    else if (w > 0) break
  }
  return streak
}

// ── Evolução ─────────────────────────────────────────────────────────────────

function weekStart(d: Date): Date {
  const s = new Date(d)
  s.setDate(d.getDate() - d.getDay())
  s.setHours(0, 0, 0, 0)
  return s
}

// Quantas semanas atrás caiu a data (0 = semana atual)
function weeksAgo(dateStr: string, now: Date): number {
  const then = weekStart(parseDay(dateStr))
  return Math.round((weekStart(now).getTime() - then.getTime()) / (7 * 864e5))
}

export interface WeekStat {
  start: Date
  workouts: number
  weight: number | null  // último peso conhecido até o fim da semana
  weighed: boolean       // houve pesagem nessa semana
}

export function getWeeklyStats(
  log: string[], weights: WeightEntry[], weeks: number, now = new Date(),
): WeekStat[] {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  return Array.from({ length: weeks }, (_, i) => {
    const ago = weeks - 1 - i
    const start = weekStart(now)
    start.setDate(start.getDate() - ago * 7)
    return {
      start,
      workouts: log.filter(d => weeksAgo(d, now) === ago).length,
      weight: sorted.filter(w => weeksAgo(w.date, now) >= ago).at(-1)?.weight ?? null,
      weighed: sorted.some(w => weeksAgo(w.date, now) === ago),
    }
  })
}

// Maior sequência de semanas consecutivas com ao menos um treino
export function calcBestStreak(log: string[], now = new Date()): number {
  const weeks = [...new Set(log.map(d => weeksAgo(d, now)))].sort((a, b) => a - b)
  let best = 0
  let run = 0
  weeks.forEach((w, i) => {
    run = i > 0 && w === weeks[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

// Dia da semana mais treinado (0=Dom … 6=Sáb)
export function getFavoriteDay(log: string[]): number | null {
  if (log.length === 0) return null
  const counts: number[] = Array(7).fill(0)
  log.forEach(d => counts[weekdayOf(d)]++)
  return counts.indexOf(Math.max(...counts))
}

export function getEvolutionInsight(totalWorkouts: number, lost: number, onTarget: number, activeWeeks: number): string {
  if (totalWorkouts === 0) return 'Marque todos os exercícios de um treino para registrar o dia e acompanhar sua constância aqui.'
  if (lost > 0 && onTarget * 2 >= activeWeeks) return `${lost.toFixed(1)}kg a menos com treino em dia. O treino de força ajuda a preservar massa magra durante o emagrecimento.`
  if (lost > 0) return 'Seu peso está caindo. Manter os treinos de força ajuda a preservar massa magra nessa fase.'
  return 'A constância nos treinos vem antes do resultado na balança. Siga marcando cada treino.'
}

export function getMotivation(done: number, target: number, streak: number): string {
  if (streak >= 12) return 'Três meses seguidos. Isso é transformação de verdade.'
  if (streak >= 8)  return `${streak} semanas sem parar. Você é extraordinária!`
  if (streak >= 4)  return `${streak} semanas de constância. O hábito já está formado.`
  if (streak >= 2)  return `${streak} semanas seguidas. Continue assim.`
  if (done === 0)   return 'A primeira marcação da semana faz toda a diferença.'
  if (done > target) return 'Além da meta. Que dedicação essa semana.'
  if (done >= target) return 'Meta da semana batida. Você arrasou.'
  if (done === 1)   return 'Primeiro treino da semana. Ótimo começo.'
  if (done === 2)   return 'Dois treinos marcados. Você está no ritmo!'
  if (done === target - 1) return 'Falta só um treino para bater a meta da semana.'
  return `${done} treinos essa semana. Siga em frente.`
}

// ── Leitura e gravação ───────────────────────────────────────────────────────
// Plano e dias concluídos são lidos pelo Início, pelos avisos e pelas
// notificações: o tipo de cada chave fica definido só aqui.

export function readWorkoutProfile(): WorkoutProfile | null {
  return readJSON<WorkoutProfile | null>(STORAGE_KEYS.workoutProfile, null)
}

export function saveWorkoutProfile(wp: WorkoutProfile) {
  writeJSON(STORAGE_KEYS.workoutProfile, wp)
}

// Datas (YYYY-MM-DD) com um treino completo
export function readWorkoutLog(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.workoutLog, [])
}

export function saveWorkoutLog(log: string[]) {
  writeJSON(STORAGE_KEYS.workoutLog, log)
}

export function readWorkoutPlan(): WorkoutPlan {
  return getWorkoutPlan(readWorkoutProfile())
}
