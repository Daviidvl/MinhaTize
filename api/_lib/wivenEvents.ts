import { createHash } from 'crypto'

// Único ponto que conhece o formato do webhook da Wiven. O resto do fluxo de
// pagamento (api/_lib/billing.ts e as funções do banco) trabalha com o evento
// canônico BillingEvent.

// ─── Payload da Wiven ─────────────────────────────────────────────────────────
export interface WivenPayload {
  event?: string          // "TRANSACTION_PAID"
  token?: string          // token de autenticidade do webhook
  offerCode?: string
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
  }
  orderItems?: {
    id?: string
    price?: number
    product?: { id?: string; name?: string }
  }[]
}

export const GATEWAY = 'wiven'
export const PAID_EVENT = 'TRANSACTION_PAID'

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

// Produtos que liberam o MinhaTize. Se a conta da Wiven vender outros produtos
// e o webhook valer para a conta inteira, a compra de qualquer um deles geraria
// um acesso. WIVEN_PRODUCT_IDS (ids de produto e/ou códigos de oferta,
// separados por vírgula) restringe a emissão; sem a variável, toda venda paga
// libera (comportamento anterior).
export function isAllowedProduct(body: WivenPayload): boolean {
  const allowed = envList('WIVEN_PRODUCT_IDS')
  if (allowed.length === 0) return true
  const items = Array.isArray(body.orderItems) ? body.orderItems : []
  const ids = [body.offerCode, ...items.map(i => i?.product?.id)]
  return ids.some(id => typeof id === 'string' && allowed.includes(id))
}

export function transactionIdOf(body: WivenPayload): string {
  const id: unknown = body.transaction?.id
  if (typeof id === 'string') return id.trim()
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return ''
}

// ─── Evento canônico ──────────────────────────────────────────────────────────
// É o que vai para o banco (billing_events.payload) e o que o cron reprocessa.
// Sem CPF, telefone, valores nem o segredo do webhook.
export interface BillingEvent {
  gateway: string
  event_key: string
  event_type: string
  action: 'grant' | 'revoke'
  transaction_id: string | null
  email: string | null
  name: string
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
//   "<evento>:<transaction.id>"         — o caso normal
//   "<evento>:sha256:<hash do payload>" — sem transaction.id: uma reentrega
//                                          idêntica gera a mesma chave
// O segredo (body.token) fica fora do hash: trocar o segredo não muda a chave.
export function eventKeyOf(body: WivenPayload): string {
  const type = String(body.event ?? '').slice(0, 100)
  const tx = transactionIdOf(body)
  if (tx) return `${type}:${tx.slice(0, 200)}`
  const rest: Record<string, unknown> = { ...body }
  delete rest.token
  return `${type}:sha256:${createHash('sha256').update(stableStringify(rest)).digest('hex')}`
}

export function toBillingEvent(body: WivenPayload, action: BillingEvent['action']): BillingEvent {
  const tx = transactionIdOf(body)
  const email = typeof body.client?.email === 'string' ? body.client.email.trim() : ''
  const name = typeof body.client?.name === 'string' ? body.client.name.slice(0, 200) : ''
  return {
    gateway: GATEWAY,
    event_key: eventKeyOf(body),
    event_type: String(body.event ?? '').slice(0, 100),
    action,
    transaction_id: tx || null,
    email: email || null,
    name,
  }
}
