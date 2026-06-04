import { CalculationResult } from '../types'
import { generateGuidance } from '../utils/calculator'

interface ResultProps {
  result: CalculationResult
  doseDesejada: number
  syringeCapacity: number
}

export default function Result({ result, syringeCapacity }: ResultProps) {
  if (!result.isValid) {
    return (
      <div className="card-warning flex items-start gap-4 scale-in">
        <div style={{
          flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(245,158,11,0.15)', fontSize: '18px',
        }}>
          ⚠️
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--warn-text)' }}>Atenção</h3>
          <p style={{ marginTop: '4px', fontSize: '14px', lineHeight: 1.5, color: 'var(--warn-text)' }} role="alert">
            {result.error}
          </p>
          <p style={{ fontSize: '12px', marginTop: '8px', fontWeight: 600, color: 'var(--warn-text)', opacity: 0.8 }}>
            Consulte seu médico para ajustar a dose.
          </p>
        </div>
      </div>
    )
  }

  const guidance = generateGuidance(result.ui)
  const fillPct = Math.min(100, (result.ui / syringeCapacity) * 100)
  const nearLimit = result.ui > syringeCapacity * 0.8

  return (
    <div className="space-y-4 scale-in">

      {/* Card principal do resultado */}
      <div style={{
        background: 'var(--result-bg)',
        borderRadius: '18px',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(5,150,105,0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Fundo decorativo */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '140px', height: '140px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '-30px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />

        <p style={{
          fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
        }}>
          Resultado
        </p>
        <p
          style={{ fontSize: '80px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-2px' }}
          role="status"
          aria-live="polite"
        >
          {result.ui}
        </p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
          Unidades (UI)
        </p>
      </div>

      {/* Barra da seringa */}
      <div className="card" style={{ padding: '1rem 1.375rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seringa {syringeCapacity} UI
          </p>
          <p style={{ fontSize: '12px', fontWeight: 800, color: nearLimit ? '#F59E0B' : 'var(--primary)' }}>
            {fillPct.toFixed(0)}% da capacidade
          </p>
        </div>
        <div style={{ background: 'var(--surface-2)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${fillPct}%`, height: '100%', borderRadius: '99px',
            background: nearLimit
              ? 'linear-gradient(90deg, var(--primary), #F59E0B)'
              : 'var(--primary)',
            transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
        {nearLimit && (
          <p style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, marginTop: '6px' }}>
            ⚠️ Próximo ao limite da seringa
          </p>
        )}
      </div>

      {/* Como aspirar */}
      <div className="card">
        <p style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--primary)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
        }}>
          💉 Como aspirar
        </p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {guidance}
        </p>
      </div>

      {/* Detalhes colapsáveis */}
      <details className="card" style={{ padding: '1rem 1.375rem' }}>
        <summary style={{
          fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)',
          cursor: 'pointer', listStyle: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none',
        }}>
          <span>📊 Ver detalhes do cálculo</span>
          <span style={{ fontSize: '11px' }}>▼</span>
        </summary>

        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Concentração', value: `${result.concentration.toFixed(1)} mg/mL` },
            { label: 'Volume',       value: `${result.volume.toFixed(3)} mL` },
            { label: 'Resultado',    value: `${result.ui} UI`, highlight: true },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 12px', borderRadius: '10px',
              background: row.highlight ? 'var(--primary-light)' : 'var(--surface-2)',
              border: row.highlight ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: row.highlight ? 'var(--primary-dark)' : 'var(--text-primary)', fontFamily: 'monospace' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
