import { useId, useState } from 'react'
import { Check, Flame } from 'lucide-react'
import { DAY_FULL, DAY_INITIALS } from '../utils/exerciseUtils'
import { todayStr } from '../utils/dateUtils'
import { alpha } from '../utils/color'

// Peças do card azul do topo, usadas por Alimentação e Treinos.

const FONT = 'Inter, -apple-system, sans-serif'

// ── Card azul ─────────────────────────────────────────────────────────────────
export function HeroCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--g-hero)', borderRadius: '22px', padding: '18px 18px 16px', color: '#fff',
      boxShadow: '0 6px 20px rgba(var(--shadow-rgb),0.28), 0 1px 3px rgba(var(--shadow-rgb),0.12)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-28px', right: '-28px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      {children}
    </div>
  )
}

// ── Rótulo pequeno em caixa alta ──────────────────────────────────────────────
export function HeroEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '10px', fontWeight: 700, color: '#fff', opacity: 0.8, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {children}
    </p>
  )
}

// ── Anel de meta (sobre fundo escuro) ─────────────────────────────────────────
export function GoalRing({ pct, label, children, size = 108 }: {
  pct: number            // 0–1
  label: string          // leitores de tela
  children: React.ReactNode  // conteúdo do centro
  size?: number
}) {
  const gid    = useId().replace(/:/g, '')
  const stroke = 9
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const p      = Math.max(0, Math.min(1, pct))

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sky)" />
            <stop offset="100%" stopColor="var(--aqua)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track-on-dark)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s var(--ease-smooth)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

// ── Mini barra sobre fundo escuro ─────────────────────────────────────────────
export function DarkMeter({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px', marginBottom: '5px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#fff', opacity: 0.8, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <p style={{ fontSize: '12px', fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>{value}</p>
      </div>
      <div style={{ height: '5px', borderRadius: '99px', background: 'var(--track-on-dark)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', borderRadius: '99px', background: 'var(--g-ring)', transition: 'width 0.9s var(--ease-smooth)' }} />
      </div>
    </div>
  )
}

// ── Semana dentro do card azul ────────────────────────────────────────────────
export interface StripDay {
  date: string      // AAAA-MM-DD (dom–sáb da semana atual)
  pct: number       // 0–1, progresso do mini-anel
  complete: boolean
  mark?: string     // texto no centro do anel (ex.: "42", "A"); completo sem mark → ✓
  summary: string   // linha mostrada ao tocar no dia
  ariaLabel: string
}

// Um mini-anel por dia. Toque num dia passado para ver o resumo; hoje já está no topo do card.
export function WeekStrip({ days, headline, streak, streakSuffix = '', streakLabel }: {
  days: StripDay[]
  headline: { value: number; text: string }  // "2" + " de 3 treinos"
  streak: number                             // mostrado a partir de 2
  streakSuffix?: string                      // ex.: " sem"
  streakLabel: string                        // leitores de tela, ex.: "semanas seguidas"
}) {
  const today = todayStr()
  const [sel, setSel] = useState(today)
  const gid  = useId().replace(/:/g, '')
  const SIZE = 30, STROKE = 3
  const r    = (SIZE - STROKE) / 2
  const circ = 2 * Math.PI * r

  const selIdx = days.findIndex(d => d.date === sel)
  const selDay = days[selIdx]

  return (
    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.14)', position: 'relative' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
        <HeroEyebrow>Sua semana</HeroEyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
            {headline.value}<span style={{ opacity: 0.8, fontWeight: 600 }}>{headline.text}</span>
          </span>
          {streak > 1 && (
            <span aria-label={`${streak} ${streakLabel}`} style={{
              display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px 3px 6px', borderRadius: '99px',
              background: 'rgba(255,255,255,0.14)', fontSize: '11px', fontWeight: 800, color: '#fff',
            }}>
              <Flame size={12} strokeWidth={2} color="var(--aqua)" />
              {streak}{streakSuffix}
            </span>
          )}
        </div>
      </div>

      {/* Dias */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sky)" />
            <stop offset="100%" stopColor="var(--aqua)" />
          </linearGradient>
        </defs>
      </svg>
      <div role="radiogroup" aria-label="Dias da semana" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {days.map((d, i) => {
          const isToday  = d.date === today
          const isFuture = d.date > today
          const isSel    = d.date === sel
          const pct      = Math.max(0, Math.min(1, d.pct))

          return (
            <button
              key={d.date} role="radio" aria-checked={isSel} disabled={isFuture}
              onClick={() => setSel(d.date)}
              aria-label={`${DAY_FULL[i]}: ${isFuture ? 'ainda não chegou' : d.ariaLabel}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '4px 0 3px', borderRadius: '12px', fontFamily: FONT,
                cursor: isFuture ? 'default' : 'pointer',
                background: isSel ? 'rgba(255,255,255,0.14)' : 'transparent',
                border: `1px solid ${isSel ? 'rgba(255,255,255,0.22)' : 'transparent'}`,
                transition: 'background var(--t-base) ease, border-color var(--t-base) ease',
              }}
            >
              <span style={{
                fontSize: '10px', fontWeight: isToday ? 800 : 700, color: '#fff',
                opacity: isFuture ? 0.45 : isToday || isSel ? 1 : 0.75,
              }}>
                {DAY_INITIALS[i]}
              </span>

              <span style={{ position: 'relative', width: SIZE, height: SIZE, opacity: isFuture ? 0.45 : 1 }}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
                  <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill={d.complete ? alpha('var(--aqua)', 18) : 'none'}
                    stroke="var(--track-on-dark)" strokeWidth={STROKE}
                    strokeDasharray={isFuture ? '2 3' : undefined} />
                  {!isFuture && pct > 0 && (
                    <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={STROKE}
                      strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                      transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                      style={{ transition: 'stroke-dashoffset 0.9s var(--ease-smooth)' }} />
                  )}
                </svg>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isFuture ? null
                    : d.mark
                      ? <span style={{ fontSize: '10px', fontWeight: 800, color: d.complete ? 'var(--aqua)' : '#fff', letterSpacing: '-0.3px' }}>{d.mark}</span>
                      : d.complete
                        ? <Check size={14} strokeWidth={2.5} color="var(--aqua)" />
                        : null}
                </span>
              </span>

              <span aria-hidden style={{
                width: '3px', height: '3px', borderRadius: '50%',
                background: isToday ? '#fff' : 'transparent',
              }} />
            </button>
          )
        })}
      </div>

      {/* Resumo do dia selecionado (hoje já está no topo do card) */}
      {sel !== today && selDay && (
        <div key={sel} className="fade-in" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
              {DAY_FULL[selIdx]}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#fff', opacity: 0.85, margin: '2px 0 0' }}>
              {selDay.summary}
            </p>
          </div>
          {selDay.complete && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, padding: '4px 9px', borderRadius: '99px',
              background: 'rgba(255,255,255,0.14)', fontSize: '11px', fontWeight: 800, color: '#fff',
            }}>
              <Check size={12} strokeWidth={2.5} color="var(--aqua)" />
              Completo
            </span>
          )}
          <button onClick={() => setSel(today)} style={{
            padding: '6px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: '11px', fontWeight: 800, fontFamily: FONT,
          }}>
            Hoje
          </button>
        </div>
      )}
    </div>
  )
}
