import { useState } from 'react'
import FoodGuide from './FoodGuide'
import Weaning from './Weaning'
import { UserProfile } from '../types'

interface Props {
  profile: UserProfile
}

type HealthTab = 'food' | 'weaning'

const TABS: { id: HealthTab; icon: string; label: string }[] = [
  { id: 'food',    icon: '🥗', label: 'Alimentação' },
  { id: 'weaning', icon: '📉', label: 'Desmame'     },
]

export default function HealthHub({ profile }: Props) {
  const [tab, setTab] = useState<HealthTab>('food')

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Saúde</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Guias e acompanhamento para o seu protocolo
        </p>
      </div>

      <div style={{
        display: 'flex', gap: '6px',
        background: 'var(--surface-2)', borderRadius: '12px', padding: '4px',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: '9px', border: 'none',
              background: tab === t.id ? 'var(--primary)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: tab === t.id ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            <span style={{ display: 'block', fontSize: '18px', marginBottom: '3px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="fade-in">
        {tab === 'food'    && <FoodGuide />}
        {tab === 'weaning' && <Weaning profile={profile} />}
      </div>
    </div>
  )
}
