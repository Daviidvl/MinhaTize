import { readRaw, writeRaw, removeKey, readJSON } from './storage'
import { STORAGE_KEYS, USER_DATA_KEYS } from './storageKeys'
import { verifyAccessProof } from './accessProof'

export function getStoredToken(): string | null {
  return readRaw(STORAGE_KEYS.token)
}

export function saveToken(token: string): void {
  writeRaw(STORAGE_KEYS.token, token)
}

export function clearToken(): void {
  removeKey(STORAGE_KEYS.token)
  removeKey(STORAGE_KEYS.accessProof)
}

// Aceita token puro ou URL completa colada pelo usuário
export function extractToken(input: string): string {
  const trimmed = input.trim()
  try {
    const url = new URL(trimmed)
    return url.searchParams.get('token') ?? trimmed
  } catch {
    return trimmed
  }
}

// ─── Dono dos dados locais ────────────────────────────────────────────────────
// Os dados de saúde ficam no aparelho e "Sair" não os apaga (a mesma pessoa
// costuma voltar). Para que outra pessoa, entrando com outro token no mesmo
// aparelho, não veja esses dados, guardamos a impressão digital do token que
// os registrou. Só o hash é salvo — nunca o token.

async function tokenFingerprint(token: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
  }
  // Contexto sem WebCrypto (http não seguro): FNV-1a basta para comparar igualdade
  let h = 0x811c9dc5
  for (let i = 0; i < token.length; i++) h = Math.imul(h ^ token.charCodeAt(i), 0x01000193)
  return 'fnv-' + (h >>> 0).toString(16)
}

// O App grava um perfil vazio (sem nome) assim que abre; isso não conta como dado.
function hasLocalUserData(): boolean {
  return USER_DATA_KEYS.some(key => {
    if (key !== STORAGE_KEYS.profile) return readRaw(key) !== null
    return !!readJSON<{ name?: string } | null>(key, null)?.name
  })
}

// true quando o aparelho guarda dados registrados com OUTRO token
export async function belongsToAnotherToken(token: string): Promise<boolean> {
  const owner = readRaw(STORAGE_KEYS.owner)
  if (!owner || !hasLocalUserData()) return false
  return owner !== await tokenFingerprint(token)
}

// Marca o token como dono dos dados do aparelho. Instalações anteriores a este
// controle não têm dono registrado: o primeiro token validado assume os dados.
export async function claimLocalData(token: string): Promise<void> {
  writeRaw(STORAGE_KEYS.owner, await tokenFingerprint(token))
}

// Apaga os dados de saúde e o consentimento da pessoa anterior
export function wipeLocalUserData(): void {
  [...USER_DATA_KEYS, STORAGE_KEYS.consent, STORAGE_KEYS.owner].forEach(removeKey)
}

// ─── Validação ────────────────────────────────────────────────────────────────
// 'unknown' = não deu para perguntar ao servidor (sem internet, 429, 5xx).
// Não é o mesmo que 'invalid': só uma recusa explícita do servidor encerra a sessão.
export type TokenCheck = 'valid' | 'invalid' | 'unknown'

export async function checkToken(token: string): Promise<TokenCheck> {
  if (!token || token.length < 8) return 'invalid'

  // Dev: aceita qualquer token para facilitar testes locais
  if (import.meta.env.DEV) return 'valid'

  // Prod: valida via API (tokens ficam no servidor — nunca expostos ao browser).
  // O token vai no header, não na URL, para não ficar em logs de acesso.
  try {
    const res = await fetch('/api/validate-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return 'unknown'
    const data = await res.json() as { valid?: unknown; proof?: unknown }
    if (data.valid === true) {
      // Renova a prova que libera o app sem internet (ver hasOfflineAccess)
      if (typeof data.proof === 'string' && data.proof.length < 1000) writeRaw(STORAGE_KEYS.accessProof, data.proof)
      return 'valid'
    }
    if (data.valid === false) return 'invalid'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

// Sem resposta do servidor ('unknown'), o app só entra com a prova assinada
// que o servidor entregou na última validação online deste token — e por até
// 30 dias. Gravar um token qualquer no localStorage não basta.
export async function hasOfflineAccess(token: string): Promise<boolean> {
  const proof = readRaw(STORAGE_KEYS.accessProof)
  return !!proof && verifyAccessProof(proof, token)
}

export async function validateToken(token: string): Promise<boolean> {
  return (await checkToken(token)) === 'valid'
}
