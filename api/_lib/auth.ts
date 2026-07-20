import type { VercelRequest } from '@vercel/node'
import { getSupabaseAdmin } from './supabaseAdmin'

// UUID v4
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Primeiro IP da cadeia x-forwarded-for, sem valor padrão — cada chamador decide o fallback
export function getClientIp(req: VercelRequest): string {
  return (req.headers['x-forwarded-for'] as string ?? '').split(',')[0].trim()
}

export function extractBearerToken(req: VercelRequest): string {
  const authHeader = (req.headers.authorization as string) ?? ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

// Assume que o token já passou pelo UUID_RE — apenas confirma que existe e está ativo
export async function isActiveToken(token: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('tokens')
    .select('id')
    .eq('token', token)
    .eq('active', true)
    .maybeSingle()
  return !!data
}
