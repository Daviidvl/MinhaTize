import { Tab, UserProfile, WEEK_DAYS_FULL } from '../types'
import { getLog } from './applicationCalendarUtils'
import { type WaterLog, waterGoalMl, waterTotal } from './foodUtils'
import { SPLIT_INFO, WORKOUT_SCHEDULE } from './dashboardUtils'
import { toDateStr, addDays } from './dateUtils'
import { readJSON, writeJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'
import { type UsageProfile, learnUsage, loadOpens } from './usageUtils'
import { motivationFor } from './motivationMessages'
import { getAppsLeft } from './medicationUtils'

// Notificações calculadas no próprio aparelho. A política é fixa: no máximo
// MAX_PER_DAY por dia, uma em cada janela. A manhã é da mensagem do dia
// (utils/motivationMessages.ts); a tarde e a noite ficam com os lembretes de
// aplicação, treino, água e pesagem, os mais importantes primeiro; a janela da
// loja, entre as duas, é só da Loja e das Farmácias (estoque acabando e vitrine
// semanal). O que muda de pessoa para pessoa vem do uso do app
// (utils/usageUtils.ts): o horário das janelas, o dia da pesagem e se a água
// entra. A pessoa só liga ou desliga.
//
// As mesmas regras alimentam o contador no ícone do app (getDueReminders) e a
// agenda enviada ao servidor de push (buildPushSchedule).

export type ReminderKind = 'application' | 'water' | 'weighIn' | 'workout' | 'motivation' | 'stock' | 'store'
export type ReminderSlot = 'morning' | 'afternoon' | 'store' | 'evening'

export interface ReminderSettings {
  notifications: boolean // notificações no celular (push) — ligadas por padrão
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { notifications: true }

export const MAX_PER_DAY = 4

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
// Mesmo limite do "estoque baixo" do Dashboard e dos insights
const LOW_STOCK_APPS = 4
// Sem dia de aplicação definido, o aviso de estoque sai na segunda
const STOCK_FALLBACK_WEEKDAY = 1
// Vitrine semanal da Loja: domingo
const STORE_WEEKDAY = 0

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
        id: `application-${day}`, kind: 'application', priority: 100, slots: ['afternoon', 'evening'], tab: 'dashboard',
        title: 'Hoje é dia de aplicação',
        body: 'Sua aplicação está programada para hoje. Depois de aplicar, registre no calendário.',
      })
    } else if (
      offset > 0 && offset <= LATE_APPLICATION_DAYS && log.length > 0
      && lastScheduled >= profile.startDate && !doneSince
    ) {
      out.push({
        id: `application-late-${lastScheduled}`, kind: 'application', priority: 95, slots: ['afternoon', 'evening'], tab: 'dashboard',
        title: 'Aplicação não registrada',
        body: `A aplicação de ${WEEK_DAYS_FULL[appDay].toLowerCase()} ainda não foi registrada. Se já aplicou, marque no calendário.`,
      })
    } else if (offset === 6) {
      out.push({
        id: `application-eve-${day}`, kind: 'application', priority: 90, slots: ['evening'],
        tab: 'profile', section: 'loja:aplicacao',
        title: 'Amanhã é dia de aplicar',
        body: 'Confira se o medicamento está na geladeira e se há agulha e álcool. Se faltar algo, veja os insumos na Loja.',
      })
    }
  }

  // ── Estoque acabando: uma vez por semana, no dia seguinte ao da aplicação ──
  // O estoque só muda quando a pessoa o atualiza, então avisar todo dia seria repetir
  const appsLeft     = getAppsLeft(profile)
  const stockWeekday = appDay !== undefined ? (appDay + 1) % 7 : STOCK_FALLBACK_WEEKDAY
  if (appsLeft != null && appsLeft < LOW_STOCK_APPS && dow === stockWeekday) {
    out.push({
      id: `stock-${day}`, kind: 'stock', priority: 20, slots: ['store'], tab: 'profile', section: 'farmacias',
      title: appsLeft === 0 ? 'Seu estoque acabou' : 'Seu estoque está acabando',
      body: appsLeft === 0
        ? 'Garanta a reposição antes da próxima aplicação. Fale com uma farmácia parceira.'
        : `Restam ${appsLeft === 1 ? '1 aplicação' : `${appsLeft} aplicações`}. Garanta a reposição a tempo com as farmácias parceiras.`,
    })
  }

  // ── Vitrine da Loja: uma vez por semana, se o estoque não ocupou a janela ──
  if (dow === STORE_WEEKDAY) {
    out.push({
      id: `store-${day}`, kind: 'store', priority: 10, slots: ['store'], tab: 'profile', section: 'loja',
      title: 'Selecionados para o seu tratamento',
      body: 'Agulhas, suplementos e itens de treino escolhidos para quem usa o MinhaTize. Confira a Loja.',
    })
  }

  // ── Pesagem: no dia em que a pessoa costuma se pesar ──
  // A manhã é da mensagem do dia, então o aviso chega à tarde: a dica do jejum
  // fica para a próxima pesagem.
  const weighedRecently = profile.weightHistory.some(e => e.date <= day && e.date > addDays(day, -RECENT_WEIGH_DAYS))
  if (dow === usage.weighInWeekday && !weighedRecently) {
    out.push({
      id: `weighIn-${day}`, kind: 'weighIn', priority: 60, slots: ['afternoon', 'evening'], tab: 'progress',
      title: 'Dia de se pesar',
      body: 'Já se pesou hoje? Registre o peso no Progresso. Da próxima vez, pese-se em jejum, logo ao acordar.',
    })
  }

  // ── Treino ──
  const workout = plan[dow]
  if (workout && !today.workoutDone) {
    out.push({
      id: `workout-${day}`, kind: 'workout', priority: 50, slots: ['afternoon', 'evening'],
      tab: 'health', section: 'exercise',
      title: 'Treino de hoje',
      body: `Treino ${workout.label}: ${workout.name}. Marque os exercícios conforme for fazendo.`,
    })
  }

  // ── Água: só para quem usa o registro ──
  if (usage.usesWater && !today.waterGoalMet) {
    out.push({
      id: `water-${day}`, kind: 'water', priority: 30, slots: ['afternoon', 'evening'],
      tab: 'health', section: 'food:hydration',
      title: 'Como está a água hoje?',
      body: 'Beba um copo agora e registre no MinhaTize para acompanhar a meta do dia.',
    })
  }

  // ── Mensagem do dia: todo dia, sempre de manhã ──
  out.push({
    id: `motivation-${day}`, kind: 'motivation', priority: 0, slots: ['morning'], tab: 'dashboard',
    ...motivationFor(day),
  })

  return out
}

// Janela da loja: no meio entre a tarde e a noite, então nunca coincide com elas
export function storeMin(usage: UsageProfile): number {
  return Math.round((usage.afternoonMin + usage.eveningMin) / 2 / 15) * 15
}

// Distribui os candidatos nas janelas do dia, do mais importante para o menos
function fillSlots(candidates: Candidate[], usage: UsageProfile): Reminder[] {
  const at: Record<ReminderSlot, number> = {
    morning: usage.morningMin, afternoon: usage.afternoonMin, store: storeMin(usage), evening: usage.eveningMin,
  }
  const free = new Set<ReminderSlot>(['morning', 'afternoon', 'store', 'evening'])
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

// Avisos de hoje cuja hora já chegou e que continuam valendo. A mensagem do
// dia e a vitrine da Loja não são pendências: não entram no contador.
export function getDueReminders(ctx: ReminderContext): Reminder[] {
  const candidates = dayCandidates(ctx.profile, ctx.today, ctx.workoutPlan, ctx.usage, {
    workoutDone: ctx.workoutDoneToday,
    waterGoalMet: ctx.waterGoalMl > 0 && ctx.waterMl >= ctx.waterGoalMl,
  })
  return fillSlots(candidates, ctx.usage).filter(r => r.kind !== 'motivation' && r.kind !== 'store' && r.at <= ctx.nowMin)
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
