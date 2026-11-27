import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createRateLimiter } from './_lib/rateLimit.js'
import { getClientIp, secretsMatch } from './_lib/auth.js'
import { parseJsonBody } from './_lib/http.js'
import {
  type BillingEvent, type WivenPayload,
  PAID_EVENT, isAllowedProduct, revokeEvents, toBillingEvent, transactionIdOf,
} from './_lib/wivenEvents.js'
import { applyBillingEvent, deliverOutboxEmail, recordBillingFailure } from './_lib/billing.js'

// Limite generoso: o objetivo é conter flood/abuso, não a operação normal do
// Wiven (que chama pouquíssimas vezes por venda). 60/min por IP.
const checkRateLimit = createRateLimiter('webhook', 60, 60_000)

// ─── Verificação de autenticidade (timing-safe) ───────────────────────────────
// A Wiven autentica com um segredo fixo no corpo (body.token), não com uma
// assinatura do corpo bruto — por isso a verificação é feita depois do parse.
function isValidRequest(body: WivenPayload): boolean {
  if (!process.env.WIVEN_WEBHOOK_SECRET) {
    console.warn('[webhook] WIVEN_WEBHOOK_SECRET não configurado')
    return false
  }
  return secretsMatch(body.token, process.env.WIVEN_WEBHOOK_SECRET)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
// Idempotente: a mesma entrega repetida (reenvio da Wiven, duas requisições
// simultâneas) não cria outro token nem manda outro e-mail. Ver api/_lib/billing.ts.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Aceitar apenas POST
  if (req.method !== 'POST') return res.status(405).end()

  // ── Rate limit por IP (defesa em profundidade) ─────────────────────────────
  // Continua sendo o segredo timing-safe abaixo que decide se a requisição é
  // autêntica — isto só contém volume, não substitui a autenticação.
  const ip = getClientIp(req) || 'unknown'
  const rl = await checkRateLimit(ip)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds))
    return res.status(429).json({ error: 'Too Many Requests' })
  }

  // Validar Content-Type
  const ct = (req.headers['content-type'] ?? '').toLowerCase()
  if (!ct.includes('application/json')) {
    return res.status(415).json({ error: 'Unsupported Media Type' })
  }

  const parsed = parseJsonBody(req)
  if (!parsed) return res.status(400).json({ error: 'Invalid payload' })
  const body = parsed as WivenPayload

  // 1. Verificar autenticidade ANTES de qualquer outra coisa: sem isso nada é
  //    gravado, liberado ou enviado
  if (!isValidRequest(body)) {
    console.warn('[webhook] Token inválido recebido')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 2. Reembolso / chargeback: revoga o token daquela transação
  if (body.event && revokeEvents().includes(body.event)) {
    if (!transactionIdOf(body)) {
      console.error('[webhook] Evento de revogação sem transaction.id:', body.event)
      return res.status(400).json({ error: 'Missing transaction id' })
    }
    return processEvent(res, toBillingEvent(body, 'revoke'))
  }

  // 3. Demais eventos são ignorados. O nome fica no log para facilitar descobrir
  //    quais eventos a Wiven envia (ex.: ao configurar WIVEN_REVOKE_EVENTS).
  if (body.event !== PAID_EVENT) {
    console.log('[webhook] Evento ignorado:', String(body.event).slice(0, 60))
    return res.status(200).json({ received: true, action: 'ignored — not TRANSACTION_PAID' })
  }

  // 3b. Venda de outro produto da conta: não emite acesso. 200 para a Wiven não
  //     reentregar; error no log para um WIVEN_PRODUCT_IDS errado não passar batido.
  if (!isAllowedProduct(body)) {
    console.error('[webhook] Produto fora de WIVEN_PRODUCT_IDS — acesso não emitido. Transação:', transactionIdOf(body) || '(sem id)')
    return res.status(200).json({ received: true, action: 'ignored — product not allowed' })
  }

  // 4. E-mail do comprador
  if (!body.client?.email || typeof body.client.email !== 'string' || !body.client.email.trim()) {
    console.error('[webhook] E-mail do cliente ausente')
    return res.status(400).json({ error: 'Missing customer email' })
  }

  return processEvent(res, toBillingEvent(body, 'grant'))
}

// ─── Aplicar o evento e enviar o e-mail ───────────────────────────────────────
async function processEvent(res: VercelResponse, event: BillingEvent) {
  const txLabel = event.transaction_id ?? '(sem id)'

  // Uma transação no banco: registra o evento, emite/revoga o token e enfileira
  // o e-mail. Se falhar, nada fica gravado pela metade.
  let result
  try {
    result = await applyBillingEvent(event)
  } catch (err) {
    const message = (err as Error)?.message ?? String(err)
    console.error('[webhook] Falha ao processar', event.event_type, 'da transação', txLabel, '—', message)
    // Guarda o evento para o cron (api/billing-cron.ts) e responde 500 para a
    // Wiven reentregar — o que chegar primeiro resolve, sem duplicar.
    await recordBillingFailure(event, message)
    return res.status(500).json({ error: 'Database error' })
  }

  if (result.outcome === 'revoked') {
    console.log('[webhook] Acesso revogado:', event.event_type, txLabel, result.duplicate ? '(reentrega)' : '')
    return res.status(200).json({ success: true, action: 'revoked', ...(result.duplicate ? { duplicate: true } : {}) })
  }

  if (result.outcome === 'already_revoked') {
    console.warn('[webhook] Pagamento de uma transação já estornada — acesso não emitido:', txLabel)
    return res.status(200).json({ received: true, action: 'ignored — transaction revoked' })
  }

  // E-mail com o token. A fila garante um e-mail por token: numa reentrega, só
  // sai se o envio anterior não tiver dado certo.
  if (result.email_key) {
    const delivery = await deliverOutboxEmail(result.email_key)
    if (delivery === 'failed') {
      // O token está salvo; 502 faz a Wiven reentregar, e a reentrega só tenta
      // o e-mail de novo (o cron também tenta)
      console.error('[webhook] Token salvo mas e-mail falhou para a transação:', txLabel)
      return res.status(502).json({ error: 'Email delivery failed' })
    }
    if (delivery === 'exhausted') {
      console.error('[webhook] E-mail de acesso esgotou as tentativas — reenviar manualmente (DEPLOY.md). Transação:', txLabel)
    }
  }

  if (result.duplicate) console.log('[webhook] Evento já processado:', event.event_type, txLabel)
  return res.status(200).json(result.duplicate ? { success: true, duplicate: true } : { success: true })
}
