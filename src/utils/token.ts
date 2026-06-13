const TOKEN_KEY = 'tizetrack_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
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
    const res = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`)
    if (!res.ok) return false
    const data = await res.json() as { valid: boolean }
    return data.valid === true
  } catch {
    return false
  }
}
