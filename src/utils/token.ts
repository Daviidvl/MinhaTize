import { readRaw, writeRaw, removeKey } from './storage'
import { STORAGE_KEYS } from './storageKeys'

export function getStoredToken(): string | null {
  return readRaw(STORAGE_KEYS.token)
}

export function saveToken(token: string): void {
  writeRaw(STORAGE_KEYS.token, token)
}

export function clearToken(): void {
  removeKey(STORAGE_KEYS.token)
}

export function getTokenFromURL(): string | null {
  return new URLSearchParams(window.location.search).get('token')
}

export function cleanTokenFromURL(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  window.history.replaceState({}, '', url.pathname + (url.search !== '?' ? url.search : ''))
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

// ─── Validação ────────────────────────────────────────────────────────────────
export async function validateToken(token: string): Promise<boolean> {
  if (!token || token.length < 8) return false

  // Dev: aceita qualquer token para facilitar testes locais
  if (import.meta.env.DEV) return true

  // Prod: valida via API (tokens ficam no servidor — nunca expostos ao browser)
  try {
    const res = await fetch(`/serveless/validate-token?token=${encodeURIComponent(token)}`)
    if (!res.ok) return false
    const data = await res.json() as { valid: boolean }
    return data.valid === true
  } catch {
    return false
  }
}
