import type { VercelRequest, VercelResponse } from '@vercel/node'

export const ALLOWED_ORIGINS = [
  'https://minhatize.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]

export function setCors(req: VercelRequest, res: VercelResponse, methods: string, allowHeaders?: string) {
  const origin = (req.headers.origin as string) ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', allowed)
  res.setHeader('Access-Control-Allow-Methods', methods)
  if (allowHeaders) res.setHeader('Access-Control-Allow-Headers', allowHeaders)
  res.setHeader('Vary', 'Origin')
}
