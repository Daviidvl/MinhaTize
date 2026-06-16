import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import https from 'https'

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://minhatize.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers.origin as string) ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', allowed)
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Vary', 'Origin')
}

// ─── UUID v4 ──────────────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ─── Rate limit por IP (em memória, por instância) ────────────────────────────
const rlMap = new Map<string, { count: number; reset: number }>()
const RL_MAX = 5         // máx 5 relatórios por janela
const RL_WINDOW = 3_600_000 // janela de 1 hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rlMap.get(ip)
  if (!entry || now > entry.reset) {
    rlMap.set(ip, { count: 1, reset: now + RL_WINDOW })
    return true
  }
  if (entry.count >= RL_MAX) return false
  entry.count++
  return true
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function post(url: string, headers: Record<string, string>, body: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => resolve({ status: res.statusCode ?? 0, text: data }))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // ── 1. Autenticação: requer token válido no header Authorization ─────────
  const authHeader = (req.headers.authorization as string) ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token || !UUID_RE.test(token)) {
    return res.status(401).json({ error: 'Não autorizado.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Serviço não configurado.' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: tokenRow } = await supabase
    .from('tokens')
    .select('id')
    .eq('token', token)
    .eq('active', true)
    .maybeSingle()

  if (!tokenRow) {
    return res.status(401).json({ error: 'Token inválido.' })
  }

  // ── 2. Rate limit por IP ──────────────────────────────────────────────────
  const ip = (req.headers['x-forwarded-for'] as string ?? '').split(',')[0].trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    res.setHeader('Retry-After', '3600')
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em 1 hora.' })
  }

  // ── 3. Chave da API Anthropic ─────────────────────────────────────────────
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(500).json({ error: 'Serviço não configurado.' })

  // ── 4. Validar e limitar tamanho do payload ───────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error()
  } catch {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  const payloadStr = JSON.stringify(payload)
  if (payloadStr.length > 4_000) {
    return res.status(400).json({ error: 'Payload muito grande.' })
  }

  // ── 5. Gerar relatório via Anthropic ──────────────────────────────────────
  const prompt = `Você é um assistente educativo de saúde em um app de acompanhamento de tirzepatida. Analise os dados do usuário após 14 dias de plano anti-platô e gere um relatório educativo em português, com linguagem acolhedora e simples.

Dados:
${payloadStr}

O relatório deve conter exatamente estes 5 blocos em texto corrido (sem markdown):
1. Resumo dos principais gargalos encontrados
2. Ordem de prioridade de ação com metas práticas e específicas
3. Orientações para os próximos 14 dias
4. Reforço de que platô não é fracasso — é parte do processo
5. Quando buscar acompanhamento médico

Use parágrafos curtos. Não sugira alteração de dose do medicamento.`

  try {
    const body = JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = await post('https://api.anthropic.com/v1/messages', {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }, body)

    if (result.status !== 200) {
      console.error('[generate-report] Anthropic error:', result.status, result.text.slice(0, 300))
      return res.status(502).json({ error: `Erro ao gerar relatório.` })
    }

    const data = JSON.parse(result.text) as { content?: { text: string }[] }
    const text = data.content?.[0]?.text ?? 'Relatório não disponível.'
    return res.status(200).json({ text })
  } catch (err) {
    console.error('[generate-report] Error:', err)
    return res.status(500).json({ error: 'Erro interno.' })
  }
}
