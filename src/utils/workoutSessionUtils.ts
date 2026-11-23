import type { ExItem, Level } from '../data/exercisePlans'
import { readJSON, writeJSON, removeKey } from './storage'
import { STORAGE_KEYS } from './storageKeys'

// Treino guiado: o app conduz o treino série a série, como um personal —
// preparação, execução (cronômetro), descanso (contagem regressiva) e, no fim,
// o resumo com tempo e calorias estimadas.
//
// O estado é guardado em instantes (epoch ms), nunca em contagem de ticks: com o
// app em segundo plano ou a tela bloqueada os timers do navegador congelam, e na
// volta `tick` recupera as fases que já terminaram.

export const READY_MS     = 10_000           // "Prepare-se" antes do 1º exercício e ao pular um
export const REST_OPTIONS = [45, 60, 90, 120] // segundos
export const SECS_PER_REP = 3                // ritmo controlado: ~1s subindo, ~2s descendo
// Série além disso é app esquecido aberto: o excedente conta como descanso
export const MAX_SET_MS   = 3 * 60_000
// Série aberta há mais que isso: o treino foi largado — pausa sozinho, para
// não somar horas (e calorias) de um app esquecido aberto
export const AUTO_PAUSE_MS = 10 * 60_000

// MET (Compendium of Physical Activities, Ainsworth et al.) durante as séries:
// 3,5 = musculação com vários exercícios, carga moderada (02054);
// 5,0 = esforço moderado a intenso (02052); 6,0 = esforço vigoroso (02050).
export const WORK_MET: Record<Level, number> = { beginner: 3.5, intermediate: 5.0, advanced: 6.0 }
// Entre as séries: em pé, recuperando, trocando de aparelho
export const REST_MET = 2.0

// ── Plano da sessão ──────────────────────────────────────────────────────────

export interface SessionExercise {
  name: string
  tip?: string
  sets: number
  reps: string   // faixa de repetições, ex.: '12–15'
  secs?: number  // isometria: segundos por série (contagem regressiva)
}

export interface SessionPlan {
  label: string
  name: string
  level: Level
  restSecs: number
  exercises: SessionExercise[]
}

// '2–3' → [2, 3] · '60s' → [60, 60] · '' → [0, 0]
export function parseRange(text: string): [number, number] {
  const nums = text.match(/\d+/g)?.map(Number) ?? []
  if (nums.length === 0) return [0, 0]
  return [nums[0], nums[1] ?? nums[0]]
}

// '60s' → 60 · '90s' → 90 · '2min' → 120
export function parseSeconds(text: string): number {
  const n = parseRange(text)[0]
  return /min/.test(text) ? n * 60 : n
}

// Opções de séries pela faixa do nível: '3–4' → [3, 4]
export function setOptions(volumeSets: string): number[] {
  const [lo, hi] = parseRange(volumeSets)
  if (lo <= 0) return [3]
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
}

// Isometria: iniciante no mínimo da faixa, avançado no máximo, intermediário no meio (múltiplo de 5)
export function holdSecs([lo, hi]: [number, number], level: Level): number {
  if (level === 'beginner') return lo
  if (level === 'advanced') return hi
  return Math.round((lo + hi) / 2 / 5) * 5
}

export function buildSessionPlan(
  day: { label: string; name: string },
  items: ExItem[],
  opts: { level: Level; sets: number; reps: string; restSecs: number },
): SessionPlan {
  return {
    label: day.label,
    name: day.name,
    level: opts.level,
    restSecs: opts.restSecs,
    exercises: items.map(it => ({
      name: it.name,
      tip: it.tip,
      sets: opts.sets,
      reps: opts.reps,
      ...(it.secs ? { secs: holdSecs(it.secs, opts.level) } : {}),
    })),
  }
}

export function setsPlanned(plan: SessionPlan): number {
  return plan.exercises.reduce((sum, e) => sum + e.sets, 0)
}

// Tempo típico de uma série, usado só na estimativa antes de começar
export function setWorkSecs(e: SessionExercise): number {
  if (e.secs) return e.secs
  const [lo, hi] = parseRange(e.reps)
  return Math.round(((lo + hi) / 2) * SECS_PER_REP)
}

// ── Calorias ─────────────────────────────────────────────────────────────────

// Fórmula do ACSM: kcal/min = MET × 3,5 × peso (kg) / 200
export function estimateKcal(workSecs: number, restSecs: number, weightKg: number, level: Level): number {
  if (!(weightKg > 0)) return 0
  const metMinutes = (workSecs / 60) * WORK_MET[level] + (restSecs / 60) * REST_MET
  return Math.round((metMinutes * 3.5 * weightKg) / 200)
}

export interface PlanEstimate {
  totalSecs: number
  workSecs: number
  restSecs: number
  kcal: number
}

export function estimatePlan(plan: SessionPlan, weightKg: number): PlanEstimate {
  const sets     = setsPlanned(plan)
  const workSecs = plan.exercises.reduce((sum, e) => sum + e.sets * setWorkSecs(e), 0)
  const restSecs = READY_MS / 1000 + Math.max(0, sets - 1) * plan.restSecs
  return { totalSecs: workSecs + restSecs, workSecs, restSecs, kcal: estimateKcal(workSecs, restSecs, weightKg, plan.level) }
}

// ── Estado da sessão ─────────────────────────────────────────────────────────

export type Phase = 'ready' | 'work' | 'rest' | 'done'

export interface SessionState {
  v: 1
  date: string            // AAAA-MM-DD do início
  plan: SessionPlan       // cópia: retomar não depende do plano atual
  startedAt: number
  ex: number              // exercício atual (em 'rest', o da próxima série)
  set: number             // série atual, a partir de 1 (em 'rest', a próxima)
  phase: Phase
  phaseAt: number         // início da fase, já deslocado pelas pausas
  phaseLen: number        // duração das fases com contagem regressiva; 0 = cronômetro livre
  pausedAt: number | null
  pausedMs: number
  workMs: number          // tempo total em execução
  restMs: number          // descanso + preparação
  setsDone: number[]      // séries feitas por exercício
  endedAt: number | null
}

export function startSession(plan: SessionPlan, date: string, now: number): SessionState {
  return {
    v: 1, date, plan, startedAt: now,
    ex: 0, set: 1, phase: 'ready', phaseAt: now, phaseLen: READY_MS,
    pausedAt: null, pausedMs: 0, workMs: 0, restMs: 0,
    setsDone: plan.exercises.map(() => 0), endedAt: null,
  }
}

function workLen(s: SessionState, ex: number): number {
  const secs = s.plan.exercises[ex]?.secs
  return secs ? secs * 1000 : 0
}

// Soma o tempo da fase atual (até `at`) no acumulador certo
function closePhase(s: SessionState, at: number): Pick<SessionState, 'workMs' | 'restMs'> {
  if (s.phase === 'done') return { workMs: s.workMs, restMs: s.restMs }
  let elapsed = Math.max(0, at - s.phaseAt)
  if (s.phaseLen > 0) elapsed = Math.min(elapsed, s.phaseLen)
  if (s.phase !== 'work') return { workMs: s.workMs, restMs: s.restMs + elapsed }
  const work = Math.min(elapsed, MAX_SET_MS)
  return { workMs: s.workMs + work, restMs: s.restMs + (elapsed - work) }
}

function enterWork(s: SessionState, at: number): SessionState {
  return { ...s, ...closePhase(s, at), phase: 'work', phaseAt: at, phaseLen: workLen(s, s.ex) }
}

function enterRest(s: SessionState, at: number, ex: number, set: number): SessionState {
  return { ...s, ex, set, phase: 'rest', phaseAt: at, phaseLen: s.plan.restSecs * 1000 }
}

export function finishSession(s: SessionState, now: number): SessionState {
  if (s.phase === 'done') return s
  // Pausado: a pausa final não conta no tempo de treino
  const end = s.pausedAt ?? now
  return { ...s, ...closePhase(s, end), phase: 'done', phaseAt: end, phaseLen: 0, pausedAt: null, endedAt: end }
}

// Fim de uma série: descanso antes da próxima (ou do próximo exercício); a última encerra o treino
export function completeSet(s: SessionState, at: number): SessionState {
  if (s.phase !== 'work' || s.pausedAt !== null) return s
  const setsDone = s.setsDone.map((n, i) => (i === s.ex ? n + 1 : n))
  const closed   = { ...s, ...closePhase(s, at), setsDone, phaseAt: at, phaseLen: 0, phase: 'rest' as const }
  const sets     = s.plan.exercises[s.ex].sets
  if (s.set < sets) return enterRest(closed, at, s.ex, s.set + 1)
  if (s.ex + 1 < s.plan.exercises.length) return enterRest(closed, at, s.ex + 1, 1)
  return { ...closed, phase: 'done', phaseLen: 0, endedAt: at }
}

// Preparação ou descanso → série (antes do fim, se o usuário quiser)
export function startSet(s: SessionState, at: number): SessionState {
  if ((s.phase !== 'ready' && s.phase !== 'rest') || s.pausedAt !== null) return s
  return enterWork(s, at)
}

export function addRest(s: SessionState, ms: number): SessionState {
  if (s.phase !== 'rest') return s
  return { ...s, phaseLen: s.phaseLen + ms }
}

// Pula o exercício atual (em descanso, o que viria a seguir) e vai para a preparação do próximo
export function skipExercise(s: SessionState, at: number): SessionState {
  if (s.phase === 'done' || s.pausedAt !== null) return s
  if (s.ex + 1 >= s.plan.exercises.length) return finishSession(s, at)
  return { ...s, ...closePhase(s, at), ex: s.ex + 1, set: 1, phase: 'ready', phaseAt: at, phaseLen: READY_MS }
}

export function pauseSession(s: SessionState, at: number): SessionState {
  if (s.phase === 'done' || s.pausedAt !== null) return s
  return { ...s, pausedAt: at }
}

export function resumeSession(s: SessionState, at: number): SessionState {
  if (s.pausedAt === null) return s
  const d = Math.max(0, at - s.pausedAt)
  return { ...s, pausedAt: null, pausedMs: s.pausedMs + d, phaseAt: s.phaseAt + d }
}

// Avança as fases com contagem regressiva que já terminaram (inclusive várias
// seguidas, depois de um tempo em segundo plano)
export function tick(s: SessionState, now: number): SessionState {
  let cur = s
  for (let guard = 0; guard < 500; guard++) {
    if (cur.phase === 'done' || cur.pausedAt !== null || cur.phaseLen === 0) break
    const end = cur.phaseAt + cur.phaseLen
    if (now < end) break
    cur = cur.phase === 'work' ? completeSet(cur, end) : enterWork(cur, end)
  }
  if (cur.phase === 'work' && cur.phaseLen === 0 && cur.pausedAt === null && now - cur.phaseAt > AUTO_PAUSE_MS) {
    cur = { ...cur, pausedAt: cur.phaseAt + AUTO_PAUSE_MS }
  }
  return cur
}

// ── Leitura do estado ────────────────────────────────────────────────────────

export function phaseElapsed(s: SessionState, now: number): number {
  return Math.max(0, (s.pausedAt ?? now) - s.phaseAt)
}

export function phaseRemaining(s: SessionState, now: number): number {
  return s.phaseLen > 0 ? Math.max(0, s.phaseLen - phaseElapsed(s, now)) : 0
}

export function sessionElapsed(s: SessionState, now: number): number {
  return Math.max(0, (s.endedAt ?? s.pausedAt ?? now) - s.startedAt - s.pausedMs)
}

export function totalSetsDone(s: SessionState): number {
  return s.setsDone.reduce((sum, n) => sum + n, 0)
}

// Exercícios com todas as séries feitas (índices do treino)
export function completedExercises(s: SessionState): number[] {
  return s.plan.exercises.flatMap((e, i) => (s.setsDone[i] >= e.sets ? [i] : []))
}

// Descanso antes de um exercício novo (e não entre séries do mesmo)
export function isBetweenExercises(s: SessionState): boolean {
  return s.phase === 'rest' && s.set === 1
}

// ── Resumo ───────────────────────────────────────────────────────────────────

export interface WorkoutSessionRecord {
  date: string
  label: string
  name: string
  startedAt: number
  totalSecs: number
  workSecs: number
  restSecs: number
  sets: number
  setsPlanned: number
  exercises: number       // com todas as séries feitas
  exercisesTotal: number
  kcal: number
  weightKg: number
}

export function summarizeSession(s: SessionState, weightKg: number): WorkoutSessionRecord {
  const workSecs = Math.round(s.workMs / 1000)
  const restSecs = Math.round(s.restMs / 1000)
  return {
    date: s.date,
    label: s.plan.label,
    name: s.plan.name,
    startedAt: s.startedAt,
    totalSecs: Math.round(sessionElapsed(s, s.endedAt ?? s.phaseAt) / 1000),
    workSecs,
    restSecs,
    sets: totalSetsDone(s),
    setsPlanned: setsPlanned(s.plan),
    exercises: completedExercises(s).length,
    exercisesTotal: s.plan.exercises.length,
    kcal: estimateKcal(workSecs, restSecs, weightKg, s.plan.level),
    weightKg: Math.round(weightKg * 10) / 10,
  }
}

export interface SessionTotals {
  count: number
  totalSecs: number
  kcal: number
}

// Totais das sessões a partir de `since` (AAAA-MM-DD, inclusive)
export function sessionTotals(records: WorkoutSessionRecord[], since: string): SessionTotals {
  return records
    .filter(r => r.date >= since)
    .reduce((t, r) => ({ count: t.count + 1, totalSecs: t.totalSecs + r.totalSecs, kcal: t.kcal + r.kcal }), { count: 0, totalSecs: 0, kcal: 0 })
}

// ── Textos ───────────────────────────────────────────────────────────────────

// 65_000 → '1:05' · 3_725_000 → '1:02:05'
export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

// Contagem regressiva: arredonda para cima (mostra 0:01 até o último instante)
export function fmtCountdown(ms: number): string {
  return fmtClock(Math.ceil(ms / 1000) * 1000)
}

// 45 → '45 s' · 2520 → '42 min' · 3900 → '1 h 05 min'
export function fmtDuration(secs: number): string {
  if (secs < 60) return `${Math.max(0, Math.round(secs))} s`
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min`
}

// 90 → '1 minuto e 30 segundos' (para a voz)
export function spokenSecs(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  const min = m === 1 ? '1 minuto' : `${m} minutos`
  if (m === 0) return `${s} segundos`
  return s === 0 ? min : `${min} e ${s} segundos`
}

// '12–15' → '12 a 15'
export function spokenReps(reps: string): string {
  const [lo, hi] = parseRange(reps)
  return lo === hi ? `${lo}` : `${lo} a ${hi}`
}

// Alvo de uma série no chip: '12–15 reps' ou '40 s'
export function targetLabel(e: SessionExercise): string {
  return e.secs ? `${e.secs} s` : `${e.reps} reps`
}

function spokenTarget(e: SessionExercise): string {
  return e.secs ? `${e.secs} segundos` : `${spokenReps(e.reps)} repetições`
}

// O que o "personal" fala ao entrar em cada fase
export function phaseCue(s: SessionState): string {
  const e = s.plan.exercises[s.ex]
  switch (s.phase) {
    case 'ready':
      return totalSetsDone(s) === 0 && s.ex === 0
        ? `Vamos lá! Treino ${s.plan.label}. Primeiro exercício: ${e.name}. ${e.sets} séries de ${spokenTarget(e)}. Prepare-se.`
        : `Próximo exercício: ${e.name}. ${e.sets} séries de ${spokenTarget(e)}. Prepare-se.`
    case 'work': {
      const what = e.secs ? `Segure ${e.secs} segundos` : `${spokenReps(e.reps)} repetições`
      return s.set === e.sets && e.sets > 1
        ? `Última série! ${what}. Capricha!`
        : `Série ${s.set} de ${e.sets}. ${what}. Vai!`
    }
    case 'rest':
      return isBetweenExercises(s)
        ? `Exercício concluído! Descanse ${spokenSecs(s.plan.restSecs)}. Próximo: ${e.name}.`
        : `Boa! Descanse ${spokenSecs(s.plan.restSecs)}.`
    case 'done':
      return 'Treino concluído! Parabéns, você mandou muito bem.'
  }
}

const WORK_TIPS = [
  'Controle a descida: 2 a 3 segundos.',
  'Solte o ar no esforço, puxe na volta.',
  'Postura primeiro, carga depois.',
  'Pense no músculo que está trabalhando.',
  'Amplitude completa vale mais que peso.',
  'Doeu a articulação? Pare e ajuste.',
]
const REST_TIPS = [
  'Respire fundo e tome um gole de água.',
  'Última série ficou fácil? Suba um pouco a carga.',
  'Solte os ombros e respire pelo nariz.',
  'Aproveite para ajustar o aparelho.',
]

// Dica do "personal" na tela: muda a cada série, sem sortear (não pula a cada render)
export function coachTip(s: SessionState): string {
  const list = s.phase === 'rest' ? REST_TIPS : WORK_TIPS
  return list[(s.ex * 3 + s.set) % list.length]
}

// ── Leitura e gravação ───────────────────────────────────────────────────────

// Treino em andamento: só o de hoje é retomado (o de ontem fica pelo caminho;
// os exercícios completos dele já foram marcados no dia)
export function readActiveSession(today: string): SessionState | null {
  const s = readJSON<SessionState | null>(STORAGE_KEYS.workoutActive, null)
  if (!s || s.v !== 1 || s.phase === 'done' || s.date !== today) return null
  return s
}

export function saveActiveSession(s: SessionState) {
  writeJSON(STORAGE_KEYS.workoutActive, s)
}

export function clearActiveSession() {
  removeKey(STORAGE_KEYS.workoutActive)
}

const MAX_RECORDS = 200

export function readSessions(): WorkoutSessionRecord[] {
  return readJSON<WorkoutSessionRecord[]>(STORAGE_KEYS.workoutSessions, [])
}

export function appendSession(r: WorkoutSessionRecord): WorkoutSessionRecord[] {
  const next = [...readSessions(), r].slice(-MAX_RECORDS)
  writeJSON(STORAGE_KEYS.workoutSessions, next)
  return next
}

export interface WorkoutPrefs {
  voice: boolean
  sets?: number
  restSecs?: number
}

export function readWorkoutPrefs(): WorkoutPrefs {
  return { voice: true, ...readJSON<Partial<WorkoutPrefs>>(STORAGE_KEYS.workoutPrefs, {}) }
}

export function saveWorkoutPrefs(p: WorkoutPrefs) {
  writeJSON(STORAGE_KEYS.workoutPrefs, p)
}
