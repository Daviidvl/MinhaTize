import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCors } from './_lib/cors'
import { createRateLimiter } from './_lib/rateLimit'
import { getClientIp, UUID_RE } from './_lib/auth'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'

const checkRateLimit = createRateLimiter(30, 60_000) // máx 30 tentativas por minuto

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res, 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = getClientIp(req) || 'unknown'
  if (!checkRateLimit(ip)) {
    res.setHeader('Retry-After', '60')
    return res.status(429).json({ valid: false })
  }

  // ── Validar formato UUID ──────────────────────────────────────────────────
  const raw = req.query.token
  if (!raw || typeof raw !== 'string') {
    return res.status(200).json({ valid: false })
  }
  const token = raw.trim()
  if (!UUID_RE.test(token)) {
    return res.status(200).json({ valid: false })
  }

  // ── Consultar Supabase ────────────────────────────────────────────────────
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('tokens')
      .select('id')
      .eq('token', token)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('[validate-token] Supabase error:', error.message)
      return res.status(200).json({ valid: false })
    }

    return res.status(200).json({ valid: !!data })
  } catch (err) {
    console.error('[validate-token] Unexpected error:', err)
    return res.status(200).json({ valid: false })
  }
}
