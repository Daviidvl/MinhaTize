import { getSupabaseAdmin } from './supabaseAdmin.js'
import { sendAccessEmail } from './accessEmail.js'
import type { BillingEvent } from './wivenEvents.js'

// Pagamentos idempotentes. A regra fica no banco
// (supabase/migrations/20261125_billing_idempotency.sql): cada evento é
// aplicado numa única transação, com UNIQUE no evento, na transação da Wiven e
// no e-mail. Aqui só chamamos essas funções e falamos com o Resend.

export interface ApplyResult {
  outcome:
    | 'token_created' | 'token_exists' | 'already_revoked' | 'revoked'     // compra única e estorno
    | 'subscription_charged' | 'no_period'                                // cobrança de assinatura
    | 'status_changed' | 'status_recorded' | 'stale'                      // status de assinatura
  duplicate: boolean
  token_id?: string
  email_key?: string
  token_active?: boolean
  tokens_revoked?: number
  subscription_id?: string | null
  paid_until?: string | null
}

// Lança em erro de banco: quem chama registra a falha e responde 5xx
export async function applyBillingEvent(event: BillingEvent): Promise<ApplyResult> {
  const { data, error } = await getSupabaseAdmin().rpc('billing_apply_event', { p_event: event })
  if (error) throw new Error(`billing_apply_event: ${error.message}`)
  if (!data || typeof data !== 'object' || typeof (data as ApplyResult).outcome !== 'string') {
    throw new Error('billing_apply_event: resposta inesperada')
  }
  return data as ApplyResult
}

// Guarda o evento como 'failed' para o cron tentar de novo. Nunca lança: é
// chamado num caminho que já está respondendo erro.
export async function recordBillingFailure(event: BillingEvent, message: string): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().rpc('billing_record_failure', {
      p_event: event,
      p_error: message.slice(0, 500),
    })
    if (error) console.error('[billing] Não foi possível registrar a falha:', error.message)
  } catch (err) {
    console.error('[billing] Não foi possível registrar a falha:', err)
  }
}

// sent        → enviado agora
// already_sent→ já tinha sido enviado (reentrega do webhook)
// busy        → outro processo está enviando agora
// canceled    → token revogado/inexistente: nada a enviar
// failed      → o envio falhou; fica na fila para nova tentativa
// exhausted   → esgotou as tentativas; precisa de ação manual
// missing     → não há e-mail com essa chave
export type DeliveryOutcome = 'sent' | 'already_sent' | 'busy' | 'canceled' | 'failed' | 'exhausted' | 'missing'

interface Claim {
  outcome: 'claimed' | 'sent' | 'busy' | 'canceled' | 'exhausted' | 'missing'
  outbox_id?: number
  idempotency_key?: string
  template?: string
  token?: string
  email?: string
  name?: string
}

export async function deliverOutboxEmail(businessKey: string): Promise<DeliveryOutcome> {
  const supabase = getSupabaseAdmin()

  let claim: Claim
  try {
    const { data, error } = await supabase.rpc('email_outbox_claim', { p_business_key: businessKey })
    if (error || !data) {
      console.error('[billing] Não foi possível reservar o e-mail:', error?.message ?? 'resposta vazia')
      return 'failed'
    }
    claim = data as Claim
  } catch (err) {
    console.error('[billing] Não foi possível reservar o e-mail:', err)
    return 'failed'
  }

  if (claim.outcome === 'sent') return 'already_sent'
  if (claim.outcome !== 'claimed') return claim.outcome

  if (claim.template !== 'access_granted' || !claim.token || !claim.email || !claim.idempotency_key || claim.outbox_id == null) {
    await finish(claim.outbox_id, false, null, `reserva incompleta (template ${claim.template ?? '?'})`)
    return 'failed'
  }

  const result = await sendAccessEmail(
    { token: claim.token, email: claim.email, name: claim.name ?? '' },
    claim.idempotency_key,
  )
  if (!result.ok) {
    await finish(claim.outbox_id, false, null, result.error)
    return 'failed'
  }
  // Se só a baixa falhar, a reserva expira em 2 minutos e o cron tenta de novo
  // com a mesma chave — o Resend reconhece e não envia outra vez.
  await finish(claim.outbox_id, true, result.id, null)
  return 'sent'
}

async function finish(id: number | undefined, ok: boolean, providerId: string | null, error: string | null) {
  if (id == null) return
  try {
    const { error: dbError } = await getSupabaseAdmin().rpc('email_outbox_finish', {
      p_id: id, p_ok: ok, p_provider_id: providerId, p_error: error,
    })
    if (dbError) console.error('[billing] Não foi possível dar baixa no e-mail:', dbError.message)
  } catch (err) {
    console.error('[billing] Não foi possível dar baixa no e-mail:', err)
  }
}

export interface DueWork {
  events: BillingEvent[]
  emails: string[]
  stuck: { events: number; emails: number }
}

export async function fetchDueWork(limit: number): Promise<DueWork> {
  const { data, error } = await getSupabaseAdmin().rpc('billing_due_work', { p_limit: limit })
  if (error) throw new Error(`billing_due_work: ${error.message}`)
  const work = (data ?? {}) as Partial<DueWork>
  return {
    events: Array.isArray(work.events) ? work.events : [],
    emails: Array.isArray(work.emails) ? work.emails : [],
    stuck: {
      events: Number(work.stuck?.events ?? 0),
      emails: Number(work.stuck?.emails ?? 0),
    },
  }
}
