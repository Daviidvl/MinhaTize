import type { VercelRequest, VercelResponse } from '@vercel/node'

// localhost só entra fora de produção (preview da Vercel e `vercel dev`)
const DEV_ORIGINS = process.env.VERCEL_ENV === 'production'
  ? []
  : ['http://localhost:3000', 'http://localhost:5173']

export const ALLOWED_ORIGINS = ['https://minhatize.vercel.app', ...DEV_ORIGINS]

export function setCors(req: VercelRequest, res: VercelResponse, methods: string, allowHeaders?: string) {
  const origin = (req.headers.origin as string) ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', allowed)
  res.setHeader('Access-Control-Allow-Methods', methods)
  if (allowHeaders) res.setHeader('Access-Control-Allow-Headers', allowHeaders)
  res.setHeader('Vary', 'Origin')
}
