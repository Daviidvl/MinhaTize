import { randomUUID } from 'crypto'

// Imitação em memória das funções de supabase/migrations/20261125_billing_idempotency.sql,
// para testar a orquestração do webhook e do cron (respostas HTTP, envio de
// e-mail). A regra de verdade é testada contra um Postgres real em
// supabase/tests/run-billing-tests.sh — mudou a regra no SQL, mude aqui também.

type Json = Record<string, unknown>

export interface FakeToken { id: string; token: string; email: string; name: string; order_id: string | null; active: boolean }
export interface FakeOutbox { id: number; key: string; token_id: string; status: string; attempts: number; idempotency_key: string; provider_id?: string | null }

export function createFakeBillingDb() {
  const events = new Map<string, { status: string; result: Json | null; payload: Json; attempts: number; last_error?: string }>()
  const txs = new Map<string, 'paid' | 'revoked'>()
  const tokens: FakeToken[] = []
  const outbox = new Map<string, FakeOutbox>()
  const calls: { fn: string; args: Json }[] = []
  // Próximas N chamadas de billing_apply_event falham (banco fora do ar)
  let applyFailures = 0

  function apply(e: Json) {
    const key = String(e.event_key)
    const prev = events.get(key)
    if (prev && (prev.status === 'processed' || prev.status === 'ignored')) {
      return { data: { ...(prev.result ?? {}), duplicate: true }, error: null }
    }
    if (applyFailures > 0) {
      applyFailures--
      return { data: null, error: { message: 'connection refused' } }
    }
    const tx = (e.transaction_id as string | null) ?? null
    let status = 'processed'
    let result: Json
    if (e.action === 'grant') {
      let token: FakeToken | undefined
      if (tx) {
        if (!txs.has(tx)) txs.set(tx, 'paid')
        if (txs.get(tx) === 'revoked') {
          status = 'ignored'
          result = { outcome: 'already_revoked' }
        } else {
          token = tokens.find(t => t.order_id === tx)
          result = { outcome: token ? 'token_exists' : 'token_created' }
        }
      } else {
        result = { outcome: 'token_created' }
      }
      if (result.outcome === 'token_created') {
        token = { id: String(tokens.length + 1), token: randomUUID(), email: String(e.email), name: String(e.name ?? ''), order_id: tx, active: true }
        tokens.push(token)
      }
      if (token) {
        result.token_id = token.id
        if (token.active) {
          const k = `access_email:token:${token.id}`
          if (!outbox.has(k)) outbox.set(k, { id: outbox.size + 1, key: k, token_id: token.id, status: 'pending', attempts: 0, idempotency_key: randomUUID() })
          result.email_key = k
        } else {
          result.token_active = false
        }
      }
    } else {
      txs.set(String(tx), 'revoked')
      let n = 0
      for (const t of tokens) {
        if (t.order_id === tx && t.active) { t.active = false; n++ }
      }
      for (const o of outbox.values()) {
        const t = tokens.find(x => x.id === o.token_id)
        if (t?.order_id === tx && (o.status === 'pending' || o.status === 'failed')) o.status = 'canceled'
      }
      result = { outcome: 'revoked', tokens_revoked: n }
    }
    events.set(key, { status, result, payload: e, attempts: (prev?.attempts ?? 0) + 1 })
    return { data: { ...result, duplicate: false }, error: null }
  }

  function claim(key: string) {
    const o = outbox.get(key)
    if (!o) return { data: { outcome: 'missing' }, error: null }
    if ((o.status === 'pending' || o.status === 'failed') && o.attempts < 8) {
      o.status = 'sending'
      o.attempts++
      const t = tokens.find(x => x.id === o.token_id)
      if (!t || !t.active) { o.status = 'canceled'; return { data: { outcome: 'canceled' }, error: null } }
      return {
        data: { outcome: 'claimed', outbox_id: o.id, idempotency_key: o.idempotency_key, template: 'access_granted', token: t.token, email: t.email, name: t.name },
        error: null,
      }
    }
    const outcome = o.status === 'sent' ? 'sent' : o.status === 'canceled' ? 'canceled' : o.status === 'sending' ? 'busy' : 'exhausted'
    return { data: { outcome }, error: null }
  }

  function finish(a: Json) {
    const o = [...outbox.values()].find(x => x.id === a.p_id && x.status === 'sending')
    if (o) { o.status = a.p_ok ? 'sent' : 'failed'; o.provider_id = (a.p_provider_id as string | null) ?? null }
    return { data: null, error: null }
  }

  function recordFailure(a: Json) {
    const e = a.p_event as Json
    const key = String(e.event_key)
    const prev = events.get(key)
    if (prev && (prev.status === 'processed' || prev.status === 'ignored')) return { data: null, error: null }
    events.set(key, { status: 'failed', result: null, payload: e, attempts: (prev?.attempts ?? 0) + 1, last_error: String(a.p_error) })
    return { data: null, error: null }
  }

  function dueWork() {
    return {
      data: {
        events: [...events.values()].filter(e => e.status === 'failed').map(e => e.payload),
        emails: [...outbox.values()].filter(o => o.status === 'pending' || o.status === 'failed').map(o => o.key),
        stuck: { events: 0, emails: 0 },
      },
      error: null,
    }
  }

  async function rpc(fn: string, args: Json) {
    calls.push({ fn, args })
    switch (fn) {
      case 'billing_apply_event':    return apply(args.p_event as Json)
      case 'email_outbox_claim':     return claim(String(args.p_business_key))
      case 'email_outbox_finish':    return finish(args)
      case 'billing_record_failure': return recordFailure(args)
      case 'billing_due_work':       return dueWork()
      default: throw new Error(`rpc desconhecida: ${fn}`)
    }
  }

  return {
    rpc, events, txs, tokens, outbox, calls,
    failNextApply(n = 1) { applyFailures = n },
  }
}

export type FakeBillingDb = ReturnType<typeof createFakeBillingDb>
