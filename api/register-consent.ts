import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCors } from './_lib/cors.js'
import { createRateLimiter } from './_lib/rateLimit.js'
import { extractBearerToken, getClientIp, isActiveToken, UUID_RE } from './_lib/auth.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'


const checkRateLimit = createRateLimiter(10, 3_600_000) // máx 10 por hora

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res, 'POST,OPTIONS', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // ── Autenticação ─────────────────────────────────────────────────────────────
  const token = extractBearerToken(req)
  if (!token || !UUID_RE.test(token)) {
    return res.status(401).json({ error: 'Não autorizado.' })
  }

  // ── Rate limit ────────────────────────────────────────────────────────────────
  const ip = getClientIp(req) || 'unknown'
  if (!checkRateLimit(ip)) {
    res.setHeader('Retry-After', '3600')
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em 1 hora.' })
  }

  // ── Payload ───────────────────────────────────────────────────────────────────
  let body: { version?: unknown }
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!body || typeof body !== 'object') throw new Error()
  } catch {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  const version = typeof body.version === 'string' ? body.version.trim().slice(0, 20) : '1.0'

  // ── Supabase ──────────────────────────────────────────────────────────────────
  // Verificar token válido
  if (!(await isActiveToken(token))) {
    return res.status(401).json({ error: 'Token inválido.' })
  }

  const supabase = getSupabaseAdmin()

  // Verificar se já tem consentimento registrado para esta versão
  const { data: existing } = await supabase
    .from('consents')
    .select('id')
    .eq('token', token)
    .eq('version', version)
    .maybeSingle()

  if (existing) {
    return res.status(200).json({ success: true, duplicate: true })
  }

  // Registrar consentimento
  const consentIp = getClientIp(req) || null
  const ua = (req.headers['user-agent'] as string) ?? null

  const { error: dbError } = await supabase.from('consents').insert({
    token,
    version,
    accepted_at: new Date().toISOString(),
    ip_address:  consentIp,
    user_agent:  ua ? ua.slice(0, 512) : null,
  })

  if (dbError) {
    console.error('[register-consent] DB error:', dbError.message)
    // Não retornamos 500 para não bloquear o usuário — o consentimento local já foi salvo
    return res.status(200).json({ success: true, stored: false })
  }

  return res.status(200).json({ success: true, stored: true })
}
