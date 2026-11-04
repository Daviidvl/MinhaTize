import { useEffect, useRef, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import {
  type MealSection, type MealOption, APPETITE_MODES, MEAL_WINDOW, mealOptions, mealsForMode,
} from '../data/foodPlans'
import { type AppetiteMode, type DayLog, formatHour } from '../utils/foodUtils'
import { OptionCard, PlateOrder, Segmented } from './FoodShared'

const FONT = 'Inter, -apple-system, sans-serif'

interface Props {
  diet: MealSection[]
  dailyKcal: number
  mealProtein: Record<string, number>
  todayMode: AppetiteMode
  day: DayLog
  onRegister: (mealId: string, option: MealOption) => void
}

// Cardápio para consulta, com atalho para registrar a opção hoje
export default function FoodMenu({ diet, dailyKcal, mealProtein, todayMode, day, onRegister }: Props) {
  const [mode, setMode] = useState<AppetiteMode>(todayMode)
  const meals = mealsForMode(diet, mode)

  // Abre na refeição do horário atual (ou na próxima)
  const hour = new Date().getHours() + new Date().getMinutes() / 60
  const [mealId, setMealId] = useState<string>(() =>
    (meals.find(m => hour < (MEAL_WINDOW[m.id]?.[1] ?? 0)) ?? meals[0]).id
  )
  const meal = meals.find(m => m.id === mealId) ?? meals[0]
  const [start, end] = MEAL_WINDOW[meal.id] ?? [0, 0]
  const isMain = meal.id === 'almoco' || meal.id === 'jantar'

  // Mantém a refeição escolhida visível (centralizada) na faixa rolável
  const trackRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const track = trackRef.current
    const pill  = track?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!track || !pill) return
    track.scrollTo({ left: pill.offsetLeft - track.clientWidth / 2 + pill.clientWidth / 2, behavior: 'smooth' })
  }, [meal.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 2px' }}>
          Opções para dias de
        </p>
        <Segmented variant="soft" label="Opções para dias de" options={APPETITE_MODES} value={mode} onChange={setMode} />
      </div>

      {/* Refeições */}
      <div ref={trackRef} className="insight-track" role="tablist" aria-label="Refeições" style={{ position: 'relative', display: 'flex', gap: '6px', margin: '0 -4px', padding: '2px 4px' }}>
        {meals.map(m => {
          const active = m.id === meal.id
          return (
            <button key={m.id} role="tab" aria-selected={active} onClick={() => setMealId(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
              padding: '8px 12px', borderRadius: '99px', cursor: 'pointer', fontFamily: FONT,
              fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
              background: active ? 'var(--cobalt)' : 'var(--surface)',
              color: active ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${active ? 'var(--cobalt)' : 'var(--border)'}`,
              boxShadow: active ? '0 2px 12px rgba(var(--shadow-rgb),0.22)' : 'none',
              transition: 'all var(--t-base) ease',
            }}>
              <m.Icon size={13} strokeWidth={2} />
              {m.label}
              {day.meals.includes(m.id) && <Check size={12} strokeWidth={2.5} />}
            </button>
          )
        })}
      </div>

      {/* Cabeçalho da refeição */}
      <div key={`${mode}-${meal.id}`} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>{meal.label}</p>
            {!meal.required && (
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>OPCIONAL</span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
            {formatHour(start)}–{formatHour(end)} · ~{Math.round(dailyKcal * meal.kcalShare)} kcal · ~{mealProtein[meal.id] ?? 0} g de proteína
          </p>
          {meal.note && !meal.required && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{meal.note}</p>
          )}
        </div>

        {mealOptions(meal, mode).map(opt => {
          const registered = day.meals.includes(meal.id) && day.picks?.[meal.id]?.label === opt.label
          return (
            <OptionCard
              key={opt.label}
              option={opt}
              footer={
                <button
                  onClick={() => onRegister(meal.id, opt)}
                  disabled={registered}
                  style={{
                    marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 11px', borderRadius: '99px', fontFamily: FONT,
                    fontSize: '11px', fontWeight: 800, cursor: registered ? 'default' : 'pointer',
                    background: registered ? 'var(--teal-l)' : 'var(--ice)',
                    color: registered ? 'var(--teal-d)' : 'var(--cobalt)', border: 'none',
                  }}
                >
                  {registered ? <Check size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
                  {registered ? 'Registrada hoje' : 'Comi hoje'}
                </button>
              }
            />
          )
        })}

        {isMain && <PlateOrder />}
      </div>
    </div>
  )
}
