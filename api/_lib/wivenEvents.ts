import { createHash } from 'crypto'

// Único ponto que conhece o formato do webhook da Wiven. O resto do fluxo de
// pagamento (api/_lib/billing.ts e as funções do banco) trabalha com o evento
// canônico BillingEvent.
//
// Formatos (documentação da Wiven, lida em 27/11/2026):
//   * eventos TRANSACTION_*: offerCode, client, transaction, orderItems e
//     subscription (nulo em compra única; em cobrança de assinatura traz id,
//     startAt, intervalType, intervalCount e cycle, mas não nextChargeAt);
//   * eventos SUBSCRIPTION_*: version, occurredAt, subscription (com
//     nextChargeAt), client, order, items e transaction (nulo em período
//     grátis, expiração, cancelamento e renovação pendente). Sem offerCode.

// ─── Payload da Wiven ─────────────────────────────────────────────────────────
export interface WivenSubscription {
  id?: string
  status?: string
  startAt?: string
  nextChargeAt?: string
  intervalType?: string
  intervalCount?: number
  cycle?: number | null
}

interface WivenItem {
  id?: string
  price?: number
  product?: { id?: string; name?: string }
}

export interface WivenPayload {
  event?: string          // "TRANSACTION_PAID", "SUBSCRIPTION_RENEWED"...
  token?: string          // token de autenticidade do webhook
  occurredAt?: string     // só nos eventos SUBSCRIPTION_*
  offerCode?: string      // só nos eventos TRANSACTION_*
  client?: {
    id?: string
    name?: string
    email?: string
    phone?: string
    cpf?: string
  }
  transaction?: {
    id?: string
    status?: string
    paymentMethod?: string
    amount?: number
    createdAt?: string
    payedAt?: string
  } | null
  subscription?: WivenSubscription | null
  orderItems?: WivenItem[]  // TRANSACTION_*
  items?: WivenItem[]       // SUBSCRIPTION_*
}

export const GATEWAY = 'wiven'
export const PAID_EVENT = 'TRANSACTION_PAID'

// Cobrança de assinatura paga: a Wiven manda os dois (TRANSACTION_PAID também)
export const SUBSCRIPTION_CHARGE_EVENTS: readonly string[] = ['SUBSCRIPTION_STARTED', 'SUBSCRIPTION_RENEWED']

export type SubscriptionStatus = 'past_due' | 'expired' | 'canceled'
export const SUBSCRIPTION_STATUS_EVENTS: Readonly<Record<string, SubscriptionStatus>> = {
  SUBSCRIPTION_RENEWAL_PENDING: 'past_due',
  SUBSCRIPTION_EXPIRED: 'expired',
  SUBSCRIPTION_CANCELED: 'canceled',
}

const envList = (name: string): string[] =>
  (process.env[name] ?? '').split(',').map(s => s.trim()).filter(Boolean)

// Eventos que revogam o acesso (reembolso, chargeback, cancelamento). Os nomes
// vêm do painel da Wiven e são configurados em WIVEN_REVOKE_EVENTS, separados
// por vírgula. Sem a variável, nenhum evento revoga (comportamento anterior).
// TRANSACTION_PAID nunca revoga: incluído por engano, toda compra cairia aqui
// e o comprador ficaria sem acesso.
export function revokeEvents(): string[] {
  return envList('WIVEN_REVOKE_EVENTS').filter(e => e !== PAID_EVENT)
}

function productIdsOf(body: WivenPayload): unknown[] {
  const items = [
    ...(Array.isArray(body.orderItems) ? body.orderItems : []),
    ...(Array.isArray(body.items) ? body.items : []),
  ]
  return [body.offerCode, ...items.map(i => i?.product?.id)]
}

// Produto VITALÍCIO (compra única antiga). Se a conta da Wiven vender outros
// produtos e o webhook valer para a conta inteira, a compra de qualquer um
// deles geraria um acesso. WIVEN_PRODUCT_IDS (ids de produto e/ou códigos de
// oferta, separados por vírgula) restringe a emissão; sem a variável, toda
// venda paga que não seja assinatura libera (comportamento anterior).
export function isAllowedProduct(body: WivenPayload): boolean {
  const allowed = envList('WIVEN_PRODUCT_IDS')
  if (allowed.length === 0) return true
  return productIdsOf(body).some(id => typeof id === 'string' && allowed.includes(id))
}

// Produto de ASSINATURA. Sem WIVEN_SUBSCRIPTION_PRODUCT_IDS nenhuma assinatura
// libera acesso — nunca vira vitalício por falta de configuração.
export function isSubscriptionProduct(body: WivenPayload): boolean {
  const allowed = envList('WIVEN_SUBSCRIPTION_PRODUCT_IDS')
  if (allowed.length === 0) return false
  return productIdsOf(body).some(id => typeof id === 'string' && allowed.includes(id))
}

// Cobrança de assinatura vinda como evento de transação
export function hasSubscription(body: WivenPayload): boolean {
  const sub = body.subscription
  return !!sub && typeof sub === 'object' && typeof sub.id === 'string' && sub.id.trim() !== ''
}

export type Plan = 'mensal' | 'trimestral' | 'anual'

// Os três planos são ofertas do mesmo produto e os eventos de assinatura não
// trazem a oferta: o plano sai da periodicidade, que é diferente em cada um.
export function planOf(sub: WivenSubscription | null | undefined): Plan | null {
  const type = sub?.intervalType
  const count = sub?.intervalCount
  if (type === 'MONTHS' && count === 1) return 'mensal'
  if (type === 'MONTHS' && count === 3) return 'trimestral'
  if ((type === 'YEARS' && count === 1) || (type === 'MONTHS' && count === 12)) return 'anual'
  return null
}

export function transactionIdOf(body: WivenPayload): string {
  const id: unknown = body.transaction?.id
  if (typeof id === 'string') return id.trim()
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return ''
}

const text = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// Data ISO válida (normalizada) ou null
function isoOf(v: unknown): string | null {
  if (typeof v !== 'string' || !v) return null
  const ms = Date.parse(v)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

// ─── Evento canônico ──────────────────────────────────────────────────────────
// É o que vai para o banco (billing_events.payload) e o que o cron reprocessa.
// Sem CPF, telefone, valores nem o segredo do webhook.
export interface BillingEvent {
  gateway: string
  event_key: string
  event_type: string
  action: 'grant' | 'revoke' | 'subscription_charge' | 'subscription_status'
  transaction_id: string | null
  email: string | null
  name: string
  // Assinaturas
  subscription_id?: string | null
  customer_id?: string | null
  plan?: Plan | null
  status?: SubscriptionStatus
  occurred_at?: string | null
  period_end?: string | null
  start_at?: string | null
  interval_type?: string | null
  interval_count?: number | null
  cycle?: number | null
}

// JSON com as chaves em ordem: a mesma entrega gera sempre o mesmo texto
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return `{${Object.keys(obj).sort()
      .filter(k => obj[k] !== undefined)
      .map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

// Chave do evento. O payload da Wiven não traz um id de evento, então:
//   "<evento>:<transaction.id>"                  — o caso normal
//   "<evento>:<subscription.id>:<occurredAt>"    — eventos de assinatura sem transação
//   "<evento>:sha256:<hash do payload>"          — sem nenhum dos dois: uma
//                                                  reentrega idêntica gera a mesma chave
// O segredo (body.token) fica fora do hash: trocar o segredo não muda a chave.
export function eventKeyOf(body: WivenPayload): string {
  const type = String(body.event ?? '').slice(0, 100)
  const tx = transactionIdOf(body)
  if (tx) return `${type}:${tx.slice(0, 200)}`
  const sub = text(body.subscription?.id)
  const occurred = isoOf(body.occurredAt)
  if (sub && occurred) return `${type}:${sub}:${occurred}`
  const rest: Record<string, unknown> = { ...body }
  delete rest.token
  return `${type}:sha256:${createHash('sha256').update(stableStringify(rest)).digest('hex')}`
}

// Compra única (grant) ou estorno/chargeback (revoke)
export function toBillingEvent(body: WivenPayload, action: 'grant' | 'revoke'): BillingEvent {
  const tx = transactionIdOf(body)
  const email = text(body.client?.email, 320)
  const event: BillingEvent = {
    gateway: GATEWAY,
    event_key: eventKeyOf(body),
    event_type: String(body.event ?? '').slice(0, 100),
    action,
    transaction_id: tx || null,
    email: email || null,
    name: text(body.client?.name),
  }
  // Estorno de uma cobrança de assinatura: o banco corta o acesso da assinatura
  if (action === 'revoke' && hasSubscription(body)) event.subscription_id = text(body.subscription?.id)
  return event
}

export type Built = { ok: true; event: BillingEvent } | { ok: false; reason: 'unknown_plan' | 'invalid' ; detail: string }

// Cobrança de assinatura paga: TRANSACTION_PAID com subscription, ou
// SUBSCRIPTION_STARTED/RENEWED (que trazem nextChargeAt)
export function toSubscriptionCharge(body: WivenPayload): Built {
  const sub = body.subscription
  const tx = transactionIdOf(body)
  const subId = text(sub?.id)
  const email = text(body.client?.email, 320)
  const plan = planOf(sub)
  const fromSubscriptionEvent = SUBSCRIPTION_CHARGE_EVENTS.includes(String(body.event))
  const occurred = isoOf(body.occurredAt) ?? isoOf(body.transaction?.payedAt) ?? isoOf(body.transaction?.createdAt)

  if (!tx || !subId) return { ok: false, reason: 'invalid', detail: 'cobrança de assinatura sem transaction.id ou subscription.id' }
  if (!email) return { ok: false, reason: 'invalid', detail: 'cobrança de assinatura sem e-mail do cliente' }
  if (!occurred) return { ok: false, reason: 'invalid', detail: 'cobrança de assinatura sem data' }
  if (!plan) {
    return { ok: false, reason: 'unknown_plan', detail: `periodicidade ${String(sub?.intervalType)}/${String(sub?.intervalCount)}` }
  }

  const cycle = Number.isInteger(sub?.cycle) ? sub?.cycle as number : null
  const count = Number.isInteger(sub?.intervalCount) ? sub?.intervalCount as number : null
  return {
    ok: true,
    event: {
      gateway: GATEWAY,
      event_key: eventKeyOf(body),
      event_type: String(body.event).slice(0, 100),
      action: 'subscription_charge',
      transaction_id: tx,
      email,
      name: text(body.client?.name),
      subscription_id: subId,
      customer_id: text(body.client?.id) || null,
      plan,
      occurred_at: occurred,
      period_end: fromSubscriptionEvent ? isoOf(sub?.nextChargeAt) : null,
      start_at: isoOf(sub?.startAt),
      interval_type: text(sub?.intervalType, 10) || null,
      interval_count: count,
      cycle,
    },
  }
}

// Renovação pendente, expiração ou cancelamento
export function toSubscriptionStatus(body: WivenPayload, status: SubscriptionStatus): Built {
  const subId = text(body.subscription?.id)
  const occurred = isoOf(body.occurredAt)
  if (!subId || !occurred) return { ok: false, reason: 'invalid', detail: 'evento de assinatura sem subscription.id ou occurredAt' }
  return {
    ok: true,
    event: {
      gateway: GATEWAY,
      event_key: eventKeyOf(body),
      event_type: String(body.event).slice(0, 100),
      action: 'subscription_status',
      transaction_id: null,
      email: null,
      name: '',
      subscription_id: subId,
      customer_id: text(body.client?.id) || null,
      plan: planOf(body.subscription),
      status,
      occurred_at: occurred,
    },
  }
}
