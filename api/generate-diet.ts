import type { VercelRequest, VercelResponse } from '@vercel/node'

interface RawMeal      { id: string; options: { items: string[]; protein?: string }[] }
interface RawLowHunger { id: string; label: string; options: { items: string[]; note?: string }[] }
interface RawList      { id: string; label: string; items: string[] }

const MEAL_META: Record<string, { label: string; sublabel: string; color: string; kcalShare: number }> = {
  'cafe':     { label: 'Café da Manhã',   sublabel: '7h–9h',   color: '#D97706', kcalShare: 0.22 },
  'lanche-m': { label: 'Lanche da Manhã', sublabel: '10h–11h', color: '#059669', kcalShare: 0.10 },
  'almoco':   { label: 'Almoço',          sublabel: '12h–14h', color: '#2563EB', kcalShare: 0.35 },
  'lanche-t': { label: 'Lanche da Tarde', sublabel: '15h–16h', color: '#7C3AED', kcalShare: 0.12 },
  'jantar':   { label: 'Jantar',          sublabel: '19h–21h', color: '#DC2626', kcalShare: 0.18 },
  'ceia':     { label: 'Ceia',            sublabel: '21h–22h', color: '#0891B2', kcalShare: 0.03 },
}

const FREQ_MEALS: Record<string, string[]> = {
  '2':   ['cafe', 'almoco'],
  '3':   ['cafe', 'almoco', 'jantar'],
  '4':   ['cafe', 'almoco', 'lanche-t', 'jantar'],
  '5-6': ['cafe', 'lanche-m', 'almoco', 'lanche-t', 'jantar', 'ceia'],
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    console.error('[generate-diet] ANTHROPIC_API_KEY not set')
    return res.status(500).json({ error: 'Serviço não configurado.' })
  }

  // Body parsing — Vercel parses JSON automatically, but guard against string body
  let p: Record<string, unknown>
  try {
    p = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  if (!p?.sex || !p?.mealFrequency) {
    return res.status(400).json({ error: 'Perfil inválido.' })
  }

  const selectedMeals = FREQ_MEALS[p.mealFrequency as string] ?? FREQ_MEALS['5-6']
  const mealNames = selectedMeals.map(id => MEAL_META[id]?.label).join(', ')

  const restrictions = Array.isArray(p.restrictions) && !(p.restrictions as string[]).includes('none')
    ? (p.restrictions as string[]).join(', ')
    : 'nenhuma'

  const prompt = `Nutricionista de GLP-1. Crie plano alimentar em JSON para:
Sexo: ${p.sex === 'F' ? 'F' : 'M'} | Peso: ${p.weight}kg→${p.goalWeight}kg | Altura: ${p.height}cm | Idade: ${p.age}a
Objetivo: ${p.goal} | Fase: ${p.protocolPhase} | Kcal/dia: ${p.dailyKcal} | Refeições: ${p.mealFrequency}x
Restrições: ${restrictions}

Refeições: ${mealNames}

Retorne SOMENTE JSON (sem markdown):
{"meals":[{"id":"cafe","options":[{"items":["qtd alimento","qtd alimento"],"protein":"Xg"},{"items":[...],"protein":"Xg"},{"items":[...],"protein":"Xg"}]}],"lowHunger":[{"id":"lh-1","label":"Proteína Rápida","options":[{"items":["opção 1","opção 2","opção 3"]}]},{"id":"lh-2","label":"Carboidrato Fácil","options":[{"items":["opção 1","opção 2"]}]},{"id":"lh-3","label":"Líquidos Nutritivos","options":[{"items":["opção 1","opção 2"]}]}],"lists":[{"id":"proteinas","label":"Proteínas Magras","items":["item1","item2","item3","item4","item5","item6"]},{"id":"carbs","label":"Carboidratos Complexos","items":["item1","item2","item3","item4","item5","item6"]},{"id":"vegetais","label":"Legumes e Verduras","items":["item1","item2","item3","item4","item5","item6"]}]}

Regras: alimentos brasileiros, quantidades específicas, respeitar restrições, ${p.protocolPhase === 'beginning' ? 'porções menores e digestão fácil' : 'alta proteína e baixo carboidrato refinado'}.
IDs permitidos para meals: ${selectedMeals.join(',')}. Gere exatamente ${selectedMeals.length} refeição(ões).`

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      console.error('[generate-diet] Anthropic error:', upstream.status, errText)
      return res.status(502).json({ error: 'Erro ao gerar plano alimentar.' })
    }

    const data = await upstream.json() as { content?: { text: string }[] }
    const rawText = data.content?.[0]?.text ?? ''

    let parsed: { meals: RawMeal[]; lowHunger: RawLowHunger[]; lists: RawList[] }
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? rawText)
    } catch {
      console.error('[generate-diet] Parse failed. Raw:', rawText.slice(0, 800))
      return res.status(502).json({ error: 'Resposta inválida da IA.' })
    }

    const meals = (parsed.meals ?? []).map((m: RawMeal) => ({
      id: `ai-${m.id}`,
      label:     MEAL_META[m.id]?.label    ?? m.id,
      sublabel:  MEAL_META[m.id]?.sublabel,
      color:     MEAL_META[m.id]?.color    ?? '#64748B',
      kcalShare: MEAL_META[m.id]?.kcalShare ?? (1 / selectedMeals.length),
      options:   m.options ?? [],
    }))

    const lowHunger = (parsed.lowHunger ?? []).map((m: RawLowHunger) => ({
      id:        `ai-lh-${m.id}`,
      label:     m.label,
      color:     '#F59E0B',
      kcalShare: 0,
      options:   m.options ?? [],
    }))

    const lists = (parsed.lists ?? []).map((l: RawList) => ({
      id:    `ai-list-${l.id}`,
      label: l.label,
      items: l.items ?? [],
    }))

    return res.status(200).json({ meals, lowHunger, lists })
  } catch (err) {
    console.error('[generate-diet] Unexpected error:', err)
    return res.status(500).json({ error: 'Erro interno.' })
  }
}
