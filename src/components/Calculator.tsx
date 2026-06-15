import { useState, useEffect } from 'react'
import { AmpolaOption, DoseOption, SyringeOption, CalculationResult } from '../types'
import { calculateDose } from '../utils/calculator'
import Result from './Result'

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

  const handleAmpolaChange = (value: string) => {
    setSelectedAmpola(AMPOLAS.find((a) => a.value === value) || AMPOLAS[0])
  }
  const handleDoseChange = (value: string) => setSelectedDose(parseFloat(value))
  const handleSyringeChange = (value: string) => setSelectedSyringe(parseInt(value))

  useEffect(() => {
    setResult(calculateDose(
      { mg: selectedAmpola.mg, ml: selectedAmpola.ml },
      selectedDose,
      selectedSyringe
    ))
  }, [selectedAmpola, selectedDose, selectedSyringe])

  return (
    <div data-tour="calc-main" className="space-y-8">
      <div className="card space-y-6">
        <h2
          className="text-xl font-jakarta font-700"
          style={{ color: 'var(--text-primary)' }}
        >
          Informações
        </h2>

        <div>
          <label htmlFor="ampola" className="label-base">Concentração da Ampola</label>
          <select
            id="ampola"
            value={selectedAmpola.value}
            onChange={(e) => handleAmpolaChange(e.target.value)}
            className="select-field"
            aria-label="Selecione a concentração da ampola"
          >
            {AMPOLAS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dose" className="label-base">Dose Desejada</label>
          <select
            id="dose"
            value={selectedDose.toString()}
            onChange={(e) => handleDoseChange(e.target.value)}
            className="select-field"
            aria-label="Selecione a dose desejada"
          >
            {DOSES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="syringe" className="label-base">Tipo de Seringa</label>
          <select
            id="syringe"
            value={selectedSyringe.toString()}
            onChange={(e) => handleSyringeChange(e.target.value)}
            className="select-field"
            aria-label="Selecione o tipo de seringa"
          >
            {SYRINGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

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
