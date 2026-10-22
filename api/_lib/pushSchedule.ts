// Agenda de notificações enviada pelo app (src/utils/reminderUtils.ts →
// buildPushSchedule). O servidor não calcula lembrete nenhum: guarda só
// "quando" e "o que mostrar" e dispara na hora (api/push-cron.ts). Nenhum dado
// de saúde (peso, dose, sintomas) faz parte deste formato.

export interface PushItem {
  id: string
  at: string    // ISO 8601 (UTC)
  title: string
  body: string
  url: string   // caminho interno do app, ex.: "/?tab=health&section=symptoms"
}

export const MAX_ITEMS = 400
const MAX_AHEAD_MS = 15 * 864e5
const ID_RE  = /^[\w:-]{1,80}$/
const URL_RE = /^\/(\?[\w=&%:.-]{0,150})?$/

const str = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\r\n\t]+/g, ' ').trim().slice(0, max) : ''

// Descarta silenciosamente itens malformados, no passado ou longe demais.
// Retorna null se o formato geral for inválido.
export function sanitizeSchedule(raw: unknown, now = Date.now()): PushItem[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_ITEMS) return null
  const out: PushItem[] = []
  const seen = new Set<string>()
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    const id = typeof o.id === 'string' && ID_RE.test(o.id) ? o.id : ''
    const at = typeof o.at === 'string' ? Date.parse(o.at) : NaN
    const title = str(o.title, 80)
    const body  = str(o.body, 200)
    const url   = typeof o.url === 'string' && URL_RE.test(o.url) ? o.url : '/'
    if (!id || seen.has(id) || !title || !Number.isFinite(at)) continue
    if (at <= now || at > now + MAX_AHEAD_MS) continue
    seen.add(id)
    out.push({ id, at: new Date(at).toISOString(), title, body, url })
  }
  return out.sort((a, b) => a.at.localeCompare(b.at))
}

export function nextAt(items: PushItem[]): string | null {
  return items.length ? items[0].at : null
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

const KEY_RE = /^[A-Za-z0-9_-]{8,200}={0,2}$/

// Só serviços de push dos navegadores: o servidor faz POST no endpoint, então
// um endereço qualquer viraria um proxy para a rede (SSRF).
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,                 // Chrome, Edge (Android), Opera
  /^(.+\.)?push\.apple\.com$/,              // Safari / iOS
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^(.+\.)?notify\.windows\.com$/,          // Edge (Windows)
]

export function isPushHost(hostname: string): boolean {
  return PUSH_HOSTS.some(re => re.test(hostname))
}

export function sanitizeSubscription(raw: unknown): PushSubscriptionInput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  if (typeof o.endpoint !== 'string' || o.endpoint.length > 1000) return null
  let u: URL
  try { u = new URL(o.endpoint) } catch { return null }
  if (u.protocol !== 'https:' || u.port || !isPushHost(u.hostname)) return null
  const p256dh = o.keys?.p256dh, auth = o.keys?.auth
  if (typeof p256dh !== 'string' || !KEY_RE.test(p256dh)) return null
  if (typeof auth !== 'string' || !KEY_RE.test(auth)) return null
  return { endpoint: o.endpoint, keys: { p256dh, auth } }
}
