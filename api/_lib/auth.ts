import type { VercelRequest } from '@vercel/node'
import { createHash, timingSafeEqual } from 'crypto'
import { getSupabaseAdmin } from './supabaseAdmin.js'

// UUID v4
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Compara um segredo recebido com o esperado em tempo constante. Compara os
// SHA-256 (sempre 32 bytes): não revela o tamanho do segredo e não lança erro —
// timingSafeEqual exige buffers do mesmo tamanho, e um texto com acento tem
// mais bytes que caracteres. Sem segredo configurado, nada confere.
export function secretsMatch(given: unknown, expected: string | undefined): boolean {
  if (!expected || typeof given !== 'string' || !given) return false
  const digest = (s: string) => createHash('sha256').update(s, 'utf8').digest()
  return timingSafeEqual(digest(given), digest(expected))
}

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
//   active   → acesso valendo
//   expired  → assinatura vencida (o app oferece a renovação; não é "token inválido")
//   inactive → token inexistente, revogado ou (compra antiga) expirado à mão
//   error    → não deu para consultar
export type TokenStatus = 'active' | 'inactive' | 'expired' | 'error'

// O que o app mostra no Perfil ("Plano", "Válido até")
export interface AccessInfo {
  type: 'legacy_purchase' | 'subscription'
  plan: string | null
  paidUntil: string | null   // fim do período pago
  expiresAt: string | null   // fim do acesso (nulo = vitalício)
}

// As colunas vêm de migrations aplicadas à mão. Se o código for publicado
// antes delas, o Postgres responde 42703 (undefined_column) e, sem este
// tratamento, NENHUM token validaria. A consulta desce um degrau por vez:
//   1. com as colunas de assinatura (20261127_subscriptions.sql)
//   2. só com expires_at (20260901_add_token_expiration.sql)
//   3. só o id — sem expiração a respeitar
// Sem as colunas de assinatura não existe assinatura (a emissão grava nelas),
// então todo token é compra antiga.
const COLUMN_LEVELS = [
  'id, expires_at, access_type, plan, paid_until',
  'id, expires_at',
  'id',
] as const
const LEVEL_MIGRATION = ['20261127_subscriptions.sql', '20260901_add_token_expiration.sql']

const UNDEFINED_COLUMN = '42703'

export function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === UNDEFINED_COLUMN || /column .*does not exist/i.test(error.message ?? ''))
}

// Erro do Supabase/PostgREST para "coluna tokens.expires_at não existe"
export function isMissingExpiresAt(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === UNDEFINED_COLUMN || /expires_at.*does not exist/i.test(error.message ?? ''))
}
// Depois de detectar a ausência, evita a consulta que falha por alguns minutos
// e então tenta de novo — assim a migration passa a valer sem precisar de deploy.
const MISSING_COLUMN_RECHECK_MS = 5 * 60_000
let fallbackLevel = 0
let fallbackUntil = 0

type TokenRow = {
  id: unknown
  expires_at?: string | null
  access_type?: string | null
  plan?: string | null
  paid_until?: string | null
}

async function findActiveToken(token: string, columns: string) {
  return getSupabaseAdmin()
    .from('tokens')
    .select(columns)
    .eq('token', token)
    .eq('active', true)
    .maybeSingle<TokenRow>()
}

export async function checkToken(token: string): Promise<TokenStatus> {
  return (await resolveToken(token)).status
}

// Como checkToken, mas devolve também o id do token (tokens.id, em texto) —
// para gravar referências ao acesso sem copiar o token em outras tabelas — e
// o tipo de acesso.
export async function resolveToken(token: string): Promise<{ status: TokenStatus; id: string | null; access?: AccessInfo }> {
  const found = await lookupToken(token)
  return typeof found === 'string' ? { status: found, id: null } : found
}

async function lookupToken(token: string): Promise<'inactive' | 'error' | { status: 'active' | 'expired'; id: string; access: AccessInfo }> {
  try {
    let level = Date.now() < fallbackUntil ? fallbackLevel : 0
    let { data, error } = await findActiveToken(token, COLUMN_LEVELS[level])

    while (isMissingColumn(error) && level < COLUMN_LEVELS.length - 1) {
      console.warn(`[auth] Colunas de tokens ausentes — validando sem elas. Rode supabase/migrations/${LEVEL_MIGRATION[level]}.`)
      level++
      fallbackLevel = level
      fallbackUntil = Date.now() + MISSING_COLUMN_RECHECK_MS
      ;({ data, error } = await findActiveToken(token, COLUMN_LEVELS[level]))
    }

    if (error) {
      console.error('[auth] Erro ao validar token:', error.message)
      return 'error'
    }
    if (!data) return 'inactive'

    const access: AccessInfo = {
      type: data.access_type === 'subscription' ? 'subscription' : 'legacy_purchase',
      plan: data.plan ?? null,
      paidUntil: data.paid_until ?? null,
      expiresAt: data.expires_at ?? null,
    }
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
      // Assinatura vencida tem saída (renovar); compra antiga expirada à mão não
      return access.type === 'subscription' ? { status: 'expired', id: String(data.id), access } : 'inactive'
    }
    return { status: 'active', id: String(data.id), access }
  } catch (err) {
    console.error('[auth] Erro inesperado ao validar token:', err)
    return 'error'
  }
}
