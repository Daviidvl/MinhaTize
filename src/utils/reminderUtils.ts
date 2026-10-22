import { Tab, UserProfile, WEEK_DAYS_FULL } from '../types'
import { getLog } from './applicationCalendarUtils'
import { getAppsLeft } from './medicationUtils'
import { type WaterLog, waterGoalMl, waterTotal, formatMl } from './foodUtils'
import { SPLIT_INFO, WORKOUT_SCHEDULE } from './dashboardUtils'
import { getMondayOf } from '../data/healthHubContent'
import { toDateStr } from './dateUtils'
import { readJSON, writeJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'

// Lembretes calculados no próprio aparelho a partir dos dados locais. As mesmas
// regras alimentam o card do Início (getDueReminders), a agenda de notificações
// enviada ao servidor de push (buildPushSchedule) e o arquivo de agenda
// (utils/calendarExport.ts).

export type ReminderKind = 'application' | 'stock' | 'postDose' | 'water' | 'weighIn' | 'workout'

export interface ReminderSettings {
  notifications: boolean // notificações no celular (push) — ligadas por padrão
  discreet: boolean      // texto neutro na notificação (tela bloqueada)
  quietFrom: string      // "HH:MM" — início do horário de silêncio
  quietTo: string
  application: { enabled: boolean; time: string; eveBefore: boolean }
  stock:       { enabled: boolean }
  postDose:    { enabled: boolean }
  water:       { enabled: boolean; from: string; to: string; everyHours: number }
  weighIn:     { enabled: boolean; weekday: number; time: string }
  workout:     { enabled: boolean; time: string }
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  notifications: true,
  discreet: false,
  quietFrom: '22:00',
  quietTo: '07:00',
  application: { enabled: true, time: '09:00', eveBefore: true },
  stock:       { enabled: true },
  postDose:    { enabled: true },
  water:       { enabled: true, from: '08:00', to: '20:00', everyHours: 3 },
  weighIn:     { enabled: true, weekday: 1, time: '08:00' },
  workout:     { enabled: true, time: '18:00' },
}

export interface Reminder {
  id: string        // estável por ocorrência — evita avisar duas vezes a mesma coisa
  kind: ReminderKind
  title: string
  body: string
  at: number        // minuto do dia em que vira notificação
  tab: Tab
  section?: string
  tone: 'info' | 'warn'
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
}

// Aviso da véspera da aplicação
export const EVE_REMINDER_MIN = 20 * 60
const STOCK_REMINDER_MIN     = 10 * 60
const POST_DOSE_REMINDER_MIN = 12 * 60
// Folga antes de lembrar da água no card: atraso menor que um copo não gera aviso
const WATER_SLACK_ML = 250
// Aplicação atrasada só é cobrada nos 3 dias seguintes à data programada
const LATE_APPLICATION_DAYS = 3

export function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(a + 'T12:00:00').getTime() - new Date(b + 'T12:00:00').getTime()) / 864e5)
}

function weekdayOf(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay()
}

const weekKeyOf = (day: string) => getMondayOf(new Date(day + 'T12:00:00'))

// Lembretes de um dia que dependem só do calendário e do que já foi registrado
// (tudo menos a água, que no card compara o bebido com o esperado para a hora).
// `workoutDone` só faz sentido para hoje; para dias futuros é false.
function dayReminders(s: ReminderSettings, profile: UserProfile, day: string, plan: WorkoutPlan, workoutDone: boolean): Reminder[] {
  const dow = weekdayOf(day)
  const out: Reminder[] = []
  const log = getLog(profile)

  // ── Aplicação ──
  const appDay = profile.applicationDay
  if (s.application.enabled && appDay !== undefined) {
    const at      = timeToMin(s.application.time)
    const offset  = (dow - appDay + 7) % 7 // dias desde a última data programada
    const lastScheduled = addDays(day, -offset)
    // Aplicação feita com atraso de alguns dias também conta para a semana
    const doneSince = log.some(d => d >= lastScheduled && d <= day)

    if (offset === 0 && !doneSince) {
      out.push({
        id: `application-${day}`, kind: 'application', tone: 'info', at, tab: 'dashboard',
        title: 'Hoje é dia de aplicação',
        // Sem a dose no texto: ele também vai para o servidor de push
        body: 'Sua aplicação está programada para hoje. Depois de aplicar, registre no calendário.',
      })
    } else if (
      offset > 0 && offset <= LATE_APPLICATION_DAYS && log.length > 0
      && lastScheduled >= profile.startDate && !doneSince
    ) {
      out.push({
        id: `application-late-${lastScheduled}`, kind: 'application', tone: 'warn', at, tab: 'dashboard',
        title: 'Aplicação não registrada',
        body: `A aplicação de ${WEEK_DAYS_FULL[appDay].toLowerCase()} ainda não foi registrada. Se já aplicou, marque no calendário.`,
      })
    }

    if (s.application.eveBefore && offset === 6) {
      out.push({
        id: `application-eve-${day}`, kind: 'application', tone: 'info', at: EVE_REMINDER_MIN, tab: 'dashboard',
        title: 'Amanhã é dia de aplicar',
        body: 'Confira se o medicamento está na geladeira e se há agulha e álcool para amanhã.',
      })
    }
  }

  // ── Estoque ──
  const appsLeft = getAppsLeft(profile)
  if (s.stock.enabled && appsLeft != null && appsLeft < 4) {
    out.push({
      // Um aviso por semana enquanto o estoque estiver baixo
      id: `stock-${weekKeyOf(day)}`, kind: 'stock', tone: 'warn',
      at: STOCK_REMINDER_MIN, tab: 'profile', section: 'stock',
      title: appsLeft === 0 ? 'Estoque esgotado' : 'Estoque baixo',
      body: appsLeft === 0
        ? 'O estoque registrado acabou. Atualize o estoque ou providencie a reposição.'
        : `Restam ${appsLeft} ${appsLeft === 1 ? 'aplicação' : 'aplicações'}. Providencie a reposição: o pedido pode levar alguns dias.`,
    })
  }

  // ── Pós-dose: 1 a 2 dias depois da aplicação, se a semana ainda não tem registro de sintomas ──
  const lastApp = log.at(-1)
  if (s.postDose.enabled && lastApp) {
    const since       = diffDays(day, lastApp)
    const hasSymptoms = (profile.sideEffects ?? []).some(e => e.date === weekKeyOf(day))
    if (since >= 1 && since <= 2 && !hasSymptoms) {
      out.push({
        id: `postDose-${lastApp}`, kind: 'postDose', tone: 'info',
        at: POST_DOSE_REMINDER_MIN, tab: 'health', section: 'symptoms',
        title: 'Como você está desde a aplicação?',
        body: 'Registre se sentiu algum efeito. Isso ajuda a acompanhar sua adaptação à dose.',
      })
    }
  }

  // ── Treino ──
  const workout = plan[dow]
  if (s.workout.enabled && workout && !workoutDone) {
    out.push({
      id: `workout-${day}`, kind: 'workout', tone: 'info',
      at: timeToMin(s.workout.time), tab: 'health', section: 'exercise',
      title: 'Treino de hoje',
      body: `Treino ${workout.label}: ${workout.name}. Marque os exercícios conforme for fazendo.`,
    })
  }

  // ── Pesagem semanal ──
  if (s.weighIn.enabled && dow === s.weighIn.weekday && !profile.weightHistory.some(e => e.date === day)) {
    out.push({
      id: `weighIn-${day}`, kind: 'weighIn', tone: 'info',
      at: timeToMin(s.weighIn.time), tab: 'progress',
      title: 'Dia de se pesar',
      body: 'Pese-se em jejum, depois de ir ao banheiro, e registre o peso no Progresso.',
    })
  }

  return out
}

function waterSlots(s: ReminderSettings): { from: number; to: number; every: number } | null {
  const w = s.water
  const from = timeToMin(w.from), to = timeToMin(w.to), every = Math.max(1, w.everyHours) * 60
  return w.enabled && to > from ? { from, to, every } : null
}

// ── Card "Lembretes de hoje" ─────────────────────────────────────────────────

export function getDueReminders(s: ReminderSettings, ctx: ReminderContext): Reminder[] {
  const { today, nowMin } = ctx
  const out = dayReminders(s, ctx.profile, today, ctx.workoutPlan, ctx.workoutDoneToday)

  // Água: compara o que foi bebido com o esperado para o horário
  const slots = waterSlots(s)
  const goal = ctx.waterGoalMl, ml = ctx.waterMl
  if (slots && goal > 0 && nowMin >= slots.from + slots.every && ml < goal) {
    const expected = goal * Math.min(1, (nowMin - slots.from) / (slots.to - slots.from))
    if (ml < expected - WATER_SLACK_ML) {
      const slot = Math.floor((Math.min(nowMin, slots.to) - slots.from) / slots.every)
      out.push({
        id: `water-${today}-${slot}`, kind: 'water', tone: 'info',
        at: slots.from + slot * slots.every, tab: 'health', section: 'food:hydration',
        title: 'Hora de beber água',
        body: `Você está em ${formatMl(ml)} de ${formatMl(goal)} ml hoje. Faltam ${formatMl(goal - ml)} ml.`,
      })
    }
  }

  return out
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
  dismissed: Record<string, string>
}

// Dias à frente enviados ao servidor. O app reenvia a agenda ao abrir e a cada
// registro, então a janela só precisa cobrir quem fica alguns dias sem abrir.
export const PUSH_HORIZON_DAYS = 7

export function isQuietTime(nowMin: number, quietFrom: string, quietTo: string): boolean {
  const f = timeToMin(quietFrom), t = timeToMin(quietTo)
  if (f === t) return false
  return f < t ? nowMin >= f && nowMin < t : nowMin >= f || nowMin < t
}

function localDate(day: string, min: number): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d, Math.floor(min / 60), min % 60)
}

// Tudo o que deve virar notificação nos próximos dias, supondo que nada novo
// seja registrado. Quando algo é registrado o app recalcula e o aviso some.
export function buildPushSchedule(
  s: ReminderSettings, inp: PushScheduleInput, horizonDays = PUSH_HORIZON_DAYS,
): PushScheduleItem[] {
  const today = toDateStr(inp.now)
  const slots = waterSlots(s)
  const candidates: { day: string; r: Reminder }[] = []

  for (let i = 0; i < horizonDays; i++) {
    const day = addDays(today, i)
    for (const r of dayReminders(s, inp.profile, day, inp.workoutPlan, i === 0 && inp.workoutDoneToday)) {
      candidates.push({ day, r })
    }
    // Água: um aviso por intervalo enquanto a meta do dia não for atingida
    if (slots && !(i === 0 && inp.waterGoalMetToday)) {
      for (let k = 1; slots.from + k * slots.every <= slots.to; k++) {
        candidates.push({
          day,
          r: {
            id: `water-${day}-${k}`, kind: 'water', tone: 'info',
            at: slots.from + k * slots.every, tab: 'health', section: 'food:hydration',
            title: 'Hora de beber água',
            body: 'Lembre-se de beber água e registrar no MinhaTize.',
          },
        })
      }
    }
  }

  // Lembretes que se repetem em vários dias com o mesmo id (estoque da semana,
  // pós-dose, atraso) só valem na primeira ocorrência — mesmo que ela já tenha
  // passado, para não repetir no dia seguinte.
  const seen = new Set<string>()
  const out: PushScheduleItem[] = []
  for (const { day, r } of candidates) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    const at = localDate(day, r.at)
    if (at <= inp.now || inp.dismissed[r.id]) continue
    if (isQuietTime(r.at, s.quietFrom, s.quietTo)) continue
    const { title, body } = notificationText(r, s.discreet)
    out.push({ id: r.id, at: at.toISOString(), title, body, url: reminderUrl(r) })
  }
  return out.sort((a, b) => a.at.localeCompare(b.at))
}

// id do lembrete → data em que foi dispensado no card
export interface ReminderState {
  dismissed: Record<string, string>
}

const STATE_KEEP_DAYS = 14

export function pruneReminderState(state: ReminderState, today: string): ReminderState {
  const cutoff = addDays(today, -STATE_KEEP_DAYS)
  return { dismissed: Object.fromEntries(Object.entries(state.dismissed).filter(([, d]) => d >= cutoff)) }
}

export function notificationText(r: Reminder, discreet: boolean): { title: string; body: string } {
  return discreet
    ? { title: 'MinhaTize', body: 'Você tem um lembrete. Abra o app para ver.' }
    : { title: r.title, body: r.body }
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
  }
}

export function loadReminderSettings(): ReminderSettings {
  const stored = readJSON<Partial<ReminderSettings> | null>(STORAGE_KEYS.reminders, null)
  if (!stored) return DEFAULT_REMINDER_SETTINGS
  const d = DEFAULT_REMINDER_SETTINGS
  return {
    ...d, ...stored,
    application: { ...d.application, ...stored.application },
    stock:       { ...d.stock,       ...stored.stock },
    postDose:    { ...d.postDose,    ...stored.postDose },
    water:       { ...d.water,       ...stored.water },
    weighIn:     { ...d.weighIn,     ...stored.weighIn },
    workout:     { ...d.workout,     ...stored.workout },
  }
}

// Avisa o hook useReminders para recalcular na hora (configuração ou registro mudou)
export const REMINDERS_CHANGED_EVENT = 'minhatize:reminders-changed'

export function notifyRemindersChanged() {
  window.dispatchEvent(new Event(REMINDERS_CHANGED_EVENT))
}

export function saveReminderSettings(s: ReminderSettings) {
  writeJSON(STORAGE_KEYS.reminders, s)
  notifyRemindersChanged()
}

export function loadReminderState(): ReminderState {
  const stored = readJSON<Partial<ReminderState> | null>(STORAGE_KEYS.remindersState, null)
  return { dismissed: stored?.dismissed ?? {} }
}

export function saveReminderState(state: ReminderState) {
  writeJSON(STORAGE_KEYS.remindersState, state)
}
