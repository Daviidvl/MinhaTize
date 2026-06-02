import { CalculationResult } from '../types'
import { generateGuidance } from '../utils/calculator'

interface ResultProps {
  result: CalculationResult
  doseDesejada: number
  syringeCapacity: number
}

const stepBox = (accent = false): React.CSSProperties => accent
  ? { background: 'rgba(232,168,32,0.08)', borderColor: 'rgba(232,168,32,0.3)', border: '1px solid rgba(232,168,32,0.3)', borderRadius: '10px', padding: '0.75rem' }
  : { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem', transition: 'background 0.3s, border-color 0.3s' }

export default function Result({ result, syringeCapacity }: ResultProps) {
  if (!result.isValid) {
    return (
      <div className="card-warning flex items-start gap-4">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg mt-1"
          style={{ background: 'rgba(232,168,32,0.2)', color: 'var(--gold-dark)' }}
          aria-hidden="true"
        >
          ⚠
        </div>
        <div>
          <h3 className="font-jakarta font-700 text-lg" style={{ color: 'var(--gold-dark)' }}>Atenção</h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--warn-text)' }} role="alert">
            {result.error}
          </p>
          <p className="text-xs mt-2 font-medium" style={{ color: 'var(--gold-dark)' }}>
            Consulte seu médico para ajustar a dose.
          </p>
        </div>
      </div>
    )
  }

  const guidance = generateGuidance(result.ui)

  return (
    <div className="space-y-6">
      {/* Card de Resultado */}
      <div
        className="rounded-16 p-8 text-center"
        style={{
          background: 'var(--result-bg)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
          transition: 'background 0.3s ease',
        }}
      >
        <div
          className="inline-block px-3 py-1 rounded-full mb-3"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-jakarta font-700 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Resultado
          </p>
        </div>
        <p
          className="font-jakarta font-800 leading-none"
          style={{ fontSize: '76px', color: 'var(--gold)' }}
          role="status"
          aria-live="polite"
          aria-label={`${result.ui} unidades`}
        >
          {result.ui}
        </p>
        <p className="text-sm font-jakarta font-600 mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Unidades (UI)
        </p>
      </div>

      {/* Como Aspirar */}
      <div className="card space-y-3">
        <h3
          className="text-sm font-jakarta font-700 uppercase tracking-wide"
          style={{ color: 'var(--navy-mid)' }}
        >
          💉 Como Aspirar
        </h3>
        <p
          className="text-base font-jakarta font-500 leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Instrução de como aspirar na seringa"
        >
          {guidance}
        </p>
      </div>

      {/* Accordion - Detalhes */}
      <details className="card group">
        <summary
          className="font-jakarta font-600 select-none cursor-pointer flex items-center justify-between"
          style={{ color: 'var(--navy-mid)' }}
        >
          <span>📊 Ver Detalhes do Cálculo</span>
          <span
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-sm group-open:rotate-180 transition-transform duration-300"
            style={{ background: 'var(--surface-2)', color: 'var(--navy-mid)' }}
          >
            ▼
          </span>
        </summary>

        <div
          className="mt-6 pt-6 space-y-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {[
            { label: 'Concentração', value: `${result.concentration.toFixed(1)} mg/mL`, accent: false },
            { label: 'Volume',       value: `${result.volume.toFixed(3)} mL`,            accent: false },
            { label: 'Resultado Final', value: `${result.ui} UI`,                        accent: true  },
          ].map((step, i) => (
            <div key={step.label} className="flex gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--navy)' }}
              >
                <span className="text-sm font-jakarta font-800" style={{ color: 'var(--gold)' }}>
                  {i + 1}
                </span>
              </div>
              <div className="flex-1">
                <p
                  className="text-xs font-jakarta font-700 uppercase tracking-wide mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {step.label}
                </p>
                <div style={stepBox(step.accent)}>
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {step.value}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Capacidade da Seringa */}
          <div
            className="rounded-[10px] p-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', transition: 'background 0.3s, border-color 0.3s' }}
          >
            <p className="text-xs font-jakarta font-600 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Capacidade da Seringa
            </p>
            <p className="text-base font-jakarta font-700 mt-2" style={{ color: 'var(--text-primary)' }}>
              {syringeCapacity} UI
            </p>
            {result.ui > syringeCapacity * 0.8 && result.ui <= syringeCapacity && (
              <p className="text-xs font-jakarta font-600 mt-3 flex items-center gap-2" style={{ color: 'var(--gold-dark)' }}>
                ⚠️ Dose próxima ao limite da seringa
              </p>
            )}
          </div>
        </div>
      </details>
    </div>
  )
}
