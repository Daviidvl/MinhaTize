import { Tab, UserProfile, WEEK_DAYS_FULL } from '../types'
import { getLog } from './applicationCalendarUtils'
import { type WaterLog, waterGoalMl, waterTotal } from './foodUtils'
import { SPLIT_INFO, WORKOUT_SCHEDULE } from './dashboardUtils'
import { toDateStr, addDays } from './dateUtils'
import { readJSON, writeJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'
import { type UsageProfile, learnUsage, loadOpens } from './usageUtils'

// Notificações calculadas no próprio aparelho. A política é fixa: só aplicação,
// treino, água e pesagem, e no máximo MAX_PER_DAY por dia — uma na janela da
// manhã e outra na do fim do dia. O que muda de pessoa para pessoa vem do uso
// do app (utils/usageUtils.ts): o horário das janelas, o dia da pesagem e se a
// água entra. A pessoa só liga ou desliga.
//
// As mesmas regras alimentam o contador no ícone do app (getDueReminders) e a
// agenda enviada ao servidor de push (buildPushSchedule).

export type ReminderKind = 'application' | 'water' | 'weighIn' | 'workout'
export type ReminderSlot = 'morning' | 'evening'

export interface ReminderSettings {
  notifications: boolean // notificações no celular (push) — ligadas por padrão
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { notifications: true }

export const MAX_PER_DAY = 2

export interface Reminder {
  id: string        // estável por ocorrência — evita avisar duas vezes a mesma coisa
  kind: ReminderKind
  title: string
  body: string
  at: number        // minuto do dia em que vira notificação
  tab: Tab
  section?: string
}

// Candidato a uma das janelas do dia; o de maior prioridade escolhe primeiro
interface Candidate extends Omit<Reminder, 'at'> {
  priority: number
  slots: ReminderSlot[] // janelas aceitas, em ordem de preferência
}

// Dia da semana (0 = domingo) → treino do plano
export type WorkoutPlan = Record<number, { label: string; name: string }>

export interface ReminderContext {
  today: string     // YYYY-MM-DD
  nowMin: number    // minutos desde a meia-noite
  profile: UserProfile
  waterMl: number
  waterGoalMl: number
  workoutPlan: WorkoutPlan
  workoutDoneToday: boolean
  usage: UsageProfile
}

// Aplicação atrasada só é cobrada nos 3 dias seguintes à data programada
const LATE_APPLICATION_DAYS = 3
// Quem se pesou nos últimos dias não recebe o aviso de pesagem
const RECENT_WEIGH_DAYS = 3

function weekdayOf(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay()
}

// `today` traz o que só se sabe sobre hoje; para dias futuros, tudo false.
function dayCandidates(
  profile: UserProfile, day: string, plan: WorkoutPlan, usage: UsageProfile,
  today: { workoutDone: boolean; waterGoalMet: boolean },
): Candidate[] {
  const dow = weekdayOf(day)
  const out: Candidate[] = []
  const log = getLog(profile)

  // ── Aplicação ──
  // Sem a dose no texto: ele vai para o servidor de push e aparece na tela bloqueada
  const appDay = profile.applicationDay
  if (appDay !== undefined) {
    const offset        = (dow - appDay + 7) % 7 // dias desde a última data programada
    const lastScheduled = addDays(day, -offset)
    // Aplicação feita com atraso de alguns dias também conta para a semana
    const doneSince = log.some(d => d >= lastScheduled && d <= day)

    if (offset === 0 && !doneSince) {
      out.push({
        id: `application-${day}`, kind: 'application', priority: 100, slots: ['morning', 'evening'], tab: 'dashboard',
        title: 'Hoje é dia de aplicação',
        body: 'Sua aplicação está programada para hoje. Depois de aplicar, registre no calendário.',
      })
    } else if (
      offset > 0 && offset <= LATE_APPLICATION_DAYS && log.length > 0
      && lastScheduled >= profile.startDate && !doneSince
    ) {
      out.push({
        id: `application-late-${lastScheduled}`, kind: 'application', priority: 95, slots: ['morning', 'evening'], tab: 'dashboard',
        title: 'Aplicação não registrada',
        body: `A aplicação de ${WEEK_DAYS_FULL[appDay].toLowerCase()} ainda não foi registrada. Se já aplicou, marque no calendário.`,
      })
    } else if (offset === 6) {
      out.push({
        id: `application-eve-${day}`, kind: 'application', priority: 90, slots: ['evening'], tab: 'dashboard',
        title: 'Amanhã é dia de aplicar',
        body: 'Confira se o medicamento está na geladeira e se há agulha e álcool para amanhã.',
      })
    }
  }

  // ── Pesagem: no dia em que a pessoa costuma se pesar, de manhã (em jejum) ──
  const weighedRecently = profile.weightHistory.some(e => e.date <= day && e.date > addDays(day, -RECENT_WEIGH_DAYS))
  if (dow === usage.weighInWeekday && !weighedRecently) {
    out.push({
      id: `weighIn-${day}`, kind: 'weighIn', priority: 60, slots: ['morning'], tab: 'progress',
      title: 'Dia de se pesar',
      body: 'Pese-se em jejum, depois de ir ao banheiro, e registre o peso no Progresso.',
    })
  }

  // ── Treino ──
  const workout = plan[dow]
  if (workout && !today.workoutDone) {
    out.push({
      id: `workout-${day}`, kind: 'workout', priority: 50, slots: ['evening', 'morning'],
      tab: 'health', section: 'exercise',
      title: 'Treino de hoje',
      body: `Treino ${workout.label}: ${workout.name}. Marque os exercícios conforme for fazendo.`,
    })
  }

  // ── Água: só para quem usa o registro ──
  if (usage.usesWater && !today.waterGoalMet) {
    out.push({
      id: `water-${day}`, kind: 'water', priority: 30, slots: ['evening', 'morning'],
      tab: 'health', section: 'food:hydration',
      title: 'Como está a água hoje?',
      body: 'Beba um copo agora e registre no MinhaTize para acompanhar a meta do dia.',
    })
  }

  return out
}

// Distribui os candidatos nas janelas do dia, do mais importante para o menos
function fillSlots(candidates: Candidate[], usage: UsageProfile): Reminder[] {
  const at: Record<ReminderSlot, number> = { morning: usage.morningMin, evening: usage.eveningMin }
  const free = new Set<ReminderSlot>(['morning', 'evening'])
  const out: Reminder[] = []
  for (const c of [...candidates].sort((a, b) => b.priority - a.priority)) {
    if (out.length >= MAX_PER_DAY) break
    const slot = c.slots.find(s => free.has(s))
    if (!slot) continue
    free.delete(slot)
    out.push({ id: c.id, kind: c.kind, title: c.title, body: c.body, tab: c.tab, section: c.section, at: at[slot] })
  }
  return out.sort((a, b) => a.at - b.at)
}

// ── Contador no ícone do app ─────────────────────────────────────────────────

// Avisos de hoje cuja hora já chegou e que continuam valendo
export function getDueReminders(ctx: ReminderContext): Reminder[] {
  const candidates = dayCandidates(ctx.profile, ctx.today, ctx.workoutPlan, ctx.usage, {
    workoutDone: ctx.workoutDoneToday,
    waterGoalMet: ctx.waterGoalMl > 0 && ctx.waterMl >= ctx.waterGoalMl,
  })
  return fillSlots(candidates, ctx.usage).filter(r => r.at <= ctx.nowMin)
}

// ── Agenda de notificações push ──────────────────────────────────────────────

export interface PushScheduleItem {
  id: string
  at: string    // ISO 8601 (UTC)
  title: string
  body: string
  url: string
}

export interface PushScheduleInput {
  now: Date
  profile: UserProfile
  workoutPlan: WorkoutPlan
  workoutDoneToday: boolean
  waterGoalMetToday: boolean
  usage: UsageProfile
  dismissed: Record<string, string>
}

// Dias à frente enviados ao servidor. O app reenvia a agenda ao abrir e a cada
// registro, então a janela só precisa cobrir quem fica alguns dias sem abrir.
export const PUSH_HORIZON_DAYS = 7

function localDate(day: string, min: number): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d, Math.floor(min / 60), min % 60)
}

// Tudo o que deve virar notificação nos próximos dias, supondo que nada novo
// seja registrado. Quando algo é registrado o app recalcula e o aviso some.
export function buildPushSchedule(inp: PushScheduleInput, horizonDays = PUSH_HORIZON_DAYS): PushScheduleItem[] {
  const today = toDateStr(inp.now)
  // Avisos que se repetem em vários dias com o mesmo id (atraso da aplicação)
  // só valem na primeira vez que ganham uma janela — mesmo que ela já tenha
  // passado — e deixam a vaga dos dias seguintes para outro aviso.
  const used = new Set<string>()
  const out: PushScheduleItem[] = []

  for (let i = 0; i < horizonDays; i++) {
    const day = addDays(today, i)
    const candidates = dayCandidates(inp.profile, day, inp.workoutPlan, inp.usage, {
      workoutDone: i === 0 && inp.workoutDoneToday,
      waterGoalMet: i === 0 && inp.waterGoalMetToday,
    }).filter(c => !used.has(c.id) && !inp.dismissed[c.id])

    for (const r of fillSlots(candidates, inp.usage)) {
      used.add(r.id)
      const at = localDate(day, r.at)
      if (at <= inp.now) continue
      out.push({ id: r.id, at: at.toISOString(), title: r.title, body: r.body, url: reminderUrl(r) })
    }
  }
  return out
}

// id do lembrete → data em que foi dispensado
export interface ReminderState {
  dismissed: Record<string, string>
}

const STATE_KEEP_DAYS = 14

export function pruneReminderState(state: ReminderState, today: string): ReminderState {
  const cutoff = addDays(today, -STATE_KEEP_DAYS)
  return { dismissed: Object.fromEntries(Object.entries(state.dismissed).filter(([, d]) => d >= cutoff)) }
}

// Endereço aberto ao tocar na notificação — App.tsx lê tab/section da URL
export function reminderUrl(r: Reminder): string {
  return `/?tab=${r.tab}${r.section ? `&section=${encodeURIComponent(r.section)}` : ''}`
}

// ── Leitura dos dados locais ─────────────────────────────────────────────────

export function readWorkoutPlan(): WorkoutPlan {
  const wp = readJSON<{ sex: string; days: number } | null>(STORAGE_KEYS.workoutProfile, null)
  const splits = wp ? SPLIT_INFO[`${wp.days}_${wp.sex}`] : undefined
  if (!wp || !splits) return {}
  const plan: WorkoutPlan = {}
  ;(WORKOUT_SCHEDULE[wp.days] ?? []).forEach((dow, i) => {
    if (splits[i]) plan[dow] = { label: splits[i].label, name: splits[i].name }
  })
  return plan
}

export function readReminderContext(profile: UserProfile, now = new Date()): ReminderContext {
  const today  = toDateStr(now)
  const weight = profile.weightHistory.at(-1)?.weight ?? profile.currentWeight ?? profile.startWeight
  const water  = readJSON<WaterLog>(STORAGE_KEYS.waterLog, {})
  return {
    today,
    nowMin: now.getHours() * 60 + now.getMinutes(),
    profile,
    waterMl: waterTotal(water[today]),
    waterGoalMl: waterGoalMl(weight),
    workoutPlan: readWorkoutPlan(),
    workoutDoneToday: readJSON<string[]>(STORAGE_KEYS.workoutLog, []).includes(today),
    usage: learnUsage(loadOpens(), profile, water, today),
  }
}

// Versões antigas guardavam horários e tipos por lembrete; só o liga/desliga continua valendo
export function loadReminderSettings(): ReminderSettings {
  const stored = readJSON<Partial<ReminderSettings> | null>(STORAGE_KEYS.reminders, null)
  return { notifications: stored?.notifications ?? DEFAULT_REMINDER_SETTINGS.notifications }
}

// Avisa o hook useReminders para recalcular na hora (configuração ou registro mudou)
export const REMINDERS_CHANGED_EVENT = 'minhatize:reminders-changed'

export function notifyRemindersChanged() {
  window.dispatchEvent(new Event(REMINDERS_CHANGED_EVENT))
}

export function saveReminderSettings(s: ReminderSettings) {
  writeJSON(STORAGE_KEYS.reminders, { notifications: s.notifications } satisfies ReminderSettings)
  notifyRemindersChanged()
}

export function loadReminderState(): ReminderState {
  const stored = readJSON<Partial<ReminderState> | null>(STORAGE_KEYS.remindersState, null)
  return { dismissed: stored?.dismissed ?? {} }
}

export function saveReminderState(state: ReminderState) {
  writeJSON(STORAGE_KEYS.remindersState, state)
}
