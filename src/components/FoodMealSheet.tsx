import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Soup, Check } from 'lucide-react'
import {
  type MealSection, type MealOption, MEAL_WINDOW, APPETITE_MODES, mealOptions,
} from '../data/foodPlans'
import type { AppetiteMode, MealPick } from '../utils/foodUtils'
import { formatHour } from '../utils/foodUtils'
import { OptionCard, PlateOrder } from './FoodShared'

interface Props {
  meal: MealSection
  mode: AppetiteMode
  done: boolean
  pick?: MealPick
  defaultProtein: number
  onPick: (option: MealOption) => void
  onMarkDone: () => void
  onUnmark: () => void
  onClose: () => void
}

// Gaveta de uma refeição: escolher a opção registra a refeição de uma vez
export default function FoodMealSheet({
  meal, mode, done, pick, defaultProtein, onPick, onMarkDone, onUnmark, onClose,
}: Props) {
  const titleId  = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const options  = mealOptions(meal, mode)
  const [start, end] = MEAL_WINDOW[meal.id] ?? [0, 0]
  const isMain   = meal.id === 'almoco' || meal.id === 'jantar'

  // Trava a rolagem do fundo, foca o fechar e fecha com Esc (só ao abrir)
  const closeFn = useRef(onClose)
  closeFn.current = onClose
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFn.current() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [])

  // Portal no body: um ancestral animado (transform) prenderia o position: fixed
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'var(--scrim)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)', borderRadius: '28px 28px 0 0',
          width: '100%', maxWidth: '480px', maxHeight: '88dvh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -16px 60px rgba(var(--shadow-rgb),0.28)',
          border: '1px solid var(--border)', borderBottom: 'none',
          animation: 'slide-up 0.28s cubic-bezier(0.34,1.06,0.64,1) both',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        {/* Cabeçalho */}
        <div style={{ padding: '12px 20px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--border-strong)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
              background: 'var(--ice)', color: 'var(--cobalt)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <meal.Icon size={20} strokeWidth={1.75} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 id={titleId} style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
                {meal.label}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {formatHour(start)}–{formatHour(end)} · meta ~{defaultProtein} g de proteína
              </p>
            </div>
            <button ref={closeRef} onClick={onClose} aria-label="Fechar" style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            }}>
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {mode !== 'normal' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px',
              padding: '8px 12px', borderRadius: '12px', background: 'var(--ice)',
            }}>
              <Soup size={14} strokeWidth={2} color="var(--cobalt)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cobalt)', margin: 0, lineHeight: 1.4 }}>
                Modo {APPETITE_MODES.find(m => m.id === mode)?.label.toLowerCase()}: {APPETITE_MODES.find(m => m.id === mode)?.hint.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* Opções */}
        <div style={{ overflowY: 'auto', padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 2px 2px' }}>
            {done ? 'Você registrou' : 'O que você comeu?'}
          </p>
          <div role="radiogroup" aria-label={`Opções de ${meal.label}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {options.map(opt => (
              <OptionCard
                key={opt.label}
                option={opt}
                selected={done && pick?.label === opt.label}
                onSelect={() => onPick(opt)}
              />
            ))}
          </div>
          {isMain && <div style={{ marginTop: '4px' }}><PlateOrder compact /></div>}
        </div>

        {/* Rodapé */}
        <div style={{
          padding: '12px 20px calc(16px + env(safe-area-inset-bottom))', flexShrink: 0,
          borderTop: '1px solid var(--border)', background: 'var(--bg)',
        }}>
          {done ? (
            <button onClick={onUnmark} className="btn-ghost" style={{ width: '100%', minHeight: '46px', color: 'var(--red)', borderColor: 'var(--red-line)' }}>
              Desmarcar refeição
            </button>
          ) : (
            <button onClick={onMarkDone} className="btn-ghost" style={{ width: '100%', minHeight: '46px', gap: '8px' }}>
              <Check size={16} strokeWidth={2.5} />
              Comi outra coisa — só marcar como feita
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
