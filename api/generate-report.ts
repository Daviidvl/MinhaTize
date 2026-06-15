import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    console.error('[generate-report] ANTHROPIC_API_KEY not set')
    return res.status(500).json({ error: 'Serviço não configurado.' })
  }

  const payload = req.body
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Você é um assistente educativo de saúde em um app de acompanhamento de tirzepatida. Analise os dados do usuário após 14 dias de plano anti-platô e gere um relatório educativo em português, com linguagem acolhedora e simples.

Dados:
${JSON.stringify(payload, null, 2)}

O relatório deve conter exatamente estes 5 blocos em texto corrido (sem markdown):

1. Resumo dos principais gargalos encontrados
2. Ordem de prioridade de ação com metas práticas e específicas
3. Orientações para os próximos 14 dias
4. Reforço de que platô não é fracasso — é parte do processo
5. Quando buscar acompanhamento médico

Use parágrafos curtos. Não sugira alteração de dose do medicamento.`,
        }],
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      console.error('[generate-report] Anthropic error:', upstream.status, err)
      return res.status(502).json({ error: 'Erro ao gerar relatório.' })
    }

    const data = await upstream.json() as { content?: { text: string }[] }
    const text = data.content?.[0]?.text ?? 'Relatório não disponível.'
    return res.status(200).json({ text })
  } catch (err) {
    console.error('[generate-report] Unexpected error:', err)
    return res.status(500).json({ error: 'Erro interno.' })
  }
}
