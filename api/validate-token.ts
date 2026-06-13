import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS para o próprio domínio
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.query.token
  if (!token || typeof token !== 'string' || token.length < 8) {
    return res.status(200).json({ valid: false })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('tokens')
      .select('id')
      .eq('token', token.trim())
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('[validate-token] Supabase error:', error.message)
      return res.status(200).json({ valid: false })
    }

    return res.status(200).json({ valid: !!data })
  } catch (err) {
    console.error('[validate-token] Unexpected error:', err)
    return res.status(200).json({ valid: false })
  }
}
