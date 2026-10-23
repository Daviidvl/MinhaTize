import { UserProfile } from '../types'
import { type WaterLog } from './foodUtils'
import { toDateStr, addDays } from './dateUtils'
import { readJSON, writeJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'

// O que as notificações aprendem com o uso do app, sem nenhuma configuração:
// em que horário a pessoa costuma abrir o app de manhã, à tarde e à noite (as
// três janelas de envio), em que dia da semana ela costuma se pesar e se ela
// usa o registro de água. Tudo fica no aparelho.

export interface UsageProfile {
  morningMin: number     // minuto do dia da janela da manhã
  afternoonMin: number   // minuto do dia da janela da tarde
  eveningMin: number     // minuto do dia da janela da noite
  weighInWeekday: number // 0 = domingo
  usesWater: boolean
}

export const DEFAULT_USAGE: UsageProfile = {
  morningMin: 9 * 60,
  afternoonMin: 14 * 60 + 30,
  eveningMin: 20 * 60,
  weighInWeekday: 1,
  usesWater: true,
}

// Uma abertura do app: data e minuto do dia
export interface AppOpen { d: string; m: number }

// Limites das janelas: nada antes das 7h30 nem depois das 21h30, e uma janela
// não invade a outra
export const MORNING_RANGE: [number, number]   = [7 * 60 + 30, 11 * 60]
export const AFTERNOON_RANGE: [number, number] = [12 * 60 + 30, 16 * 60 + 30]
export const EVENING_RANGE: [number, number]   = [18 * 60, 21 * 60 + 30]
// Aberturas consideradas para cada janela
const MORNING_OPENS: [number, number]   = [5 * 60, 12 * 60]
const AFTERNOON_OPENS: [number, number] = [12 * 60, 17 * 60]
const EVENING_OPENS: [number, number]   = [17 * 60, 23 * 60]

const KEEP_DAYS = 30
const MAX_OPENS = 240
// Aberturas com menos de 1h de diferença contam como uma só
const DEDUPE_MIN = 60
// Mínimo de aberturas numa janela para trocar o horário padrão
const MIN_SAMPLES = 3
// Aberturas recentes do app contam como "período de adaptação": a água entra mesmo sem registro
const NEW_USER_DAYS = 7
const WATER_LOOKBACK_DAYS = 14

const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v))
const round15 = (m: number) => Math.round(m / 15) * 15

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function windowMin(opens: AppOpen[], [from, to]: [number, number], range: [number, number], fallback: number): number {
  const mins = opens.map(o => o.m).filter(m => m >= from && m < to)
  return mins.length >= MIN_SAMPLES ? clamp(round15(median(mins)), range) : fallback
}

// Dia da semana mais frequente nas últimas pesagens (precisa repetir ao menos duas vezes)
function usualWeighInDay(profile: UserProfile): number {
  const last = [...profile.weightHistory].sort((a, b) => a.date.localeCompare(b.date)).slice(-8)
  if (last.length < 3) return DEFAULT_USAGE.weighInWeekday
  const count = new Array(7).fill(0) as number[]
  for (const e of last) count[new Date(e.date + 'T12:00:00').getDay()]++
  const best = count.indexOf(Math.max(...count))
  return count[best] >= 2 ? best : DEFAULT_USAGE.weighInWeekday
}

// `today` fica de fora de propósito: os horários só mudam de um dia para o
// outro, então um aviso já entregue hoje não volta para a agenda num horário novo.
export function learnUsage(opens: AppOpen[], profile: UserProfile, waterLog: WaterLog, today: string): UsageProfile {
  const recent = opens.filter(o => o.d < today && o.d >= addDays(today, -KEEP_DAYS))
  const firstOpen = opens.reduce((a, o) => (a === '' || o.d < a ? o.d : a), '')
  const waterCutoff = addDays(today, -WATER_LOOKBACK_DAYS)
  const loggedWater = Object.entries(waterLog).some(([d, v]) => d >= waterCutoff && d <= today && v.length > 0)

  return {
    morningMin:   windowMin(recent, MORNING_OPENS, MORNING_RANGE, DEFAULT_USAGE.morningMin),
    afternoonMin: windowMin(recent, AFTERNOON_OPENS, AFTERNOON_RANGE, DEFAULT_USAGE.afternoonMin),
    eveningMin:   windowMin(recent, EVENING_OPENS, EVENING_RANGE, DEFAULT_USAGE.eveningMin),
    weighInWeekday: usualWeighInDay(profile),
    usesWater: loggedWater || firstOpen === '' || firstOpen >= addDays(today, -NEW_USER_DAYS),
  }
}

// ── Leitura e gravação ───────────────────────────────────────────────────────

export function loadOpens(): AppOpen[] {
  const stored = readJSON<{ opens?: AppOpen[] } | null>(STORAGE_KEYS.usage, null)
  return Array.isArray(stored?.opens) ? stored.opens : []
}

export function recordAppOpen(now = new Date()) {
  const d = toDateStr(now)
  const m = now.getHours() * 60 + now.getMinutes()
  const opens = loadOpens()
  if (opens.some(o => o.d === d && Math.abs(o.m - m) < DEDUPE_MIN)) return
  const cutoff = addDays(d, -KEEP_DAYS)
  writeJSON(STORAGE_KEYS.usage, { opens: [...opens.filter(o => o.d >= cutoff), { d, m }].slice(-MAX_OPENS) })
}
