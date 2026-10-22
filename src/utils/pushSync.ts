import { UserProfile } from '../types'
import {
  type ReminderSettings, type ReminderState, type PushScheduleItem,
  buildPushSchedule, readReminderContext,
} from './reminderUtils'
import { getStoredToken } from './token'
import { readJSON, writeJSON, removeKey } from './storage'
import { STORAGE_KEYS } from './storageKeys'

// Notificações no celular (Web Push). O app calcula a agenda dos próximos dias
// e envia ao servidor só "quando" e "o que mostrar"; o servidor dispara na hora
// (api/push-cron.ts), mesmo com o app fechado. Nenhum dado de saúde vai junto.

const PUSH_API = '/api/push'
// Reenvia mesmo sem mudança depois disso — refaz a inscrição se o servidor a descartou
const RESYNC_MS = 24 * 3_600_000
const SW_READY_TIMEOUT_MS = 5_000
// Depois de uma falha, espera antes de tentar de novo: o app sincroniza a cada
// minuto e /api/push aceita 60 chamadas por hora por IP
const RETRY_MS = 10 * 60_000
let retryAt = 0

export function isPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// iPhone/iPad fora da tela de início: o Safari só libera push para o app instalado
export function needsHomeScreenInstall(): boolean {
  if (typeof navigator === 'undefined') return false
  const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia?.('(display-mode: standalone)').matches
  return iOS && !standalone
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

let publicKeyCache: string | null = null

async function getPublicKey(): Promise<string | null> {
  if (publicKeyCache) return publicKeyCache
  const res = await fetch(PUSH_API)
  if (!res.ok) return null
  const data = await res.json() as { publicKey?: unknown }
  publicKeyCache = typeof data.publicKey === 'string' ? data.publicKey : null
  return publicKeyCache
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS))
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return true // navegador que não informa a chave: não dá para comparar
  const x = new Uint8Array(a)
  return x.length === b.length && x.every((v, i) => v === b[i])
}

async function deleteOnServer(endpoint: string, token: string) {
  await fetch(PUSH_API, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {})
}

async function ensureSubscription(token: string): Promise<PushSubscription | null> {
  const reg = await getRegistration()
  if (!reg) return null
  const key = await getPublicKey()
  if (!key) return null
  const serverKey = urlBase64ToUint8Array(key)
  const existing  = await reg.pushManager.getSubscription()
  if (existing) {
    if (sameKey(existing.options.applicationServerKey, serverKey)) return existing
    // Inscrição feita com outra chave VAPID (chaves trocadas ou testes antigos):
    // o serviço de push recusaria todo envio. Refaz com a chave atual.
    await deleteOnServer(existing.endpoint, token)
    await existing.unsubscribe().catch(() => false)
  }
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: serverKey })
}

// Hash curto (djb2) para comparar agendas sem guardar a lista inteira
function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

interface SyncMark { sig: string; at: number }

export function buildScheduleForDevice(
  profile: UserProfile, state: ReminderState, now = new Date(),
): PushScheduleItem[] {
  const ctx = readReminderContext(profile, now)
  return buildPushSchedule({
    now, profile,
    workoutPlan: ctx.workoutPlan,
    workoutDoneToday: ctx.workoutDoneToday,
    waterGoalMetToday: ctx.waterGoalMl > 0 && ctx.waterMl >= ctx.waterGoalMl,
    usage: ctx.usage,
    dismissed: state.dismissed,
  })
}

// Mantém a inscrição e a agenda do servidor em dia. Barato quando nada mudou:
// compara a assinatura da agenda do dia inteiro (independe do minuto atual).
export async function syncPush(profile: UserProfile, s: ReminderSettings, state: ReminderState): Promise<void> {
  if (!isPushSupported()) return
  if (!s.notifications) return disablePush()
  if (Notification.permission !== 'granted') return
  const token = getStoredToken()
  if (!token) return
  if (Date.now() < retryAt) return

  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sub = await ensureSubscription(token)
    if (!sub) return

    const sig  = hash(sub.endpoint + JSON.stringify(buildScheduleForDevice(profile, state, startOfDay)))
    const mark = readJSON<SyncMark | null>(STORAGE_KEYS.pushSync, null)
    if (mark?.sig === sig && Date.now() - mark.at < RESYNC_MS) return

    const res = await fetch(PUSH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscription: sub.toJSON(), schedule: buildScheduleForDevice(profile, state, now) }),
    })
    if (res.ok) {
      writeJSON(STORAGE_KEYS.pushSync, { sig, at: Date.now() } satisfies SyncMark)
    } else {
      retryAt = Date.now() + RETRY_MS
      console.warn(`[push] O servidor recusou a agenda (HTTP ${res.status}). Nova tentativa em 10 min.`)
    }
  } catch (err) {
    retryAt = Date.now() + RETRY_MS
    console.warn('[push] Falha ao sincronizar notificações:', err)
  }
}

// Notificações desligadas ou logout: remove a inscrição no servidor e no aparelho
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (!sub) return
    const token = getStoredToken()
    if (token) await deleteOnServer(sub.endpoint, token)
    await sub.unsubscribe()
    removeKey(STORAGE_KEYS.pushSync)
  } catch (err) {
    console.warn('[push] Falha ao desativar notificações:', err)
  }
}
