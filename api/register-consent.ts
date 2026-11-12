import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCors } from './_lib/cors.js'
import { createRateLimiter } from './_lib/rateLimit.js'
import { extractBearerToken, getClientIp, resolveToken, UUID_RE } from './_lib/auth.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { parseJsonBody } from './_lib/http.js'

const checkRateLimit = createRateLimiter('register-consent', 10, 3_600_000) // máx 10 por hora

// Versão dos termos no formato do app (CONSENT_VERSION em src/utils/consent.ts,
// ex.: "1.1"). Outro texto não vem do app; aceitá-lo deixaria gravar uma linha
// por versão inventada.
const VERSION_RE = /^\d{1,3}(\.\d{1,3}){0,2}$/

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
  const rl = await checkRateLimit(ip)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds))
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em 1 hora.' })
  }

  // ── Payload ───────────────────────────────────────────────────────────────────
  const body = parseJsonBody(req)
  if (!body) return res.status(400).json({ error: 'Payload inválido.' })

  // Sem versão: clientes antigos, que só conheciam a 1.0
  const version = body.version === undefined ? '1.0' : body.version
  if (typeof version !== 'string' || !VERSION_RE.test(version)) {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  // ── Supabase ──────────────────────────────────────────────────────────────────
  // Verificar token válido. O consentimento guarda só o id do acesso, nunca o
  // token: um vazamento desta tabela não entrega credenciais.
  const { status, id: tokenId } = await resolveToken(token)
  // Banco indisponível não é token inválido (mesmo contrato de push e validate-token)
  if (status === 'error') return res.status(503).json({ error: 'Tente novamente.' })
  if (status !== 'active' || !tokenId) {
    return res.status(401).json({ error: 'Token inválido.' })
  }

  const supabase = getSupabaseAdmin()

  // Verificar se já tem consentimento registrado para esta versão
  const { data: existing } = await supabase
    .from('consents')
    .select('id')
    .eq('token_id', tokenId)
    .eq('version', version)
    .maybeSingle()

  if (existing) {
    return res.status(200).json({ success: true, duplicate: true })
  }

  // Registrar consentimento
  const consentIp = getClientIp(req) || null
  const ua = (req.headers['user-agent'] as string) ?? null

  const { error: dbError } = await supabase.from('consents').insert({
    token_id: tokenId,
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
