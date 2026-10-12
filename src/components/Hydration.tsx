import { useState } from 'react'
import { Droplets, Dumbbell, Plus, X, Lightbulb } from 'lucide-react'
import WeekCard from './WeekCard'
import { WATER_QUICK_ADD } from '../data/foodPlans'
import { waterTotal, formatMl, countThisWeek, calcDayStreak } from '../utils/foodUtils'

interface Props {
  entries: number[]   // ml de cada registro de hoje
  goalMl: number
  goalRange: string   // faixa recomendada, ex.: "2.8–3.2 L"
  weight: number
  doneDays: string[]  // dias com a meta de água atingida
  onChange: (entries: number[]) => void
}

export default function Hydration({ entries, goalMl, goalRange, weight, doneDays, onChange }: Props) {
  const [custom, setCustom] = useState('')

  const total    = waterTotal(entries)
  const pct      = Math.min(100, Math.round((total / goalMl) * 100))
  const doneWeek = countThisWeek(doneDays)
  const streak   = calcDayStreak(doneDays)

  function addCustom() {
    const ml = parseInt(custom)
    if (!ml || ml <= 0) return
    onChange([...entries, ml])
    setCustom('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Resumo do dia */}
      <div style={{
        background: 'var(--g-hero)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: '0 6px 20px rgba(var(--shadow-rgb),0.28), 0 1px 3px rgba(var(--shadow-rgb),0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Água de hoje
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>
              {formatMl(total)} ml
            </p>
            <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>de {formatMl(goalMl)} ml</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{pct}%</p>
            <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>da meta</p>
          </div>
        </div>
        <div style={{ marginTop: '14px' }}>
          <div style={{ height: '6px', borderRadius: '99px', background: 'var(--track-on-dark)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '99px', background: 'var(--g-ring)', transition: 'width 0.9s var(--ease-smooth)' }} />
          </div>
          <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px' }}>
            {total >= goalMl ? 'Meta de água atingida' : `Faltam ${formatMl(goalMl - total)} ml`}
          </p>
        </div>
      </div>

      {/* Registrar */}
      <div className="card" style={{ padding: '16px' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>
          Registrar água
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
          {WATER_QUICK_ADD.map(q => (
            <button
              key={q.ml}
              onClick={() => onChange([...entries, q.ml])}
              className="meal-row"
              style={{
                padding: '12px 6px', borderRadius: '14px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px',
                fontFamily: 'Inter, -apple-system, sans-serif',
                border: '1.5px solid var(--border)', background: 'var(--surface-2)',
              }}
            >
              <span style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--ice)', color: 'var(--cobalt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <q.Icon size={17} strokeWidth={1.75} />
              </span>
              <span>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>+{q.ml} ml</span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{q.label}</span>
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number" inputMode="numeric" value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="Outra quantidade (ml)"
            aria-label="Outra quantidade em ml"
            style={{
              flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: '10px', fontSize: '13px',
              border: '1.5px solid var(--border)', background: 'var(--surface-2)',
              color: 'var(--text-primary)', outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
          />
          <button onClick={addCustom} aria-label="Adicionar quantidade" style={{
            width: '38px', height: '38px', borderRadius: '10px', border: 'none', flexShrink: 0,
            background: 'var(--primary)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Registros de hoje */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
            {entries.map((ml, i) => (
              <button
                key={i}
                onClick={() => onChange(entries.filter((_, j) => j !== i))}
                aria-label={`Remover registro de ${ml} ml`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 8px 7px 12px', borderRadius: '99px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                }}
              >
                {formatMl(ml)} ml
                <X size={13} strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
      </div>

      <WeekCard title="Semana de hidratação" done={doneDays} doneLabel="meta de água atingida" pendingLabel="meta de água em aberto">
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doneWeek}</span>
          {doneWeek === 1 ? ' dia' : ' dias'} com a meta essa semana
          {streak > 1 && (
            <>
              {' · '}
              <span style={{ fontWeight: 700, color: 'var(--teal-d)' }}>{streak}</span>
              {' dias seguidos'}
            </>
          )}
        </p>
      </WeekCard>

      {/* Meta e dicas */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Lightbulb size={14} strokeWidth={2} style={{ color: 'var(--teal-d)', flexShrink: 0 }} />
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>Sua meta de água</p>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          <strong>35–40 ml de água por kg de peso corporal.</strong>
        </p>
        <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--ice)', border: '1px solid var(--sky)' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cobalt)', margin: 0 }}>
            Seu peso: {weight} kg → {goalRange} por dia
          </p>
        </div>
        {[
          { icon: <Droplets size={14} strokeWidth={2} />, text: 'Prefira pequenos goles frequentes ao longo do dia' },
          { icon: <Dumbbell size={14} strokeWidth={2} />, text: 'Aumente a ingestão de água nos dias de treino' },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
            <span style={{ flexShrink: 0, marginTop: '1px' }}>{t.icon}</span>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{t.text}</p>
          </div>
        ))}
        <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-line)' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)', margin: '0 0 2px' }}>Se houver tontura, dor de cabeça ou fadiga:</p>
          <p style={{ fontSize: '12px', color: 'var(--amber)', margin: 0, lineHeight: 1.4 }}>Muitas vezes o problema é desidratação, não falta de comida.</p>
        </div>
      </div>
    </div>
  )
}
