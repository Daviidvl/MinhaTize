import { CalculationResult } from '../types'
import { generateGuidance } from '../utils/calculator'

interface ResultProps {
  result: CalculationResult
  doseDesejada: number
  syringeCapacity: number
}

export default function Result({
  result,
  syringeCapacity,
}: ResultProps) {
  if (!result.isValid) {
    return (
      <div className="card-purple border-[rgba(239,159,39,0.5)]">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-8 h-8 bg-[rgba(239,159,39,0.3)] rounded-full flex items-center justify-center text-[#EF9F27] font-bold text-lg mt-1"
            aria-hidden="true"
          >
            ⚠
          </div>
          <div className="flex-1">
            <h3 className="font-jakarta font-700 text-[#EF9F27] text-lg">
              Atenção
            </h3>
            <p className="text-tize-text-secondary mt-1 text-sm leading-relaxed" role="alert">
              {result.error}
            </p>
            <p className="text-[rgba(239,159,39,0.6)] text-xs mt-2 font-medium">
              Consulte seu médico para ajustar a dose.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const guidance = generateGuidance(result.ui)

  return (
    <div className="space-y-6">
      {/* Card de Resultado */}
      <div className="card-purple">
        <div className="text-center">
          <p className="text-xs font-jakarta font-800 text-tize-lilac-1 uppercase tracking-widest">
            Resultado
          </p>
          <p
            className="text-7xl font-jakarta font-800 text-tize-lilac-2 my-4"
            role="status"
            aria-live="polite"
            aria-label={`${result.ui} unidades`}
          >
            {result.ui}
          </p>
          <p className="text-base font-jakarta font-600 text-tize-text">
            Unidades (UI)
          </p>
        </div>
      </div>

      {/* Orientação de Uso */}
      <div className="card space-y-4">
        <h3 className="text-sm font-jakarta font-700 text-tize-lilac-2 uppercase tracking-wide">
          💉 Como Aspirar
        </h3>
        <p
          className="text-base font-jakarta font-500 text-tize-text leading-relaxed"
          aria-label="Instrução de como aspirar na seringa"
        >
          {guidance}
        </p>
      </div>

      {/* Accordion - Detalhes */}
      <details className="card group">
        <summary className="font-jakarta font-600 text-tize-lilac-1 select-none cursor-pointer flex items-center gap-2 justify-between">
          <span>📊 Ver Detalhes do Cálculo</span>
          <span className="text-xl group-open:rotate-180 transition-transform duration-300">▼</span>
        </summary>

        <div className="mt-6 pt-6 border-t border-glass space-y-6">
          {/* Passo 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-tize-purple flex items-center justify-center">
                <span className="text-sm font-jakarta font-800 text-tize-text">1</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-jakarta font-700 text-tize-lilac-1 uppercase tracking-wide">
                Concentração
              </p>
              <div className="mt-1 bg-glass rounded-10 p-3 border border-glass">
                <p className="font-mono text-sm text-tize-text">
                  Concentração = <span className="text-tize-lilac-2 font-bold">{result.concentration.toFixed(1)} mg/mL</span>
                </p>
              </div>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-tize-purple flex items-center justify-center">
                <span className="text-sm font-jakarta font-800 text-tize-text">2</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-jakarta font-700 text-tize-lilac-1 uppercase tracking-wide">
                Volume
              </p>
              <div className="mt-1 bg-glass rounded-10 p-3 border border-glass">
                <p className="font-mono text-sm text-tize-text">
                  Volume = <span className="text-tize-lilac-2 font-bold">{result.volume.toFixed(3)} mL</span>
                </p>
              </div>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-tize-lilac-2 flex items-center justify-center">
                <span className="text-sm font-jakarta font-800 text-tize-dark-bg">3</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-jakarta font-700 text-tize-lilac-1 uppercase tracking-wide">
                Resultado Final
              </p>
              <div className="mt-1 bg-[rgba(124,92,191,0.12)] rounded-10 p-3 border border-tize-purple">
                <p className="font-mono text-sm text-tize-text">
                  UI = Volume × 100 = <span className="text-tize-lilac-2 font-bold">{result.ui} UI</span>
                </p>
              </div>
            </div>
          </div>

          {/* Capacidade da Seringa */}
          <div className="bg-glass rounded-10 p-4 border border-glass">
            <p className="text-xs font-jakarta font-600 text-tize-text-secondary uppercase tracking-wide">
              Capacidade da Seringa
            </p>
            <p className="text-base font-jakarta font-700 text-tize-lilac-2 mt-2">
              {syringeCapacity} UI
            </p>
            {result.ui > syringeCapacity * 0.8 && result.ui <= syringeCapacity && (
              <p className="text-xs font-jakarta font-600 text-[#EF9F27] mt-3 flex items-center gap-2">
                ⚠️ Dose próxima ao limite da seringa
              </p>
            )}
          </div>
        </div>
      </details>
    </div>
  )
}
