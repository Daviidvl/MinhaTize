import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCors } from './_lib/cors.js'
import { createRateLimiter } from './_lib/rateLimit.js'
import { extractBearerToken, getClientIp, resolveToken, UUID_RE } from './_lib/auth.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { getVapidPublicKey } from './_lib/webPush.js'
import { sanitizeSchedule, sanitizeSubscription, nextAt } from './_lib/pushSchedule.js'

// Inscrição de push de um aparelho.
//   GET    → chave pública VAPID (o app precisa dela para se inscrever)
//   POST   → { subscription, schedule } cria/atualiza a inscrição e a agenda
//   DELETE → { endpoint } remove a inscrição (notificações desligadas ou logout)

const checkRateLimit = createRateLimiter('push', 60, 3_600_000) // máx 60 por hora por IP

function parseBody(req: VercelRequest): Record<string, unknown> | null {
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    return b && typeof b === 'object' && !Array.isArray(b) ? b : null
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res, 'GET,POST,DELETE,OPTIONS', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const publicKey = getVapidPublicKey()
    if (!publicKey) return res.status(503).json({ error: 'Notificações não configuradas.' })
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).json({ publicKey })
  }
  if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).end()

  // ── Autenticação ──────────────────────────────────────────────────────────
  const token = extractBearerToken(req)
  if (!token || !UUID_RE.test(token)) return res.status(401).json({ error: 'Não autorizado.' })

  const ip = getClientIp(req) || 'unknown'
  const rl = await checkRateLimit(ip)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds))
    return res.status(429).json({ error: 'Muitas requisições.' })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Serviço não configurado.' })
  }

  const body = parseBody(req)
  if (!body) return res.status(400).json({ error: 'Payload inválido.' })
  if (JSON.stringify(body).length > 150_000) return res.status(400).json({ error: 'Payload muito grande.' })

  const { status, id: tokenId } = await resolveToken(token)
  if (status === 'error') return res.status(503).json({ error: 'Tente novamente.' })
  if (status !== 'active' || !tokenId) return res.status(401).json({ error: 'Token inválido.' })

  const supabase = getSupabaseAdmin()

  // ── Remover ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint.slice(0, 1000) : ''
    if (!endpoint) return res.status(400).json({ error: 'Payload inválido.' })
    const { error } = await supabase.from('push_subscriptions').delete()
      .eq('endpoint', endpoint).eq('token_id', tokenId)
    if (error) {
      console.error('[push] Erro ao remover inscrição:', error.message)
      return res.status(500).json({ error: 'Erro interno.' })
    }
    return res.status(200).json({ success: true })
  }

  // ── Criar / atualizar ─────────────────────────────────────────────────────
  const subscription = sanitizeSubscription(body.subscription)
  const schedule     = sanitizeSchedule(body.schedule)
  if (!subscription || !schedule) return res.status(400).json({ error: 'Payload inválido.' })

  const ua = (req.headers['user-agent'] as string) ?? null
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint:   subscription.endpoint,
    p256dh:     subscription.keys.p256dh,
    auth:       subscription.keys.auth,
    token_id:   tokenId,
    schedule,
    next_at:    nextAt(schedule),
    user_agent: ua ? ua.slice(0, 300) : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('[push] Erro ao salvar inscrição:', error.message)
    return res.status(500).json({ error: 'Erro interno.' })
  }
  return res.status(200).json({ success: true, scheduled: schedule.length })
}
