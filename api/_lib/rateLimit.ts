// ─── Rate limit distribuído (Upstash Redis REST) com fallback em memória ──────
//
// Store:    Upstash Redis, via REST API (fetch nativo — sem SDK adicional, no
//           mesmo estilo do resto do projeto que já usa `https`/`fetch` puro).
// Chave:    `rl:{namespace}:{ip}` — o namespace isola o limite por endpoint
//           (ex.: "generate-report", "webhook") para que o mesmo IP não
//           compartilhe contador entre rotas diferentes.
// Janela:   fixa (fixed window). INCR na chave a cada request; no primeiro
//           hit da janela, EXPIRE é aplicado com a flag NX (só define TTL se
//           a chave ainda não tiver um), o que evita "resetar" a janela a
//           cada nova requisição — isso é feito em um único round-trip via
//           pipeline, então é atômico (sem race condition entre INCR/EXPIRE).
// Limite:   `count <= max` dentro da janela.
// Erros:    se as credenciais Upstash existem mas a chamada falha (rede,
//           serviço fora do ar, etc.), a requisição é NEGADA (fail-closed).
//           Nunca abrimos mão da proteção silenciosamente em caso de erro do
//           store distribuído — isso vale especialmente para endpoints que
//           custam dinheiro por chamada (ex.: generate-report → Anthropic).
// Sem credenciais configuradas (UPSTASH_REDIS_REST_URL/TOKEN ausentes): cai
//           para o limiter em memória por instância — o mesmo comportamento
//           que o projeto já tinha antes desta mudança. Isso preserva o
//           funcionamento atual em vez de derrubar a aplicação inteira até
//           que a infraestrutura Upstash seja provisionada (ver DEPLOY.md).
// Bypass via headers: o IP usado aqui vem de `getClientIp()` (api/_lib/auth.ts),
//           que lê `x-forwarded-for`. Na Vercel esse header é reescrito pela
//           plataforma e IPs externos não são repassados — ou seja, o cliente
//           não consegue forjar esse valor em planos não-Enterprise (confirmado
//           na documentação oficial da Vercel). Não há necessidade de usar
//           `x-real-ip` como alternativa.

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const DISTRIBUTED   = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

if (!DISTRIBUTED) {
  console.warn(
    '[rateLimit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN não configurados — ' +
    'usando rate limiter em memória (por instância serverless, não distribuído). ' +
    'Ver DEPLOY.md para provisionar Upstash Redis.'
  )
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

// ─── Fallback em memória (comportamento anterior, preservado) ─────────────────
function createMemoryLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; reset: number }>()

  return function check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || now > entry.reset) {
      hits.set(key, { count: 1, reset: now + windowMs })
      return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) }
    }
    entry.count++
    return {
      allowed: entry.count <= max,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.reset - now) / 1000)),
    }
  }
}

// ─── Upstash Redis REST — INCR + EXPIRE NX em uma única chamada (pipeline) ────
async function checkUpstash(key: string, max: number, windowSeconds: number): Promise<RateLimitResult> {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(windowSeconds), 'NX'],
    ]),
  })

  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`)

  const results = await res.json() as { result?: number; error?: string }[]
  const incr = results[0]
  if (!incr || typeof incr.result !== 'number') throw new Error('Upstash: resposta inesperada')

  return { allowed: incr.result <= max, retryAfterSeconds: windowSeconds }
}

// ─── API pública ────────────────────────────────────────────────────────────
export function createRateLimiter(namespace: string, max: number, windowMs: number) {
  const windowSeconds   = Math.ceil(windowMs / 1000)
  const memoryFallback  = createMemoryLimiter(max, windowMs)

  return async function checkRateLimit(ip: string): Promise<RateLimitResult> {
    if (!DISTRIBUTED) return memoryFallback(ip)

    const key = `rl:${namespace}:${ip}`
    try {
      return await checkUpstash(key, max, windowSeconds)
    } catch (err) {
      console.error(`[rateLimit] Upstash indisponível (namespace="${namespace}"):`, err)
      // Fail-closed: erro no store distribuído nunca deve remover a proteção.
      return { allowed: false, retryAfterSeconds: windowSeconds }
    }
  }
}
