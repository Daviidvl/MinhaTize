import { UserProfile } from '../types'

export function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

export function getLog(profile: UserProfile): string[] {
  if (profile.applicationLog) return profile.applicationLog
  if (!profile.lastApplication || profile.applicationDay === undefined) return []
  const last = new Date(profile.lastApplication + 'T12:00:00')
  const log: string[] = []
  for (let w = 0; w < 52; w++) {
    const d = new Date(last)
    d.setDate(last.getDate() - w * 7)
    if (d.getDay() !== profile.applicationDay) break
    log.push(toDateStr(d))
    if (w > 0 && d < new Date(profile.startDate + 'T12:00:00')) break
  }
  return log
}

export function fmtDateShort(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

export function getGlobalNextApp(appDayNum: number, todayStr: string): string {
  const today = new Date(todayStr + 'T12:00:00')
  const daysUntil = (appDayNum - today.getDay() + 7) % 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return toDateStr(next)
}

export function calcStreak(confirmed: Set<string>, appDay: number, todayStr: string): number {
  let streak = 0
  const today = new Date(todayStr + 'T12:00:00')
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
  const today = new Date(todayStr + 'T12:00:00')
  const offset = (today.getDay() - appDay + 7) % 7
  let scheduled = 0, done = 0
  for (let w = 0; w < weeks; w++) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset - w * 7)
    const s = toDateStr(d)
    if (s > todayStr) continue
    if (s < new Date(new Date(todayStr).setDate(new Date(todayStr).getDate() - weeks * 7 + 1)).toISOString().split('T')[0]) continue
    scheduled++
    if (confirmed.has(s)) done++
  }
  return scheduled > 0 ? Math.round((done / scheduled) * 100) : 0
}

export const SITES = ['Abdômen', 'Coxa E', 'Coxa D', 'Braço']
