import { useState, useEffect } from 'react'
import { AmpolaOption, DoseOption, SyringeOption, CalculationResult } from '../types'
import { calculateDose,} from '../utils/calculator'
import Result from './Result'

// Opções predefinidas
const AMPOLAS: AmpolaOption[] = [
  { value: '15-0.5', label: '15mg / 0,5mL', mg: 15, ml: 0.5 },
  { value: '30-1', label: '30mg / 1mL', mg: 30, ml: 1 },
  { value: '60-2', label: '60mg / 2mL', mg: 60, ml: 2 },
]

const DOSES: DoseOption[] = [
  { value: 2.5, label: '2,5mg' },
  { value: 5, label: '5mg' },
  { value: 7.5, label: '7,5mg' },
  { value: 10, label: '10mg' },
  { value: 12.5, label: '12,5mg' },
  { value: 15, label: '15mg' },
]

const SYRINGES: SyringeOption[] = [
  { value: 30, label: '30 UI', maxUI: 30 },
  { value: 50, label: '50 UI', maxUI: 50 },
  { value: 100, label: '100 UI', maxUI: 100 },
]

export default function Calculator() {
  const [selectedAmpola, setSelectedAmpola] = useState<AmpolaOption>(AMPOLAS[0])
  const [selectedDose, setSelectedDose] = useState<number>(DOSES[0].value)
  const [selectedSyringe, setSelectedSyringe] = useState<number>(SYRINGES[2].value)
  const [result, setResult] = useState<CalculationResult | null>(null)

  // Calcular resultado sempre que um valor mudar
  const handleCalculate = () => {
    const newResult = calculateDose(
      { mg: selectedAmpola.mg, ml: selectedAmpola.ml },
      selectedDose,
      selectedSyringe
    )
    setResult(newResult)
  }

  // Atualizar resultado sempre que houver mudança
  const handleAmpolaChange = (value: string) => {
    const ampola = AMPOLAS.find((a) => a.value === value) || AMPOLAS[0]
    setSelectedAmpola(ampola)
  }

  const handleDoseChange = (value: string) => {
    const dose = parseFloat(value)
    setSelectedDose(dose)
  }

  const handleSyringeChange = (value: string) => {
    setSelectedSyringe(parseInt(value))
  }

  // Recalcular quando valores mudam
  useEffect(() => {
    handleCalculate()
  }, [selectedAmpola, selectedDose, selectedSyringe])

  return (
    <div className="space-y-8">
      {/* Seção de Entrada */}
      <div className="card space-y-6">
        <h2 className="text-2xl font-jakarta font-700 text-tize-lilac-2">
          Informações
        </h2>

        {/* Campo 1: Ampola */}
        <div>
          <label
            htmlFor="ampola"
            className="label-base text-tize-lilac-1"
          >
            Concentração da Ampola
          </label>
          <select
            id="ampola"
            value={selectedAmpola.value}
            onChange={(e) => handleAmpolaChange(e.target.value)}
            className="select-field"
            aria-label="Selecione a concentração da ampola"
          >
            {AMPOLAS.map((ampola) => (
              <option key={ampola.value} value={ampola.value}>
                {ampola.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campo 2: Dose */}
        <div>
          <label
            htmlFor="dose"
            className="label-base text-tize-lilac-1"
          >
            Dose Desejada
          </label>
          <select
            id="dose"
            value={selectedDose.toString()}
            onChange={(e) => handleDoseChange(e.target.value)}
            className="select-field"
            aria-label="Selecione a dose desejada"
          >
            {DOSES.map((dose) => (
              <option key={dose.value} value={dose.value}>
                {dose.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campo 3: Seringa */}
        <div>
          <label
            htmlFor="syringe"
            className="label-base text-tize-lilac-1"
          >
            Tipo de Seringa
          </label>
          <select
            id="syringe"
            value={selectedSyringe.toString()}
            onChange={(e) => handleSyringeChange(e.target.value)}
            className="select-field"
            aria-label="Selecione o tipo de seringa"
          >
            {SYRINGES.map((syringe) => (
              <option key={syringe.value} value={syringe.value}>
                {syringe.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seção de Resultado */}
      {result && (
        <Result
          result={result}
          doseDesejada={selectedDose}
          syringeCapacity={selectedSyringe}
        />
      )}
    </div>
  )
}
