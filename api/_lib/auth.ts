import type { VercelRequest } from '@vercel/node'
import { getSupabaseAdmin } from './supabaseAdmin.js'

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

// Assume que o token já passou pelo UUID_RE — apenas confirma que existe, está
// ativo e (se expires_at estiver preenchido) ainda não expirou.
//
// expires_at é opcional/nullable: tokens sem essa coluna preenchida nunca
// expiram (comportamento idêntico ao anterior a esta mudança). A emissão de
// tokens com expiração automática não está habilitada — é uma decisão de
// produto separada; esta função só passa a respeitar a data quando ela for
// setada manualmente em algum token.
export async function isActiveToken(token: string): Promise<boolean> {
  return (await checkToken(token)) === 'active'
}

// Mesma verificação, mas distinguindo "token recusado" de "não deu para
// consultar o banco" — quem chama decide o que responder em cada caso
// (ex.: validate-token devolve 503 em 'error' para o app não deslogar ninguém
// por causa de uma instabilidade).
export type TokenStatus = 'active' | 'inactive' | 'error'

export async function checkToken(token: string): Promise<TokenStatus> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('tokens')
      .select('id, expires_at')
      .eq('token', token)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('[auth] Erro ao validar token:', error.message)
      return 'error'
    }
    if (!data) return 'inactive'
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return 'inactive'
    return 'active'
  } catch (err) {
    console.error('[auth] Erro inesperado ao validar token:', err)
    return 'error'
  }
}
