import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(500).json({ error: 'Serviço não configurado.' })

  let p: Record<string, unknown>
  try {
    p = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!p || !p.sex || !p.mealFrequency) throw new Error()
  } catch {
    return res.status(400).json({ error: 'Perfil inválido.' })
  }

  const freqMeals: Record<string, string[]> = {
    '2': ['cafe', 'almoco'],
    '3': ['cafe', 'almoco', 'jantar'],
    '4': ['cafe', 'almoco', 'lanche-t', 'jantar'],
    '5-6': ['cafe', 'lanche-m', 'almoco', 'lanche-t', 'jantar', 'ceia'],
  }
  const mealLabels: Record<string, string> = {
    'cafe': 'Café da Manhã', 'lanche-m': 'Lanche da Manhã',
    'almoco': 'Almoço', 'lanche-t': 'Lanche da Tarde',
    'jantar': 'Jantar', 'ceia': 'Ceia',
  }
  const mealColors: Record<string, string> = {
    'cafe': '#D97706', 'lanche-m': '#059669', 'almoco': '#2563EB',
    'lanche-t': '#7C3AED', 'jantar': '#DC2626', 'ceia': '#0891B2',
  }
  const kcalShares: Record<string, number> = {
    'cafe': 0.22, 'lanche-m': 0.10, 'almoco': 0.35,
    'lanche-t': 0.12, 'jantar': 0.18, 'ceia': 0.03,
  }

  const selected = freqMeals[p.mealFrequency as string] ?? freqMeals['5-6']
  const restrictions = Array.isArray(p.restrictions) && !(p.restrictions as string[]).includes('none')
    ? (p.restrictions as string[]).join(', ') : 'nenhuma'

  const prompt = `Nutricionista GLP-1. JSON de plano alimentar para:
Sexo:${p.sex} Peso:${p.weight}kg→${p.goalWeight}kg Altura:${p.height}cm Idade:${p.age}a
Objetivo:${p.goal} Fase:${p.protocolPhase} Kcal:${p.dailyKcal} Refeições:${p.mealFrequency}x
Restrições:${restrictions}
Refeições necessárias: ${selected.map(id => mealLabels[id]).join(', ')}

Retorne APENAS JSON válido:
{"meals":[{"id":"cafe","options":[{"items":["150g frango","1 xic arroz integral"],"protein":"35g"},{"items":["2 ovos","pão integral"],"protein":"22g"},{"items":["atum","tapioca"],"protein":"28g"}]},{"id":"almoco",...},...],"lowHunger":[{"id":"lh-1","label":"Proteína Rápida","options":[{"items":["iogurte grego 170g","castanhas 30g"]}]},{"id":"lh-2","label":"Carboidrato Fácil","options":[{"items":["banana","aveia"]}]},{"id":"lh-3","label":"Bebida Nutritiva","options":[{"items":["whey 200ml leite"]}]}],"lists":[{"id":"proteinas","label":"Proteínas Magras","items":["frango","atum","ovo","queijo","iogurte grego","whey"]},{"id":"carbs","label":"Carboidratos","items":["arroz integral","batata doce","aveia","tapioca","pão integral","macarrão integral"]},{"id":"vegetais","label":"Vegetais","items":["brócolis","espinafre","abobrinha","cenoura","tomate","pepino"]}]}

IDs permitidos em meals: ${selected.join(',')}. Gere ${selected.length} meals. Alimentos brasileiros, quantidades específicas.`

  try {
    const body = JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = await post('https://api.anthropic.com/v1/messages', {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }, body)

    if (result.status !== 200) {
      console.error('[generate-diet] Anthropic error:', result.status, result.text.slice(0, 300))
      return res.status(502).json({ error: `Anthropic retornou ${result.status}` })
    }

    let rawText = ''
    try {
      const data = JSON.parse(result.text) as { content?: { text: string }[] }
      rawText = data.content?.[0]?.text ?? ''
    } catch {
      return res.status(502).json({ error: 'Resposta inválida da IA.' })
    }

    let parsed: { meals: { id: string; options: { items: string[]; protein?: string }[] }[]; lowHunger: { id: string; label: string; options: { items: string[]; note?: string }[] }[]; lists: { id: string; label: string; items: string[] }[] }
    try {
      const m = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(m?.[0] ?? rawText)
    } catch {
      console.error('[generate-diet] Parse failed:', rawText.slice(0, 500))
      return res.status(502).json({ error: 'JSON inválido da IA.' })
    }

    const meals = (parsed.meals ?? []).map(m => ({
      id: `ai-${m.id}`,
      label: mealLabels[m.id] ?? m.id,
      sublabel: { cafe: '7h–9h', 'lanche-m': '10h–11h', almoco: '12h–14h', 'lanche-t': '15h–16h', jantar: '19h–21h', ceia: '21h–22h' }[m.id],
      color: mealColors[m.id] ?? '#64748B',
      kcalShare: kcalShares[m.id] ?? (1 / selected.length),
      options: m.options ?? [],
    }))

    const lowHunger = (parsed.lowHunger ?? []).map(m => ({
      id: `ai-lh-${m.id}`,
      label: m.label,
      color: '#F59E0B',
      kcalShare: 0,
      options: m.options ?? [],
    }))

    const lists = (parsed.lists ?? []).map(l => ({
      id: `ai-list-${l.id}`,
      label: l.label,
      items: l.items ?? [],
    }))

    return res.status(200).json({ meals, lowHunger, lists })
  } catch (err) {
    console.error('[generate-diet] Error:', err)
    return res.status(500).json({ error: 'Erro interno.' })
  }
}
