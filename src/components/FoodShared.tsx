import { useId } from 'react'
import { Check, ChevronDown, Info } from 'lucide-react'
import { type IconComp, type MealOption, PLATE_ORDER } from '../data/foodPlans'
import { alpha } from '../utils/color'

const FONT = 'Inter, -apple-system, sans-serif'

// ── Rótulo de seção ───────────────────────────────────────────────────────────
export function SectionLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', padding: '0 2px' }}>
      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.2px' }}>{children}</p>
      {aside && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{aside}</span>}
    </div>
  )
}

// ── Controle segmentado ───────────────────────────────────────────────────────
// solid: navegação principal (.inner-tab do sistema) · soft: escolha dentro de um card
export function Segmented<T extends string>({
  options, value, onChange, label, variant = 'solid',
}: {
  options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string
  variant?: 'solid' | 'soft'
}) {
  const soft = variant === 'soft'
  return (
    <div role="radiogroup" aria-label={label} style={{
      display: 'flex', gap: '4px', padding: soft ? '3px' : '4px', borderRadius: soft ? '12px' : '14px',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
    }}>
      {options.map(o => {
        const active = value === o.id
        return (
          <button
            key={o.id} role="radio" aria-checked={active}
            className={soft ? undefined : `inner-tab${active ? ' active' : ''}`}
            onClick={() => onChange(o.id)}
            style={soft ? {
              flex: 1, padding: '8px 6px', borderRadius: '9px', cursor: 'pointer', border: 'none', fontFamily: FONT,
              fontSize: '12px', fontWeight: active ? 800 : 600,
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--cobalt)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--t-base) ease',
            } : undefined}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Anel de proteína (sobre fundo escuro) ─────────────────────────────────────
export function ProteinRing({ value, goal, size = 108 }: { value: number; goal: number; size?: number }) {
  const gid    = useId().replace(/:/g, '')
  const stroke = 9
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const pct    = goal > 0 ? Math.min(1, value / goal) : 0
  const done   = value >= goal && goal > 0

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      role="img" aria-label={`Proteína: ${value} de ${goal} gramas`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sky)" />
            <stop offset="100%" stopColor="var(--aqua)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track-on-dark)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s var(--ease-smooth)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {done
          ? <Check size={20} strokeWidth={2.5} color="var(--aqua)" style={{ marginBottom: '1px' }} />
          : null}
        <p style={{ fontSize: done ? '20px' : '26px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.8px' }}>
          {value}<span style={{ fontSize: '12px', fontWeight: 700, marginLeft: '1px' }}>g</span>
        </p>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#fff', opacity: 0.8, margin: '3px 0 0' }}>de {goal} g</p>
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
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: '99px', background: 'var(--g-ring)', transition: 'width 0.9s var(--ease-smooth)' }} />
      </div>
    </div>
  )
}

// ── Selo de proteína ──────────────────────────────────────────────────────────
export function ProteinChip({ grams, muted = false }: { grams: number | string; muted?: boolean }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', flexShrink: 0, whiteSpace: 'nowrap',
      background: muted ? 'var(--surface-2)' : 'var(--teal-l)',
      color: muted ? 'var(--text-muted)' : 'var(--teal-d)',
      border: `1px solid ${muted ? 'var(--border)' : alpha('var(--teal)', 40)}`,
    }}>
      {typeof grams === 'number' ? `${grams} g` : grams} prot.
    </span>
  )
}

// ── Cartão de opção do cardápio ───────────────────────────────────────────────
// Com onSelect vira um botão de escolha (gaveta da refeição); sem ele, só leitura.
export function OptionCard({
  option, selected = false, onSelect, footer,
}: {
  option: MealOption; selected?: boolean; onSelect?: () => void; footer?: React.ReactNode
}) {
  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {onSelect && (
          <span aria-hidden style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: selected ? 'var(--cobalt)' : 'var(--surface)',
            border: `2px solid ${selected ? 'var(--cobalt)' : 'var(--border-strong)'}`,
            transition: 'all 0.2s var(--ease-spring)',
          }}>
            {selected && <Check size={12} strokeWidth={2.5} color="#fff" />}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: selected ? 'var(--cobalt)' : 'var(--text-primary)', margin: 0 }}>
              {option.label}
            </p>
            {option.protein && <ProteinChip grams={option.protein} />}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {option.items.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span aria-hidden style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--azure)', flexShrink: 0, marginTop: '8px' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
              </li>
            ))}
          </ul>
          {option.note && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', padding: '6px 10px', borderRadius: '8px', background: 'var(--amber-bg)', border: '1px solid var(--amber-line)' }}>
              <Info size={12} strokeWidth={2} style={{ flexShrink: 0, color: 'var(--amber)', marginTop: '2px' }} />
              <p style={{ fontSize: '11px', color: 'var(--amber)', margin: 0, lineHeight: 1.4 }}>{option.note}</p>
            </div>
          )}
          {footer}
        </div>
      </div>
    </>
  )

  const style: React.CSSProperties = {
    width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '16px', fontFamily: FONT,
    background: selected ? 'var(--ice)' : 'var(--surface)',
    border: `1.5px solid ${selected ? 'var(--cobalt)' : 'var(--border)'}`,
    boxShadow: selected ? '0 4px 16px rgba(var(--shadow-rgb),0.10)' : 'var(--shadow-xs)',
  }

  return onSelect
    ? <button className="meal-row" role="radio" aria-checked={selected} onClick={onSelect} style={{ ...style, cursor: 'pointer' }}>{body}</button>
    : <div style={style}>{body}</div>
}

// ── Ordem no prato ────────────────────────────────────────────────────────────
export function PlateOrder({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ padding: compact ? '10px 12px' : '12px 14px', borderRadius: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
        Ordem no prato
      </p>
      <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', margin: 0, padding: 0, listStyle: 'none' }}>
        {PLATE_ORDER.map((step, i) => (
          <li key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textAlign: 'center' }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '8px',
              background: i === 0 ? 'var(--cobalt)' : 'var(--ice)', color: i === 0 ? '#fff' : 'var(--cobalt)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800,
            }}>{i + 1}</span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Accordion ─────────────────────────────────────────────────────────────────
export function ExpandCard({
  Icon, label, note, open, onToggle, children,
}: {
  Icon: IconComp; label: string; note?: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  const panelId = useId()
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <button
        onClick={onToggle} aria-expanded={open} aria-controls={panelId}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 14px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
        }}
      >
        <span style={{
          width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: 'var(--ice)', color: 'var(--cobalt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} strokeWidth={2} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
          {note && !open && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{note}</span>}
        </span>
        <ChevronDown size={15} strokeWidth={2} color="var(--text-muted)" style={{
          flexShrink: 0, transition: 'transform 0.25s var(--ease-smooth)', transform: open ? 'rotate(180deg)' : 'none',
        }} />
      </button>
      {open && (
        <div id={panelId} className="fade-in" style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
          {note && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', padding: '8px 10px', borderRadius: '10px', background: 'var(--ice)' }}>
              <Info size={12} strokeWidth={2} style={{ flexShrink: 0, color: 'var(--cobalt)', marginTop: '2px' }} />
              <p style={{ fontSize: '11px', color: 'var(--cobalt)', fontWeight: 600, margin: 0, lineHeight: 1.45 }}>{note}</p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

// ── Chips de alimentos ────────────────────────────────────────────────────────
export function FoodChips({ items, tone = 'neutral' }: { items: string[]; tone?: 'neutral' | 'positive' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map(item => (
        <span key={item} style={{
          padding: '5px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
          background: tone === 'positive' ? 'var(--teal-l)' : 'var(--surface-2)',
          color: tone === 'positive' ? 'var(--teal-d)' : 'var(--text-secondary)',
          border: `1px solid ${tone === 'positive' ? alpha('var(--teal)', 40) : 'var(--border)'}`,
        }}>{item}</span>
      ))}
    </div>
  )
}
