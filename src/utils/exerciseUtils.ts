import type { WeightEntry } from '../types'
import { toDateStr } from './dateUtils'

export const DAY_INITIALS  =['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const DAY_FULL      = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export { toDateStr }

// Exercícios marcados hoje, por treino (label → índices). Vale só para a data gravada.
export interface DayChecks {
  date: string
  done: Record<string, number[]>
}

// O treino só conta como feito quando todos os exercícios foram marcados
export function isWorkoutComplete(checked: number[] | undefined, total: number): boolean {
  return total > 0 && Array.from({ length: total }, (_, i) => i).every(i => checked?.includes(i))
}

export function getWeekDays(): Date[] {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
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
  const then = weekStart(new Date(dateStr + 'T12:00:00'))
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
  log.forEach(d => counts[new Date(d + 'T12:00:00').getDay()]++)
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
