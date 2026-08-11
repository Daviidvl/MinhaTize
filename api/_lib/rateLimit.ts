// ─── Rate limit por IP (em memória, por instância da função serverless) ───────
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; reset: number }>()

  return function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = hits.get(ip)
    if (!entry || now > entry.reset) {
      hits.set(ip, { count: 1, reset: now + windowMs })
      return true
    }
    if (entry.count >= max) return false
    entry.count++
    return true
  }
}
