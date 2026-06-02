import { CalculationResult } from '../types'
import { generateGuidance } from '../utils/calculator'

interface ResultProps {
  result: CalculationResult
  doseDesejada: number
  syringeCapacity: number
}

export default function Result({
  result,
  doseDesejada,
  syringeCapacity,
}: ResultProps) {
  if (!result.isValid) {
    return (
      <div className="card border-2 border-red-500 bg-red-50">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
            aria-hidden="true"
          >
            !
          </div>
          <div>
            <h3 className="font-bold text-red-700 text-lg">Atenção</h3>
            <p className="text-red-600 mt-1 text-base" role="alert">
              {result.error}
            </p>
            <p className="text-red-500 text-sm mt-2">
              Consulte seu médico para ajustar a dose.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const guidance = generateGuidance(result.ui)

  return (
    <div className="space-y-4">
      {/* Resultado Principal */}
      <div className="card border-4 border-tize-gold bg-gradient-to-br from-tize-light to-white">
        <div className="text-center">
          <p className="text-sm font-semibold text-tize-dark uppercase tracking-wider">
            Resultado
          </p>
          <p
            className="text-6xl font-bold text-tize-blue my-4"
            role="status"
            aria-live="polite"
            aria-label={`${result.ui} unidades`}
          >
            {result.ui}
          </p>
          <p className="text-lg font-semibold text-gray-700">Unidades (UI)</p>
        </div>
      </div>

      {/* Orientação de Uso */}
      <div className="card bg-tize-light border-l-4 border-tize-blue">
        <h3 className="text-sm font-bold text-tize-dark uppercase tracking-wider mb-2">
          Orientação de Uso
        </h3>
        <p
          className="text-base leading-relaxed text-gray-800 font-semibold"
          aria-label="Instrução de como aspirar na seringa"
        >
          {guidance}
        </p>
      </div>

      {/* Detalhes do Cálculo */}
      <details className="card bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
        <summary className="font-semibold text-tize-dark select-none">
          📊 Ver detalhes do cálculo
        </summary>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Dose desejada:</span>
            <span className="font-semibold text-gray-900">{doseDesejada}mg</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Concentração da ampola:</span>
            <span className="font-semibold text-gray-900">
              {result.concentration.toFixed(1)}mg/mL
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Volume a aspirar:</span>
            <span className="font-semibold text-gray-900">
              {result.volume.toFixed(3)}mL
            </span>
          </div>
          <div className="flex justify-between items-center py-2 bg-tize-light px-2 rounded">
            <span className="text-tize-dark font-semibold">UI (resultado):</span>
            <span className="font-bold text-tize-blue text-lg">{result.ui}</span>
          </div>
        </div>
      </details>

      {/* Informação sobre a Seringa */}
      <div className="text-xs text-center text-gray-500 px-4 py-2">
        Capacidade da seringa: {syringeCapacity} UI
        {result.ui > syringeCapacity * 0.8 && result.ui <= syringeCapacity && (
          <p className="text-yellow-600 font-semibold mt-1">
            ⚠️ Dose próxima ao limite da seringa
          </p>
        )}
      </div>
    </div>
  )
}
