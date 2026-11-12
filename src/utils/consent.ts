import { getStoredToken } from './token'
import { readJSON, writeJSON, removeKey } from './storage'
import { STORAGE_KEYS, USER_DATA_KEYS } from './storageKeys'

// Consentimento LGPD: guardado no aparelho e registrado no servidor
// (api/register-consent.ts), que grava só o id do acesso, nunca o token.

// 1.1 (out/2026): a Política de Privacidade passou a descrever o registro de IP
// e navegador junto com o aceite, a Loja (imagens e links de afiliado da Shopee)
// e o Upstash. Mudar a versão faz todos os usuários aceitarem os termos de novo.
const CONSENT_VERSION = '1.1'

export interface ConsentRecord {
  date?: string     // ISO 8601
  version?: string
}

export function readConsent(): ConsentRecord | null {
  return readJSON<ConsentRecord | null>(STORAGE_KEYS.consent, null)
}

export function hasConsent(): boolean {
  return readConsent()?.version === CONSENT_VERSION
}

export function saveConsent(): void {
  writeJSON(STORAGE_KEYS.consent, { date: new Date().toISOString(), version: CONSENT_VERSION } satisfies ConsentRecord)
  // Registro no servidor sem bloquear o usuário: o aceite local já vale
  const token = getStoredToken()
  if (token) {
    fetch('/api/register-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ version: CONSENT_VERSION }),
    }).catch(() => {})
  }
}

// Revogação: apaga o aceite e os dados de saúde do aparelho. O acesso (token)
// continua; na próxima abertura os termos são pedidos de novo.
export function revokeConsent(): void {
  [...USER_DATA_KEYS, STORAGE_KEYS.consent].forEach(removeKey)
}
