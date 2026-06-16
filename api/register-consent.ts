import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/*
  Supabase SQL para criar a tabela (execute uma vez no SQL Editor do Supabase):

  create table if not exists consents (
    id          uuid default gen_random_uuid() primary key,
    token       text not null,
    version     text not null default '1.0',
    accepted_at timestamptz not null default now(),
    ip_address  text,
    user_agent  text
  );
  create index if not exists consents_token_idx on consents(token);
*/

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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Vary', 'Origin')
}

// UUID v4 validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ─── Rate limit por IP ────────────────────────────────────────────────────────
const rlMap = new Map<string, { count: number; reset: number }>()
const RL_MAX = 10
const RL_WINDOW = 3_600_000 // 1 hora

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // ── Autenticação ─────────────────────────────────────────────────────────────
  const authHeader = (req.headers.authorization as string) ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (!token || !UUID_RE.test(token)) {
    return res.status(401).json({ error: 'Não autorizado.' })
  }

  // ── Rate limit ────────────────────────────────────────────────────────────────
  const ip = (req.headers['x-forwarded-for'] as string ?? '').split(',')[0].trim() || 'unknown'
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
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar token válido
  const { data: tokenRow } = await supabase
    .from('tokens')
    .select('id')
    .eq('token', token)
    .eq('active', true)
    .maybeSingle()

  if (!tokenRow) {
    return res.status(401).json({ error: 'Token inválido.' })
  }

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
  const ip = (req.headers['x-forwarded-for'] as string ?? '').split(',')[0].trim() || null
  const ua = (req.headers['user-agent'] as string) ?? null

  const { error: dbError } = await supabase.from('consents').insert({
    token,
    version,
    accepted_at: new Date().toISOString(),
    ip_address:  ip,
    user_agent:  ua ? ua.slice(0, 512) : null,
  })

  if (dbError) {
    console.error('[register-consent] DB error:', dbError.message)
    // Não retornamos 500 para não bloquear o usuário — o consentimento local já foi salvo
    return res.status(200).json({ success: true, stored: false })
  }

  return res.status(200).json({ success: true, stored: true })
}
