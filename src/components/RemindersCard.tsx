import { type ReactNode } from 'react'
import { Bell, Syringe, Package, HeartPulse, GlassWater, Scale, Dumbbell, X, ChevronRight } from 'lucide-react'
import { Tab } from '../types'
import { type Reminder, type ReminderKind } from '../utils/reminderUtils'

interface Props {
  reminders: Reminder[]
  onDismiss: (id: string) => void
  onNavigate: (tab: Tab, section?: string) => void
}

const KIND_ICON: Record<ReminderKind, (color: string) => ReactNode> = {
  application: c => <Syringe size={15} strokeWidth={2} color={c} />,
  stock:       c => <Package size={15} strokeWidth={2} color={c} />,
  postDose:    c => <HeartPulse size={15} strokeWidth={2} color={c} />,
  water:       c => <GlassWater size={15} strokeWidth={2} color={c} />,
  weighIn:     c => <Scale size={15} strokeWidth={2} color={c} />,
  workout:     c => <Dumbbell size={15} strokeWidth={2} color={c} />,
}

export default function RemindersCard({ reminders, onDismiss, onNavigate }: Props) {
  if (reminders.length === 0) return null

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bell size={15} strokeWidth={2} color="var(--cobalt)" />
        </div>
        <p style={{ flex: 1, fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          Lembretes de hoje
        </p>
        <button
          onClick={() => onNavigate('profile', 'reminders')}
          style={{
            background: 'none', border: 'none', padding: '6px 2px', cursor: 'pointer',
            fontSize: '11px', fontWeight: 700, color: 'var(--cobalt)', fontFamily: 'Inter, sans-serif',
          }}
        >
          Ajustar
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {reminders.map((r, i) => {
          const warn = r.tone === 'warn'
          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              borderTop: i === 0 ? 'none' : '1px solid var(--line)',
            }}>
              <button
                onClick={() => onNavigate(r.tab, r.section)}
                style={{
                  flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                  background: warn ? 'var(--amber-bg)' : 'var(--ice)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {KIND_ICON[r.kind](warn ? 'var(--amber)' : 'var(--cobalt)')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: warn ? 'var(--amber)' : 'var(--text-primary)', margin: '0 0 2px' }}>
                    {r.title}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {r.body}
                  </p>
                </div>
                <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </button>
              <button
                onClick={() => onDismiss(r.id)}
                aria-label={`Dispensar lembrete: ${r.title}`}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                }}
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}
