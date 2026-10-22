import { UserProfile } from '../types'
import { getGlobalNextApp } from './applicationCalendarUtils'
import { getAppsLeft, getDoseValue } from './medicationUtils'
import { type ReminderSettings, EVE_REMINDER_MIN, addDays, timeToMin } from './reminderUtils'
import { toDateStr } from './dateUtils'

// Arquivo de agenda (.ics, RFC 5545) com os lembretes de data fixa. A agenda do
// celular avisa mesmo com o app fechado, sem servidor e sem enviar dados para
// fora do aparelho. Água, treino e pós-dose dependem do que foi registrado no
// dia e ficam só no app.

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const DISCREET_TITLE = 'Lembrete MinhaTize'

interface CalEvent {
  uid: string
  title: string
  description: string
  date: string          // YYYY-MM-DD
  time?: string         // HH:MM — ausente = dia inteiro
  weekly?: boolean
  alarmsMin: number[]   // minutos depois do início (negativo = antes)
}

function escapeText(t: string): string {
  return t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// Linhas com mais de 75 bytes são dobradas; a continuação começa com espaço
function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let cur = '', bytes = 0
  for (const ch of line) {
    const b = enc.encode(ch).length
    if (bytes + b > (parts.length ? 74 : 75)) { parts.push(cur); cur = ''; bytes = 0 }
    cur += ch; bytes += b
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

const compactDate = (d: string) => d.replace(/-/g, '')

function utcStamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function trigger(min: number): string {
  if (min === 0) return 'PT0M'
  return `${min < 0 ? '-' : ''}PT${Math.abs(min)}M`
}

function eventLines(e: CalEvent, stamp: string): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp}`]
  if (e.time) {
    // Hora "flutuante" (sem fuso): a agenda usa o fuso do próprio aparelho
    lines.push(`DTSTART:${compactDate(e.date)}T${e.time.replace(':', '')}00`, 'DURATION:PT15M')
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compactDate(e.date)}`, `DTEND;VALUE=DATE:${compactDate(addDays(e.date, 1))}`)
  }
  if (e.weekly) lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[new Date(e.date + 'T12:00:00').getDay()]}`)
  lines.push(`SUMMARY:${escapeText(e.title)}`, `DESCRIPTION:${escapeText(e.description)}`)
  for (const m of e.alarmsMin) {
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(e.title)}`, `TRIGGER:${trigger(m)}`, 'END:VALARM')
  }
  lines.push('END:VEVENT')
  return lines
}

export function buildReminderCalendar(profile: UserProfile, s: ReminderSettings, now = new Date()): string | null {
  const today    = toDateStr(now)
  const discreet = s.discreet
  const events: CalEvent[] = []
  const appDay   = profile.applicationDay

  if (s.application.enabled && appDay !== undefined) {
    const dose    = getDoseValue(profile)
    const startMin = timeToMin(s.application.time)
    const alarms  = [0]
    // Véspera às 20h, contado a partir do horário da aplicação
    if (s.application.eveBefore) alarms.push(-(startMin + 24 * 60 - EVE_REMINDER_MIN))
    events.push({
      uid: 'aplicacao@minhatize.app',
      title: discreet ? DISCREET_TITLE : `Aplicação${dose != null ? ` de ${dose.toLocaleString('pt-BR')} mg` : ''}`,
      description: 'Depois de aplicar, registre no calendário do MinhaTize.',
      date: getGlobalNextApp(appDay, today), time: s.application.time, weekly: true, alarmsMin: alarms,
    })
  }

  if (s.weighIn.enabled) {
    events.push({
      uid: 'pesagem@minhatize.app',
      title: discreet ? DISCREET_TITLE : 'Pesagem semanal',
      description: 'Pese-se em jejum, depois de ir ao banheiro, e registre o peso no MinhaTize.',
      date: getGlobalNextApp(s.weighIn.weekday, today), time: s.weighIn.time, weekly: true, alarmsMin: [0],
    })
  }

  // Data em que o estoque chega a 4 aplicações (cada aplicação semanal consome uma)
  const appsLeft = getAppsLeft(profile)
  if (s.stock.enabled && appDay !== undefined && appsLeft != null && appsLeft > 4) {
    events.push({
      uid: 'estoque@minhatize.app',
      title: discreet ? DISCREET_TITLE : 'Hora de repor o estoque',
      description: 'A partir de hoje restam 4 aplicações no estoque registrado no MinhaTize. O pedido pode levar alguns dias.',
      date: addDays(getGlobalNextApp(appDay, today), (appsLeft - 5) * 7), alarmsMin: [10 * 60],
    })
  }

  if (events.length === 0) return null

  const stamp = utcStamp(now)
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MinhaTize//Lembretes//PT-BR',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:MinhaTize',
    ...events.flatMap(e => eventLines(e, stamp)),
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadCalendar(ics: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'minhatize-lembretes.ics'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
