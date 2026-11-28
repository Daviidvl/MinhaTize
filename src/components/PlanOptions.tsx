import { ExternalLink } from 'lucide-react'
import { PLANS, checkoutUrl } from '../data/plans'

// Os três planos de assinatura, cada um levando ao checkout da Wiven. Depois do
// pagamento, o token chega por e-mail (api/webhook.ts) — esta tela não libera nada.
export default function PlanOptions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {PLANS.map(plan => (
        <a
          key={plan.id}
          href={checkoutUrl(plan)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Assinar o plano ${plan.name}: ${plan.price} ${plan.period}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '13px 14px', borderRadius: '14px',
            border: '1.5px solid var(--border)', background: 'var(--surface-2)',
            textDecoration: 'none', fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{plan.period}</p>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{plan.price}</span>
          <ExternalLink size={14} strokeWidth={2} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        </a>
      ))}
    </div>
  )
}
