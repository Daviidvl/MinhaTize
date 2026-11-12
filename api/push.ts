import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCors } from './_lib/cors.js'
import { createRateLimiter } from './_lib/rateLimit.js'
import { extractBearerToken, getClientIp, resolveToken, UUID_RE } from './_lib/auth.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { getVapidPublicKey } from './_lib/webPush.js'
import { sanitizeSchedule, sanitizeSubscription, nextAt } from './_lib/pushSchedule.js'
import { parseJsonBody } from './_lib/http.js'

// Inscrição de push de um aparelho.
//   GET    → chave pública VAPID (o app precisa dela para se inscrever)
//   POST   → { subscription, schedule } cria/atualiza a inscrição e a agenda
//   DELETE → { endpoint } remove a inscrição (notificações desligadas ou logout)

const checkRateLimit = createRateLimiter('push', 60, 3_600_000) // máx 60 por hora por IP

// Aparelhos por acesso. Cada linha guarda até ~150 KB de agenda: sem teto, um
// token gravaria inscrições sem fim com endpoints inventados e lotaria o banco.
// Saem as mais antigas — quem troca de celular não percebe.
const MAX_DEVICES_PER_TOKEN = 10

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

  const body = parseJsonBody(req)
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

  // Mantém só os aparelhos mais recentes deste acesso. Falha aqui não desfaz a
  // inscrição: a limpeza roda de novo na próxima sincronização.
  const { data: excess, error: excessError } = await supabase.from('push_subscriptions')
    .select('id')
    .eq('token_id', tokenId)
    .order('updated_at', { ascending: false })
    .range(MAX_DEVICES_PER_TOKEN, MAX_DEVICES_PER_TOKEN + 99)
  if (excessError) {
    console.error('[push] Erro ao conferir aparelhos do acesso:', excessError.message)
  } else if (excess?.length) {
    const { error: pruneError } = await supabase.from('push_subscriptions').delete()
      .in('id', excess.map(r => r.id))
    if (pruneError) console.error('[push] Erro ao remover aparelhos antigos:', pruneError.message)
  }

  return res.status(200).json({ success: true, scheduled: schedule.length })
}
