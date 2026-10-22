import { Tab, UserProfile, WEEK_DAYS_FULL } from '../types'
import { getLog, calcStreak } from './applicationCalendarUtils'
import { getAppsLeft, getDoseValue } from './medicationUtils'
import { type WaterLog, waterGoalMl, waterTotal, waterDays, calcDayStreak, formatMl } from './foodUtils'
import { type WorkoutPlan, readWorkoutPlan } from './reminderUtils'
import { getMondayOf } from '../data/healthHubContent'
import { toDateStr, addDays } from './dateUtils'
import { readJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'

// Avisos do carrossel do Início. Diferente dos lembretes (reminderUtils), que
// viram notificação num horário, estes olham o histórico de registros e o uso
// do app para sugerir o próximo passo de cada pessoa. Só aparecem no app.

export type InsightKind = 'application' | 'stock' | 'symptoms' | 'workout' | 'weighIn' | 'progress' | 'water'

export interface Insight {
  id: string        // estável por ocorrência — dispensar some até a situação mudar
  kind: InsightKind
  title: string
  body: string
  cta: string
  tab: Tab
  section?: string
  tone: 'info' | 'warn' | 'good'
  priority: number  // maior aparece primeiro
}

export interface InsightContext {
  today: string           // YYYY-MM-DD
  profile: UserProfile
  workoutTarget: number | null // treinos por semana do plano (null = sem plano)
  workoutPlan: WorkoutPlan
  workoutLog: string[]
  waterLog: WaterLog
  waterGoalMl: number
}

// Quantos avisos o carrossel mostra de uma vez
export const MAX_INSIGHTS = 5
// Aplicação atrasada só é cobrada nos 3 dias seguintes à data programada
const LATE_APPLICATION_DAYS = 3
// A partir de quantos dias sem pesagem o app sugere se pesar
const WEIGH_GAP_DAYS = 8

function diffDays(a: string, b: string): number {
  return Math.round((new Date(a + 'T12:00:00').getTime() - new Date(b + 'T12:00:00').getTime()) / 864e5)
}

const weekdayOf = (day: string) => new Date(day + 'T12:00:00').getDay()
const weekKeyOf = (day: string) => getMondayOf(new Date(day + 'T12:00:00'))
const latest    = (days: string[]) => days.reduce((a, b) => (b > a ? b : a), '')
const fmtKg     = (kg: number) => kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const plural    = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function getInsights(ctx: InsightContext): Insight[] {
  const { today, profile } = ctx
  const dow = weekdayOf(today)
  const weekKey = weekKeyOf(today)
  const out: Insight[] = []
  const log  = getLog(profile)
  const dose = getDoseValue(profile)

  // ── Aplicação ──
  const appDay = profile.applicationDay
  if (appDay !== undefined) {
    const offset        = (dow - appDay + 7) % 7 // dias desde a última data programada
    const lastScheduled = addDays(today, -offset)
    const doneSince     = log.some(d => d >= lastScheduled && d <= today)
    const dayName       = WEEK_DAYS_FULL[appDay].toLowerCase()

    if (offset === 0 && !doneSince) {
      out.push({
        id: `insight-application-${today}`, kind: 'application', tone: 'info', priority: 100,
        tab: 'dashboard', cta: 'Abrir calendário',
        title: 'Hoje é dia de aplicar',
        body: `${dose != null ? `Sua dose de ${fmtKg(dose)} mg` : 'Sua aplicação'} está programada para hoje. Depois de aplicar, marque no calendário.`,
      })
    } else if (
      offset > 0 && offset <= LATE_APPLICATION_DAYS && log.length > 0
      && lastScheduled >= profile.startDate && !doneSince
    ) {
      out.push({
        id: `insight-application-late-${lastScheduled}`, kind: 'application', tone: 'warn', priority: 95,
        tab: 'dashboard', cta: 'Registrar aplicação',
        title: 'Aplicação sem registro',
        body: `A aplicação de ${dayName} ainda não foi marcada. Se já aplicou, registre para manter o histórico em dia.`,
      })
    } else if (offset >= 5) {
      const daysLeft = 7 - offset
      out.push({
        id: `insight-application-soon-${addDays(today, daysLeft)}`, kind: 'application', tone: 'info',
        priority: daysLeft === 1 ? 80 : 60, tab: 'dashboard', cta: 'Ver calendário',
        title: daysLeft === 1 ? 'Amanhã é dia de aplicar' : 'O dia de aplicar está próximo',
        body: daysLeft === 1
          ? 'Confira se o medicamento está na geladeira e deixe agulha e álcool separados.'
          : `Sua próxima aplicação é daqui a 2 dias, ${dayName}. Vale conferir se tem tudo em casa.`,
      })
    }

    const streak = calcStreak(new Set(log), appDay, today)
    if (doneSince && streak >= 4) {
      out.push({
        id: `insight-application-streak-${streak}`, kind: 'application', tone: 'good', priority: 20,
        tab: 'progress', cta: 'Ver evolução',
        title: `${streak} semanas seguidas em dia`,
        body: 'Você não perdeu nenhuma aplicação nesse período. A regularidade é o que sustenta o resultado.',
      })
    }
  }

  // ── Estoque ──
  const appsLeft = getAppsLeft(profile)
  if (appsLeft != null && appsLeft < 4) {
    out.push({
      id: `insight-stock-${weekKey}`, kind: 'stock', tone: 'warn', priority: appsLeft === 0 ? 92 : 85,
      tab: 'profile', section: 'stock', cta: 'Atualizar estoque',
      title: appsLeft === 0 ? 'Seu estoque acabou' : `Restam ${plural(appsLeft, 'aplicação', 'aplicações')}`,
      body: appsLeft === 0
        ? 'Atualize o estoque ou providencie a reposição antes da próxima dose.'
        : 'Providencie a reposição com antecedência: o pedido pode levar alguns dias.',
    })
  }

  // ── Sintomas: 1 a 2 dias depois da aplicação, se a semana ainda não tem registro ──
  const lastApp = latest(log)
  if (lastApp) {
    const since = diffDays(today, lastApp)
    const hasSymptoms = (profile.sideEffects ?? []).some(e => e.date === weekKey)
    if (since >= 1 && since <= 2 && !hasSymptoms) {
      out.push({
        id: `insight-symptoms-${lastApp}`, kind: 'symptoms', tone: 'info', priority: 70,
        tab: 'health', section: 'symptoms', cta: 'Registrar sintomas',
        title: 'Como você está desde a aplicação?',
        body: 'Anotar enjoo, apetite ou cansaço nos dias seguintes à dose ajuda a entender sua adaptação.',
      })
    }
  }

  // ── Treino ──
  const target = ctx.workoutTarget
  if (target) {
    const weekDone    = ctx.workoutLog.filter(d => d >= weekKey && d <= today).length
    const doneToday   = ctx.workoutLog.includes(today)
    const daysElapsed = ((dow + 6) % 7) + 1 // segunda = 1 … domingo = 7
    const daysLeft    = 7 - daysElapsed + (doneToday ? 0 : 1) // contando hoje, se ainda dá para treinar
    const missing     = target - weekDone
    const todayPlan   = ctx.workoutPlan[dow]
    const last        = latest(ctx.workoutLog.filter(d => d <= today))

    if (missing <= 0) {
      out.push({
        id: `insight-workout-goal-${weekKey}`, kind: 'workout', tone: 'good', priority: 30,
        tab: 'health', section: 'exercise', cta: 'Ver treino',
        title: 'Meta de treinos da semana batida',
        body: `${weekDone} de ${target} treinos feitos. Treinar força ajuda a preservar a massa muscular enquanto o peso cai.`,
      })
    } else if (weekDone === 0 && daysElapsed >= 3) {
      const lastText = last ? `Seu último treino foi há ${plural(diffDays(today, last), 'dia', 'dias')}. ` : ''
      out.push({
        id: `insight-workout-none-${weekKey}`, kind: 'workout', tone: 'info', priority: 75,
        tab: 'health', section: 'exercise', cta: 'Ver treino',
        title: 'Você ainda não foi à academia esta semana',
        body: lastText + (todayPlan && !doneToday
          ? `Hoje tem o treino ${todayPlan.label}: ${todayPlan.name}.`
          : `Ainda dá para fazer os ${target} treinos da meta.`),
      })
    } else if (missing >= daysLeft) {
      out.push({
        id: `insight-workout-behind-${today}`, kind: 'workout', tone: 'info', priority: 55,
        tab: 'health', section: 'exercise', cta: 'Ver treino',
        title: 'Reta final da semana',
        body: `Faltam ${plural(missing, 'treino', 'treinos')} e ${daysLeft === 1 ? 'resta 1 dia' : `restam ${daysLeft} dias`} para bater a meta de ${target}×.`,
      })
    } else if (todayPlan && !doneToday) {
      out.push({
        id: `insight-workout-today-${today}`, kind: 'workout', tone: 'info', priority: 45,
        tab: 'health', section: 'exercise', cta: 'Ver treino',
        title: `Hoje tem treino ${todayPlan.label}`,
        body: `${todayPlan.name}. ${weekDone} de ${target} feitos nesta semana.`,
      })
    }
  } else {
    out.push({
      id: 'insight-workout-setup', kind: 'workout', tone: 'info', priority: 8,
      tab: 'health', section: 'exercise', cta: 'Montar plano',
      title: 'Monte seu plano de treino',
      body: 'Treino de força preserva a massa muscular durante o emagrecimento. Leva um minuto para configurar.',
    })
  }

  // ── Pesagem e evolução ──
  const weights = [...profile.weightHistory].sort((a, b) => a.date.localeCompare(b.date))
  const lastWeigh = weights.at(-1)
  if (!lastWeigh) {
    out.push({
      id: 'insight-weigh-first', kind: 'weighIn', tone: 'info', priority: 40,
      tab: 'progress', cta: 'Registrar peso',
      title: 'Registre seu peso',
      body: 'Com o primeiro registro, o app passa a mostrar sua evolução semana a semana.',
    })
  } else {
    const gap = diffDays(today, lastWeigh.date)
    if (gap >= WEIGH_GAP_DAYS) {
      out.push({
        id: `insight-weigh-gap-${lastWeigh.date}`, kind: 'weighIn', tone: 'info', priority: 50,
        tab: 'progress', cta: 'Registrar peso',
        title: `Faz ${gap} dias que você não se pesa`,
        body: 'Uma pesagem por semana, em jejum e no mesmo horário, mostra a tendência real.',
      })
    }

    // Comparação com a pesagem de pelo menos 4 semanas antes da última
    const cutoff = addDays(lastWeigh.date, -28)
    const base = weights.filter(e => e.date <= cutoff).at(-1)
    const lost = base ? base.weight - lastWeigh.weight : 0
    if (base && lost >= 0.5) {
      const weeks = Math.round(diffDays(lastWeigh.date, base.date) / 7)
      out.push({
        id: `insight-progress-${lastWeigh.date}`, kind: 'progress', tone: 'good', priority: 25,
        tab: 'progress', cta: 'Ver evolução',
        title: `${fmtKg(lost)} kg a menos em ${weeks} semanas`,
        body: 'Seu peso está em queda. Continue registrando para acompanhar a tendência.',
      })
    }
  }

  // ── Água ──
  const goal = ctx.waterGoalMl
  if (goal > 0) {
    const streak = calcDayStreak(waterDays(ctx.waterLog, goal), new Date(today + 'T12:00:00'))
    const yesterday = addDays(today, -1)
    const yMl = waterTotal(ctx.waterLog[yesterday])
    if (streak >= 3) {
      out.push({
        id: `insight-water-streak-${today}`, kind: 'water', tone: 'good', priority: 22,
        tab: 'health', section: 'food:hydration', cta: 'Ver hidratação',
        title: `${streak} dias seguidos na meta de água`,
        body: 'Boa hidratação ajuda a reduzir enjoo e prisão de ventre, comuns no tratamento.',
      })
    } else if (ctx.waterLog[yesterday]?.length && yMl < goal) {
      out.push({
        id: `insight-water-yesterday-${yesterday}`, kind: 'water', tone: 'info', priority: 35,
        tab: 'health', section: 'food:hydration', cta: 'Registrar água',
        title: 'Ontem a água ficou abaixo da meta',
        body: `Foram ${formatMl(yMl)} de ${formatMl(goal)} ml. Deixe uma garrafa por perto hoje e registre a cada copo.`,
      })
    }
  }

  return out.sort((a, b) => b.priority - a.priority)
}

// ── Leitura dos dados locais ─────────────────────────────────────────────────

export function readInsightContext(profile: UserProfile, now = new Date()): InsightContext {
  const weight = profile.weightHistory.at(-1)?.weight ?? profile.currentWeight ?? profile.startWeight
  const wp     = readJSON<{ days: number } | null>(STORAGE_KEYS.workoutProfile, null)
  const plan   = readWorkoutPlan()
  return {
    today: toDateStr(now),
    profile,
    workoutTarget: wp && Object.keys(plan).length > 0 ? wp.days : null,
    workoutPlan: plan,
    workoutLog: readJSON<string[]>(STORAGE_KEYS.workoutLog, []),
    waterLog: readJSON<WaterLog>(STORAGE_KEYS.waterLog, {}),
    waterGoalMl: waterGoalMl(weight),
  }
}
