import type { VercelRequest } from '@vercel/node'

// Corpo JSON como objeto. A Vercel já entrega o corpo parseado quando o
// Content-Type é JSON, mas aceita também texto cru. null = ausente, malformado,
// array ou valor primitivo — quem chama responde 400.
export function parseJsonBody(req: VercelRequest): Record<string, unknown> | null {
  try {
    const b: unknown = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    return b && typeof b === 'object' && !Array.isArray(b) ? b as Record<string, unknown> : null
  } catch {
    return null
  }
}
