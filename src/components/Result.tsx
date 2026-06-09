import { AlertTriangle, Syringe, BarChart2, ChevronDown } from 'lucide-react'
import { CalculationResult } from '../types'
import { generateGuidance } from '../utils/calculator'

interface Props {
  result: CalculationResult
  doseDesejada: number
  syringeCapacity: number
}

export default function Result({ result, syringeCapacity }: Props) {
  if (!result.isValid) {
    return (
      <div className="card-warning scale-in" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#F59E0B',
        }}><AlertTriangle size={18} strokeWidth={2} /></div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--warn-text)' }}>Atenção</p>
          <p style={{ fontSize: '13px', color: 'var(--warn-text)', marginTop: '4px', lineHeight: 1.5 }} role="alert">
            {result.error}
          </p>
        </div>
      </div>
    )
  }

  const guidance = generateGuidance(result.ui)
  const fillPct  = Math.min(100, (result.ui / syringeCapacity) * 100)
  const nearLimit = fillPct > 80

  return (
    <div className="scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Resultado principal */}
      <div style={{
        background: 'linear-gradient(135deg, var(--result-bg) 0%, #065F46 100%)',
        borderRadius: '20px', padding: '28px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(5,150,105,0.35)',
      }}>
        <div style={{
          position: 'absolute', top: '-50px', right: '-50px', width: '160px', height: '160px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }}/>

        <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
          Resultado
        </p>
        <p
          style={{ fontSize: '88px', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-4px', fontVariantNumeric: 'tabular-nums' }}
          role="status" aria-live="polite"
        >
          {result.ui}
        </p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: '6px' }}>
          Unidades (UI)
        </p>
      </div>

      {/* Barra da seringa */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seringa {syringeCapacity} UI
          </p>
          <span className={nearLimit ? '' : 'badge badge-green'} style={nearLimit ? {
            fontSize: '11px', fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.1)',
            padding: '2px 10px', borderRadius: '99px',
          } : {}}>
            {fillPct.toFixed(0)}% da capacidade
          </span>
        </div>
        <div className="progress-track" style={{ height: '8px' }}>
          <div className="progress-fill" style={{
            width: `${fillPct}%`,
            background: nearLimit
              ? 'linear-gradient(90deg, var(--primary), #F59E0B)'
              : 'linear-gradient(90deg, var(--primary), var(--accent))',
          }}/>
        </div>
        {nearLimit && (
          <p style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} strokeWidth={2} />Próximo ao limite da seringa
          </p>
        )}
      </div>

      {/* Como aspirar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <p className="label-base" style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Syringe size={13} strokeWidth={2} />Como aspirar
        </p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {guidance}
        </p>
      </div>

      {/* Detalhes */}
      <details className="card" style={{ padding: '1rem 1.25rem' }}>
        <summary style={{
          listStyle: 'none', cursor: 'pointer', userSelect: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={13} strokeWidth={2} />Detalhes do cálculo
          </span>
          <ChevronDown size={14} strokeWidth={2} />
        </summary>
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: 'Concentração', value: `${result.concentration.toFixed(1)} mg/mL`, hi: false },
            { label: 'Volume',       value: `${result.volume.toFixed(3)} mL`,           hi: false },
            { label: 'Resultado',    value: `${result.ui} UI`,                          hi: true  },
          ].map(r => (
            <div key={r.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 12px', borderRadius: '10px',
              background: r.hi ? 'var(--primary-light)' : 'var(--surface-2)',
              border: r.hi ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{r.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: r.hi ? 'var(--primary)' : 'var(--text-primary)', fontFamily: 'monospace' }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
