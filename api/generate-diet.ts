import type { VercelRequest, VercelResponse } from '@vercel/node'

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

  const p = req.body
  if (!p || !p.sex || !p.mealFrequency) {
    return res.status(400).json({ error: 'Perfil inválido.' })
  }

  const mealMap: Record<string, { label: string; sublabel: string }> = {
    'cafe':      { label: 'Café da Manhã',   sublabel: '7h–9h'  },
    'lanche-m':  { label: 'Lanche da Manhã', sublabel: '10h–11h' },
    'almoco':    { label: 'Almoço',           sublabel: '12h–14h' },
    'lanche-t':  { label: 'Lanche da Tarde',  sublabel: '15h–16h' },
    'jantar':    { label: 'Jantar',            sublabel: '19h–21h' },
    'ceia':      { label: 'Ceia',              sublabel: '21h–22h' },
  }

  const freqMeals: Record<string, string[]> = {
    '2':   ['cafe', 'almoco'],
    '3':   ['cafe', 'almoco', 'jantar'],
    '4':   ['cafe', 'almoco', 'lanche-t', 'jantar'],
    '5-6': ['cafe', 'lanche-m', 'almoco', 'lanche-t', 'jantar', 'ceia'],
  }
  const selectedMeals = freqMeals[p.mealFrequency] ?? freqMeals['5-6']

  const kcalShares: Record<string, number> = {
    'cafe':     0.22, 'lanche-m': 0.10, 'almoco':   0.35,
    'lanche-t': 0.12, 'jantar':   0.18, 'ceia':     0.03,
  }

  const restrictionsText = Array.isArray(p.restrictions) && !p.restrictions.includes('none')
    ? `Restrições alimentares: ${p.restrictions.join(', ')}.`
    : 'Sem restrições alimentares.'

  const challengesText = Array.isArray(p.challenges) && !p.challenges.includes('none')
    ? `Desafios: ${p.challenges.join(', ')}.`
    : ''

  const prompt = `Você é nutricionista especializada em emagrecimento com GLP-1 (Tirzepatida). Crie um plano alimentar COMPLETO e PERSONALIZADO em português brasileiro.

PERFIL:
- Sexo: ${p.sex === 'F' ? 'Feminino' : 'Masculino'}
- Peso atual: ${p.weight}kg | Meta: ${p.goalWeight}kg
- Altura: ${p.height}cm | Idade: ${p.age} anos
- Objetivo: ${p.goal === 'lose' ? 'Emagrecimento' : p.goal === 'gain' ? 'Ganho de massa' : 'Manutenção'}
- Fase do protocolo: ${p.protocolPhase === 'beginning' ? 'Início' : p.protocolPhase === 'adaptation' ? 'Adaptação' : 'Manutenção'}
- Calorias diárias: ${p.dailyKcal} kcal
- Frequência de refeições: ${p.mealFrequency} por dia
- ${restrictionsText}
- ${challengesText}

REFEIÇÕES NECESSÁRIAS: ${selectedMeals.map(id => mealMap[id]?.label).join(', ')}

Retorne APENAS JSON válido (sem markdown, sem texto fora do JSON):
{
  "meals": [
    {
      "id": "<id da refeição: ${selectedMeals.join('|')}>",
      "options": [
        { "items": ["alimento 1 com quantidade", "alimento 2 com quantidade"], "protein": "Xg" },
        { "items": [...], "protein": "Xg" },
        { "items": [...], "protein": "Xg" }
      ]
    }
  ],
  "lowHunger": [
    {
      "id": "lh-1",
      "label": "Nome do grupo (ex: Proteína Rápida)",
      "options": [
        { "items": ["opção 1", "opção 2", "opção 3"], "note": "dica opcional" }
      ]
    },
    { "id": "lh-2", "label": "...", "options": [...] },
    { "id": "lh-3", "label": "...", "options": [...] }
  ],
  "lists": [
    { "id": "proteinas", "label": "Proteínas Magras", "items": ["item 1", "item 2", ...8 itens] },
    { "id": "carbs", "label": "Carboidratos Complexos", "items": [...8 itens] },
    { "id": "vegetais", "label": "Legumes e Verduras", "items": [...8 itens] },
    { "id": "gorduras", "label": "Gorduras Boas", "items": [...6 itens] }
  ]
}

Regras:
- Use alimentos brasileiros acessíveis
- Dê 3 opções por refeição (variedade)
- Respeite estritamente as restrições alimentares
- Seja específico com quantidades (ex: "150g frango grelhado", não apenas "frango")
- Para fase início: porções menores, alimentos de fácil digestão
- Para emagrecimento: alta proteína, baixo carboidrato refinado`

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
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      console.error('[generate-diet] Anthropic error:', upstream.status, err)
      return res.status(502).json({ error: 'Erro ao gerar plano alimentar.' })
    }

    const data = await upstream.json() as { content?: { text: string }[] }
    const rawText = data.content?.[0]?.text ?? ''

    let parsed: { meals: unknown[]; lowHunger: unknown[]; lists: unknown[] }
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? rawText)
    } catch {
      console.error('[generate-diet] Failed to parse AI response:', rawText.slice(0, 500))
      return res.status(502).json({ error: 'Resposta inválida da IA.' })
    }

    const mealColors: Record<string, string> = {
      'cafe': '#D97706', 'lanche-m': '#059669', 'almoco': '#2563EB',
      'lanche-t': '#7C3AED', 'jantar': '#DC2626', 'ceia': '#0891B2',
    }

    interface RawMeal { id: string; options: { items: string[]; protein?: string; note?: string }[] }
    interface RawLowHunger { id: string; label: string; options: { items: string[]; note?: string }[] }
    interface RawList { id: string; label: string; items: string[] }

    const meals = (parsed.meals as RawMeal[]).map(m => ({
      id: `ai-${m.id}`,
      label: mealMap[m.id]?.label ?? m.id,
      sublabel: mealMap[m.id]?.sublabel,
      color: mealColors[m.id] ?? '#64748B',
      kcalShare: kcalShares[m.id] ?? (1 / selectedMeals.length),
      options: m.options ?? [],
    }))

    const lowHunger = (parsed.lowHunger as RawLowHunger[]).map(m => ({
      id: `ai-lh-${m.id}`,
      label: m.label,
      color: '#F59E0B',
      kcalShare: 0,
      options: m.options ?? [],
    }))

    const lists = (parsed.lists as RawList[]).map(l => ({
      id: `ai-list-${l.id}`,
      label: l.label,
      items: l.items ?? [],
    }))

    return res.status(200).json({ meals, lowHunger, lists })
  } catch (err) {
    console.error('[generate-diet] Unexpected error:', err)
    return res.status(500).json({ error: 'Erro interno.' })
  }
}
