import { UserProfile } from '../types'
import { addDays, parseDay, toDateStr, weekdayOf } from './dateUtils'

// Datas (YYYY-MM-DD) em que houve aplicação. Perfis anteriores ao
// applicationLog só guardavam a última aplicação (lastApplication): o histórico
// é reconstruído semana a semana para trás a partir dela.
export function getLog(profile: UserProfile): string[] {
  if (profile.applicationLog) return profile.applicationLog
  if (!profile.lastApplication || profile.applicationDay === undefined) return []
  const last = parseDay(profile.lastApplication)
  const log: string[] = []
  for (let w = 0; w < 52; w++) {
    const d = new Date(last)
    d.setDate(last.getDate() - w * 7)
    if (d.getDay() !== profile.applicationDay) break
    log.push(toDateStr(d))
    if (w > 0 && d < parseDay(profile.startDate)) break
  }
  return log
}

// Aplicação mais recente registrada, ou null
export function lastApplicationDate(profile: UserProfile): string | null {
  return getLog(profile).reduce<string | null>((a, d) => (a === null || d > a ? d : a), null)
}

// ── Semana da aplicação ───────────────────────────────────────────────────────
// Mesma leitura para os avisos do Início (insightUtils) e as notificações
// (reminderUtils): em que ponto da semana de aplicação `day` está.

// Aplicação atrasada só é cobrada nos 3 dias seguintes à data programada
const LATE_APPLICATION_DAYS = 3

export interface ApplicationWeek {
  offset: number         // dias desde a última data programada (0 = hoje é o dia)
  lastScheduled: string  // última data programada até `day`
  doneSince: boolean     // houve aplicação desde então (com atraso também conta)
}

export function applicationWeek(appDay: number, day: string, log: string[]): ApplicationWeek {
  const offset        = (weekdayOf(day) - appDay + 7) % 7
  const lastScheduled = addDays(day, -offset)
  return { offset, lastScheduled, doneSince: log.some(d => d >= lastScheduled && d <= day) }
}

// Passou do dia programado (até LATE_APPLICATION_DAYS) sem registro. Só conta
// para quem já registra aplicações e para datas a partir do início do protocolo.
export function isApplicationLate(week: ApplicationWeek, log: string[], startDate: string): boolean {
  return week.offset > 0 && week.offset <= LATE_APPLICATION_DAYS && log.length > 0
    && week.lastScheduled >= startDate && !week.doneSince
}

// ── Calendário ────────────────────────────────────────────────────────────────

export function fmtDateShort(dateStr: string) {
  return parseDay(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

export function getGlobalNextApp(appDayNum: number, todayStr: string): string {
  const today = parseDay(todayStr)
  const daysUntil = (appDayNum - today.getDay() + 7) % 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return toDateStr(next)
}

export function calcStreak(confirmed: Set<string>, appDay: number, todayStr: string): number {
  let streak = 0
  const today = parseDay(todayStr)
  const offset = (today.getDay() - appDay + 7) % 7
  for (let w = 0; w < 52; w++) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset - w * 7)
    const s = toDateStr(d)
    if (s > todayStr) continue
    if (confirmed.has(s)) streak++
    else break
  }
  return streak
}

export function calcAdherence(confirmed: Set<string>, appDay: number, todayStr: string, weeks = 12): number {
  const today = parseDay(todayStr)
  const offset = (today.getDay() - appDay + 7) % 7
  let scheduled = 0, done = 0
  // Primeiro dia da janela de `weeks` semanas que termina hoje
  const windowStart = new Date(today)
  windowStart.setDate(today.getDate() - weeks * 7 + 1)
  const windowStartStr = toDateStr(windowStart)
  for (let w = 0; w < weeks; w++) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset - w * 7)
    const s = toDateStr(d)
    if (s > todayStr) continue
    if (s < windowStartStr) continue
    scheduled++
    if (confirmed.has(s)) done++
  }
  return scheduled > 0 ? Math.round((done / scheduled) * 100) : 0
}

export const SITES = ['Abdômen', 'Coxa E', 'Coxa D', 'Braço']
