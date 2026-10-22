import type { VercelRequest, VercelResponse } from '@vercel/node'
import { timingSafeEqual } from 'crypto'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { configureWebPush, webpush } from './_lib/webPush.js'
import { type PushItem, nextAt } from './_lib/pushSchedule.js'

// Disparo das notificações agendadas. Chamado por um agendador externo a cada
// poucos minutos com `Authorization: Bearer <CRON_SECRET>` (ver DEPLOY.md).

const BATCH = 200
// Aviso que perdeu a hora por mais que isso (agendador parado, aparelho sem
// rede) é descartado em vez de chegar fora de contexto.
const STALE_MS = 3 * 3_600_000
// Quanto tempo o serviço de push guarda o aviso se o celular estiver offline
const TTL_SECONDS = 3 * 3600
const CONCURRENCY = 20

interface Row {
  id: number
  endpoint: string
  p256dh: string
  auth: string
  token_id: string
  schedule: PushItem[] | null
  updated_at: string
}

function authorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = (req.headers.authorization as string) ?? ''
  const given  = Buffer.from(header.startsWith('Bearer ') ? header.slice(7).trim() : '')
  const want   = Buffer.from(secret)
  return given.length === want.length && timingSafeEqual(given, want)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
  if (!authorized(req)) return res.status(401).json({ error: 'Não autorizado.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !configureWebPush()) {
    return res.status(500).json({ error: 'Serviço não configurado.' })
  }

  const supabase = getSupabaseAdmin()
  const now = Date.now()

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, token_id, schedule, updated_at')
    .lte('next_at', new Date(now).toISOString())
    .order('next_at', { ascending: true })
    .limit(BATCH)
  if (error) {
    console.error('[push-cron] Erro ao buscar inscrições:', error.message)
    return res.status(500).json({ error: 'Erro interno.' })
  }
  const rows = (data ?? []) as Row[]
  if (rows.length === 0) return res.status(200).json({ processed: 0, sent: 0 })

  // Acesso revogado (reembolso, token desativado) não recebe mais avisos
  const tokenIds = [...new Set(rows.map(r => r.token_id))]
  const { data: tokens, error: tokErr } = await supabase
    .from('tokens').select('id, active, expires_at').in('id', tokenIds)
  if (tokErr) {
    console.error('[push-cron] Erro ao conferir tokens:', tokErr.message)
    return res.status(500).json({ error: 'Erro interno.' })
  }
  const activeIds = new Set(
    (tokens ?? [])
      .filter((t: { active: boolean; expires_at?: string | null }) =>
        t.active && !(t.expires_at && new Date(t.expires_at).getTime() <= now))
      .map((t: { id: unknown }) => String(t.id)),
  )

  let sent = 0, removed = 0

  async function processRow(row: Row) {
    if (!activeIds.has(String(row.token_id))) {
      await supabase.from('push_subscriptions').delete().eq('id', row.id)
      removed++
      return
    }

    const schedule = row.schedule ?? []
    const due      = schedule.filter(i => Date.parse(i.at) <= now)
    const rest     = schedule.filter(i => Date.parse(i.at) > now)
    const fresh    = due.filter(i => now - Date.parse(i.at) <= STALE_MS)

    let gone = false
    for (const item of fresh) {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          JSON.stringify({ title: item.title, body: item.body, url: item.url, tag: item.id }),
          { TTL: TTL_SECONDS, urgency: 'normal' },
        )
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410: o aparelho cancelou a inscrição (app desinstalado, permissão retirada)
        if (status === 404 || status === 410) { gone = true; break }
        console.error('[push-cron] Falha no envio:', status ?? err)
      }
    }

    if (gone) {
      await supabase.from('push_subscriptions').delete().eq('id', row.id)
      removed++
    } else {
      // Se o app reenviou a agenda enquanto este disparo rodava, a versão dele vale
      await supabase.from('push_subscriptions')
        .update({ schedule: rest, next_at: nextAt(rest) })
        .eq('id', row.id)
        .eq('updated_at', row.updated_at)
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.all(rows.slice(i, i + CONCURRENCY).map(processRow))
  }

  return res.status(200).json({ processed: rows.length, sent, removed })
}
