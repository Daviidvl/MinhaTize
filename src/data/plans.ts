// Planos de assinatura (ofertas do produto "APP MINHA TIZE" na Wiven).
// Preços confirmados em 26/11/2026. Eles só aparecem na tela: quem cobra é a
// Wiven, e o checkout mostra o valor real. Mudou o preço na Wiven, mude aqui.
// Quem decide o acesso é o servidor (api/webhook.ts), nunca esta lista.

export type PlanId = 'mensal' | 'trimestral' | 'anual'

export interface Plan {
  id: PlanId
  name: string
  price: string
  period: string
  offerCode: string
}

const CHECKOUT_URL = 'https://checkout.wiven.com.br/checkout/cmwlix69s08so01oeq372pzco'

export const PLANS: readonly Plan[] = [
  { id: 'mensal',     name: 'Mensal',     price: 'R$ 19,90',  period: 'por mês',        offerCode: 'R0J641X' },
  { id: 'trimestral', name: 'Trimestral', price: 'R$ 49,90',  period: 'a cada 3 meses', offerCode: '9DOLKIA' },
  { id: 'anual',      name: 'Anual',      price: 'R$ 179,90', period: 'por ano',        offerCode: '73288O2' },
]

export function checkoutUrl(plan: Plan): string {
  return `${CHECKOUT_URL}?offer=${encodeURIComponent(plan.offerCode)}`
}

export function planName(id: string | null | undefined): string | null {
  return PLANS.find(p => p.id === id)?.name ?? null
}
