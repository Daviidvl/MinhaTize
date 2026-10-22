import { createHash, createPrivateKey, sign, type KeyObject } from 'crypto'

// Prova de acesso offline. A cada validação online o servidor assina
// { fp: sha256(token), exp } com ECDSA P-256; o app guarda a prova e, sem
// internet, só entra se a assinatura conferir com a chave pública embutida em
// src/utils/accessProof.ts. Sem a chave privada não dá para fabricar uma prova
// — gravar um token qualquer no localStorage deixa de bastar.
//
// ACCESS_PROOF_PRIVATE_KEY: PKCS8 DER em base64 (ver DEPLOY.md). Trocar a chave
// exige trocar a pública no app; as provas antigas deixam de valer offline
// (online nada muda).

export const PROOF_TTL_MS = 30 * 864e5

let cached: KeyObject | null | undefined

function signingKey(): KeyObject | null {
  if (cached !== undefined) return cached
  const raw = process.env.ACCESS_PROOF_PRIVATE_KEY
  try {
    cached = raw ? createPrivateKey({ key: Buffer.from(raw, 'base64'), format: 'der', type: 'pkcs8' }) : null
  } catch (err) {
    console.error('[accessProof] ACCESS_PROOF_PRIVATE_KEY inválida:', (err as Error).message)
    cached = null
  }
  if (!cached) console.warn('[accessProof] Sem chave de assinatura — o app não terá acesso offline.')
  return cached
}

export function tokenFingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// "<payload base64url>.<assinatura base64url>", ou null sem chave configurada
export function createAccessProof(token: string, now = Date.now()): string | null {
  const key = signingKey()
  if (!key) return null
  const payload = Buffer.from(JSON.stringify({ fp: tokenFingerprint(token), exp: now + PROOF_TTL_MS })).toString('base64url')
  // ieee-p1363 (r||s): o formato que o WebCrypto espera na verificação
  const sig = sign('sha256', Buffer.from(payload), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
  return `${payload}.${sig}`
}
