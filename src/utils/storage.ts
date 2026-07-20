// Acesso a localStorage com tratamento de erro centralizado — o app roda em
// modo privado/quota excedida sem quebrar, apenas perdendo persistência.

function warn(action: string, key: string, err: unknown) {
  console.warn(`[storage] Falha ao ${action} "${key}":`, err)
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    warn('ler', key, err)
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    warn('gravar', key, err)
    return false
  }
}

export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    warn('ler', key, err)
    return null
  }
}

export function writeRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    warn('gravar', key, err)
    return false
  }
}

export function removeKey(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (err) {
    warn('remover', key, err)
    return false
  }
}
