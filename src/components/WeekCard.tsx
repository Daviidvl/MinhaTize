import { Check, Flame } from 'lucide-react'
import { DAY_INITIALS, DAY_FULL, toDateStr, getWeekDays } from '../utils/exerciseUtils'

interface Props {
  title: string
  done: string[]        // datas (AAAA-MM-DD) concluídas
  doneLabel: string     // lido por leitores de tela, ex.: "treino concluído"
  pendingLabel: string
  children?: React.ReactNode  // resumo abaixo dos círculos
}

// Card da semana (dom–sáb) com um círculo por dia
export default function WeekCard({ title, done, doneLabel, pendingLabel, children }: Props) {
  const today = toDateStr(new Date())

  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
        <Flame size={14} strokeWidth={2} style={{ color: 'var(--teal-d)', flexShrink: 0 }} />
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </p>
      </div>

      {/* Day circles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        {getWeekDays().map((d, i) => {
          const ds       = toDateStr(d)
          const isDone   = done.includes(ds)
          const isToday  = ds === today
          let bg        = 'var(--surface-2)'
          let border    = '1.5px solid var(--border)'
          let color     = 'var(--text-secondary)'
          let pulsing   = false

          if (isDone) {
            bg = 'var(--teal-d)'; border = '1.5px solid var(--teal-d)'
            color = 'var(--surface)'
          } else if (isToday) {
            border = '2px solid var(--teal)'; color = 'var(--teal-d)'
            bg = 'transparent'; pulsing = true
          }

          return (
            <div
              key={i}
              role="img"
              aria-label={`${DAY_FULL[d.getDay()]}: ${isDone ? doneLabel : pendingLabel}`}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: bg, border, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: pulsing ? 'pulse-ring 1.8s ease-in-out infinite' : 'none',
                transition: 'all 0.18s', flexShrink: 0,
              }}
            >
              {isDone
                ? <Check size={16} strokeWidth={2.5} />
                : <span style={{ fontSize: '12px', fontWeight: 700 }}>{DAY_INITIALS[i]}</span>
              }
            </div>
          )
        })}
      </div>

      {children}
    </div>
  )
}
