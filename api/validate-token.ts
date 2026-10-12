import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCors } from './_lib/cors.js'
import { createRateLimiter } from './_lib/rateLimit.js'
import { getClientIp, extractBearerToken, checkToken, UUID_RE } from './_lib/auth.js'

const checkRateLimit = createRateLimiter('validate-token', 30, 60_000) // máx 30 tentativas por minuto

// Contrato com o app (src/utils/token.ts):
//   200 { valid: true|false } → resposta definitiva sobre o token
//   429 / 503                 → não foi possível verificar; o app mantém a sessão
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res, 'GET,POST,OPTIONS', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = getClientIp(req) || 'unknown'
  const rl = await checkRateLimit(ip)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds))
    return res.status(429).json({ valid: false })
  }

  // ── Validar formato UUID ──────────────────────────────────────────────────
  // POST com Authorization: Bearer é o caminho atual (o token não aparece em
  // URL nem em log de acesso). GET ?token= continua aceito para as versões do
  // app que ainda estão em cache nos aparelhos.
  const raw = req.method === 'POST' ? extractBearerToken(req) : req.query?.token
  if (!raw || typeof raw !== 'string') {
    return res.status(200).json({ valid: false })
  }
  const token = raw.trim()
  if (!UUID_RE.test(token)) {
    return res.status(200).json({ valid: false })
  }

  // ── Consultar Supabase ────────────────────────────────────────────────────
  const status = await checkToken(token)
  if (status === 'error') {
    return res.status(503).json({ valid: false })
  }
  return res.status(200).json({ valid: status === 'active' })
}
