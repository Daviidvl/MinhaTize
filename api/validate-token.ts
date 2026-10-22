import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCors } from './_lib/cors.js'
import { createRateLimiter } from './_lib/rateLimit.js'
import { getClientIp, extractBearerToken, checkToken, UUID_RE } from './_lib/auth.js'
import { createAccessProof } from './_lib/accessProof.js'

const checkRateLimit = createRateLimiter('validate-token', 30, 60_000) // máx 30 tentativas por minuto

// Contrato com o app (src/utils/token.ts):
//   200 { valid: true, proof? } → token ativo; `proof` libera o app offline por 30 dias
//   200 { valid: false }        → token recusado
//   429 / 503                   → não foi possível verificar; o app mantém a sessão
//                                 só se tiver uma prova válida
//
// Só POST com Authorization: Bearer — o token nunca vai na URL, onde ficaria
// em logs de acesso e no histórico. (O GET ?token= das versões antigas foi
// removido; elas recebem 405, tratam como "não deu para verificar" e não
// deslogam ninguém.)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res, 'POST,OPTIONS', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = getClientIp(req) || 'unknown'
  const rl = await checkRateLimit(ip)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds))
    return res.status(429).json({ valid: false })
  }

  // ── Validar formato UUID ──────────────────────────────────────────────────
  const token = extractBearerToken(req)
  if (!token || !UUID_RE.test(token)) {
    return res.status(200).json({ valid: false })
  }

  // ── Consultar Supabase ────────────────────────────────────────────────────
  const status = await checkToken(token)
  if (status === 'error') {
    return res.status(503).json({ valid: false })
  }
  if (status !== 'active') return res.status(200).json({ valid: false })

  // A resposta carrega uma credencial: não pode ficar em cache intermediário
  res.setHeader('Cache-Control', 'no-store')
  const proof = createAccessProof(token)
  return res.status(200).json(proof ? { valid: true, proof } : { valid: true })
}
