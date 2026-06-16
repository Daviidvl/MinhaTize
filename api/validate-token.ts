import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://minhatize.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers.origin as string) ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', allowed)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Vary', 'Origin')
}

// ─── Rate limit por IP (brute-force protection) ───────────────────────────────
const rlMap = new Map<string, { count: number; reset: number }>()
const RL_MAX    = 30         // máx 30 tentativas
const RL_WINDOW = 60_000     // por minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rlMap.get(ip)
  if (!entry || now > entry.reset) {
    rlMap.set(ip, { count: 1, reset: now + RL_WINDOW })
    return true
  }
  if (entry.count >= RL_MAX) return false
  entry.count++
  return true
}

// UUID v4 regex
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = (req.headers['x-forwarded-for'] as string ?? '').split(',')[0].trim() || 'unknown'
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
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
