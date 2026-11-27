import type { VercelRequest, VercelResponse } from '@vercel/node'
import { extractBearerToken, secretsMatch } from './_lib/auth.js'
import { applyBillingEvent, deliverOutboxEmail, fetchDueWork, recordBillingFailure } from './_lib/billing.js'

// Recuperação dos pagamentos. Chamado por um agendador externo a cada poucos
// minutos com `Authorization: Bearer <CRON_SECRET>` (ver DEPLOY.md):
//   1. reprocessa eventos do webhook que falharam (o banco estava fora, etc.);
//   2. envia e-mails de acesso que ficaram na fila (Resend fora, função caiu).
// Tudo é idempotente: rodar duas vezes, ou junto com uma reentrega da Wiven,
// não duplica token nem e-mail.

const BATCH = 20

function authorized(req: VercelRequest): boolean {
  return secretsMatch(extractBearerToken(req), process.env.CRON_SECRET)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
  if (!authorized(req)) return res.status(401).json({ error: 'Não autorizado.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Serviço não configurado.' })
  }

  let work
  try {
    work = await fetchDueWork(BATCH)
  } catch (err) {
    console.error('[billing-cron] Erro ao buscar pendências:', (err as Error)?.message ?? err)
    return res.status(500).json({ error: 'Erro interno.' })
  }

  let reprocessed = 0, eventsFailed = 0
  const emailKeys = new Set(work.emails)

  for (const event of work.events) {
    try {
      const result = await applyBillingEvent(event)
      reprocessed++
      if (result.email_key) emailKeys.add(result.email_key)
    } catch (err) {
      eventsFailed++
      const message = (err as Error)?.message ?? String(err)
      console.error('[billing-cron] Evento continua falhando:', event.event_type, event.transaction_id ?? '(sem id)', '—', message)
      await recordBillingFailure(event, message)
    }
  }

  let sent = 0, emailsFailed = 0
  for (const key of emailKeys) {
    const outcome = await deliverOutboxEmail(key)
    if (outcome === 'sent') sent++
    else if (outcome === 'failed') emailsFailed++
  }

  if (work.stuck.events > 0 || work.stuck.emails > 0) {
    console.error('[billing-cron] Pendências que esgotaram as tentativas e precisam de ação manual:',
      `${work.stuck.events} evento(s), ${work.stuck.emails} e-mail(s) — ver DEPLOY.md`)
  }

  return res.status(200).json({
    events: work.events.length, reprocessed, eventsFailed,
    emails: emailKeys.size, sent, emailsFailed,
    stuck: work.stuck,
  })
}
