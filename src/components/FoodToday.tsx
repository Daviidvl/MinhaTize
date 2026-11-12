import { useState } from 'react'
import { Plus, X, Check, Droplets, ChevronRight, Lightbulb, Utensils } from 'lucide-react'
import {
  type AppetiteMode, type MealSection, type QuickExtra,
  APPETITE_MODES, MEAL_WINDOW, QUICK_EXTRAS, WATER_QUICK_ADD, mealsForMode,
} from '../data/foodPlans'
import {
  type DayLog, type ManualItem,
  formatMl, formatHour, proteinTip, countThisWeek, calcDayStreak,
} from '../utils/foodUtils'
import { alpha } from '../utils/color'
import { ProteinRing, Segmented, SectionLabel, ProteinChip } from './FoodShared'
import { HeroCard, HeroEyebrow, DarkMeter, WeekStrip, type StripDay } from './HeroShared'

const FONT = 'Inter, -apple-system, sans-serif'

// 2950 → "2,95" · 1200 → "1,2"
const liters = (ml: number) => (ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })

export interface WeekDayStat {
  date: string       // AAAA-MM-DD
  protein: number    // g registrados no dia
  mealsDone: number  // refeições principais marcadas
}

interface Props {
  diet: MealSection[]
  day: DayLog
  mode: AppetiteMode
  onModeChange: (m: AppetiteMode) => void
  symptomHint: string | null        // ex.: "náusea" — sugere o modo pouca fome
  mealProtein: Record<string, number>
  protein: number
  proteinGoal: number
  kcal: number
  dailyKcal: number
  waterMl: number
  waterGoalMl: number
  mealDoneDays: string[]
  weekStats: WeekDayStat[]          // dom–sáb da semana atual
  requiredCount: number
  onOpenMeal: (id: string) => void
  onAddExtra: (item: Omit<ManualItem, 'id'>) => void
  onRemoveExtra: (id: string) => void
  onAddWater: (ml: number) => void
  onOpenHydration: () => void
}

export default function FoodToday(p: Props) {
  const hour     = new Date().getHours() + new Date().getMinutes() / 60
  const meals    = mealsForMode(p.diet, p.mode)
  // Refeições opcionais já marcadas continuam visíveis no modo "Sem fome"
  const visible  = p.diet.filter(m => meals.includes(m) || p.day.meals.includes(m.id))
  const required = p.diet.filter(m => m.required)
  const reqDone  = required.filter(m => p.day.meals.includes(m.id)).length
  // "Agora": primeira refeição em aberto cuja janela já começou e ainda não acabou
  const nowId    = visible.find(m => {
    const [s, e] = MEAL_WINDOW[m.id] ?? [0, 0]
    return hour >= s && hour < e && !p.day.meals.includes(m.id)
  })?.id

  const waterPct = Math.round((p.waterMl / p.waterGoalMl) * 100)
  const kcalPct  = Math.round((p.kcal / p.dailyKcal) * 100)
  const week     = countThisWeek(p.mealDoneDays)
  const streak   = calcDayStreak(p.mealDoneDays)

  // Semana no card: anel = proteína × meta · ✓ = todas as refeições principais
  const stripDays: StripDay[] = p.weekStats.map(s => {
    const complete = p.requiredCount > 0 && s.mealsDone >= p.requiredCount
    return {
      date: s.date,
      pct: p.proteinGoal > 0 ? s.protein / p.proteinGoal : 0,
      complete,
      mark: !complete && s.protein > 0 ? String(s.protein) : undefined,
      summary: s.protein > 0 || s.mealsDone > 0
        ? `${s.protein} g de proteína · ${s.mealsDone} de ${p.requiredCount} principais`
        : 'Nada registrado neste dia',
      ariaLabel: `${s.protein} gramas de proteína, ${s.mealsDone} de ${p.requiredCount} refeições principais`,
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Resumo do dia ─────────────────────────────────────────────── */}
      <HeroCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
          <ProteinRing value={p.protein} goal={p.proteinGoal} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <HeroEyebrow>Proteína de hoje</HeroEyebrow>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '2px 0 0', letterSpacing: '-0.3px' }}>
                {p.protein >= p.proteinGoal ? 'Meta batida' : `Faltam ${p.proteinGoal - p.protein} g`}
              </p>
            </div>
            <DarkMeter label="Água" value={`${liters(p.waterMl)} / ${liters(p.waterGoalMl)} L`} pct={waterPct} />
            <DarkMeter label="Energia" value={`${p.kcal.toLocaleString('pt-BR')} / ${p.dailyKcal.toLocaleString('pt-BR')} kcal`} pct={kcalPct} />
          </div>
        </div>

        <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', margin: '14px 0 0', lineHeight: 1.45, position: 'relative' }}>
          {proteinTip(p.protein, p.proteinGoal, hour)}
        </p>

        <WeekStrip
          days={stripDays}
          headline={{ value: week, text: ' de 7 completos' }}
          streak={streak} streakLabel="dias seguidos"
        />
      </HeroCard>

      {/* ── Fome do dia ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 2px' }}>Como está sua fome hoje?</p>
        <Segmented variant="soft" label="Fome de hoje" options={APPETITE_MODES} value={p.mode} onChange={p.onModeChange} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 2px', lineHeight: 1.45 }}>
          {APPETITE_MODES.find(m => m.id === p.mode)?.hint}
        </p>
        {p.symptomHint && p.mode === 'normal' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: 'var(--ice)' }}>
            <Lightbulb size={16} strokeWidth={1.75} color="var(--cobalt)" style={{ flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--cobalt)', margin: 0, lineHeight: 1.4 }}>
              Você registrou {p.symptomHint} esta semana. Refeições menores costumam cair melhor.
            </p>
            <button onClick={() => p.onModeChange('low')} style={{
              padding: '7px 12px', borderRadius: '10px', border: 'none', flexShrink: 0, cursor: 'pointer',
              background: 'var(--cobalt)', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: FONT,
            }}>
              Ativar
            </button>
          </div>
        )}
      </div>

      {/* ── Refeições (linha do tempo) ────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SectionLabel aside={`${reqDone} de ${required.length} principais`}>Refeições</SectionLabel>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {visible.map((meal, i) => (
            <MealRow
              key={meal.id}
              meal={meal}
              done={p.day.meals.includes(meal.id)}
              isNow={meal.id === nowId}
              isLast={i === visible.length - 1}
              pickLabel={p.day.picks?.[meal.id]?.summary ?? p.day.picks?.[meal.id]?.label}
              protein={p.day.picks?.[meal.id]?.protein ?? p.mealProtein[meal.id] ?? 0}
              onOpen={() => p.onOpenMeal(meal.id)}
            />
          ))}
        </ol>
      </div>

      {/* ── Extras ────────────────────────────────────────────────────── */}
      <Extras items={p.day.manual} onAdd={p.onAddExtra} onRemove={p.onRemoveExtra} />

      {/* ── Água ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={p.onOpenHydration} style={{
          display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: 0,
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
        }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'var(--ice)', color: 'var(--cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Droplets size={17} strokeWidth={1.75} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Água</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatMl(p.waterMl)} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>de {formatMl(p.waterGoalMl)} ml</span>
              </span>
            </span>
            <span className="progress-track" style={{ display: 'block', height: '5px', marginTop: '7px' }}>
              <span className="progress-fill" style={{ display: 'block', width: `${Math.min(100, waterPct)}%` }} />
            </span>
          </span>
          <ChevronRight size={16} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {WATER_QUICK_ADD.map(q => (
            <button key={q.ml} onClick={() => p.onAddWater(q.ml)} className="meal-row" aria-label={`Adicionar ${q.ml} ml de água`} style={{
              padding: '9px 6px', borderRadius: '12px', cursor: 'pointer', fontFamily: FONT,
              border: '1.5px solid var(--border)', background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 800, color: 'var(--cobalt)',
            }}>
              <q.Icon size={14} strokeWidth={2} />
              +{q.ml} ml
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Linha da refeição ─────────────────────────────────────────────────────────
function MealRow({
  meal, done, isNow, isLast, pickLabel, protein, onOpen,
}: {
  meal: MealSection; done: boolean; isNow: boolean; isLast: boolean
  pickLabel?: string; protein: number; onOpen: () => void
}) {
  const [start, end] = MEAL_WINDOW[meal.id] ?? [0, 0]
  const sub = done
    ? (pickLabel ?? 'Registrada')
    : `${formatHour(start)}–${formatHour(end)}${meal.note && !meal.required ? ` · ${meal.note.replace(/^Opcional — /, '')}` : ''}`

  return (
    <li style={{ display: 'flex', gap: '12px' }}>
      {/* Trilho */}
      <div aria-hidden style={{ width: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ height: '20px', width: '2px' }} />
        <span className={done ? 'check-btn is-done' : undefined} style={{
          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'var(--teal-d)' : isNow ? 'var(--surface)' : 'var(--surface-2)',
          border: done ? '2px solid var(--teal-d)'
            : isNow ? '2px solid var(--cobalt)'
            : `2px ${meal.required ? 'solid' : 'dashed'} var(--border-strong)`,
          boxShadow: isNow ? `0 0 0 4px ${alpha('var(--cobalt)', 14)}` : 'none',
        }}>
          {done && <Check size={12} strokeWidth={2.5} color="var(--surface)" />}
          {isNow && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cobalt)' }} />}
        </span>
        {!isLast && (
          <div style={{ flex: 1, width: '2px', marginTop: '4px', borderRadius: '2px', background: done ? alpha('var(--teal)', 55) : 'var(--border)' }} />
        )}
      </div>

      {/* Cartão */}
      <button onClick={onOpen} className="meal-row" aria-label={`${meal.label}: ${done ? `registrada${pickLabel ? `, ${pickLabel}` : ''}` : 'escolher o que comeu'}`} style={{
        flex: 1, minWidth: 0, marginBottom: isLast ? 0 : '8px',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 12px 12px 14px', borderRadius: '16px', textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
        background: 'var(--surface)',
        border: `1.5px solid ${isNow ? 'var(--cobalt)' : 'var(--border)'}`,
        boxShadow: isNow ? '0 6px 20px rgba(var(--shadow-rgb),0.10)' : 'var(--shadow-xs)',
      }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{meal.label}</span>
            {isNow && (
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '99px', background: 'var(--cobalt)', color: '#fff', letterSpacing: '0.06em' }}>AGORA</span>
            )}
            {!meal.required && !isNow && (
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>OPCIONAL</span>
            )}
          </span>
          <span style={{
            display: 'block', fontSize: '11px', marginTop: '3px', lineHeight: 1.35,
            color: done ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: done ? 600 : 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sub}
          </span>
        </span>
        {done ? (
          <ProteinChip grams={protein} />
        ) : (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            padding: '6px 10px', borderRadius: '99px',
            background: isNow ? 'var(--cobalt)' : 'var(--ice)', color: isNow ? '#fff' : 'var(--cobalt)',
            fontSize: '11px', fontWeight: 800,
          }}>
            <Plus size={13} strokeWidth={2.5} />
            Registrar
          </span>
        )}
      </button>
    </li>
  )
}

// ── Extras de um toque ────────────────────────────────────────────────────────
function Extras({ items, onAdd, onRemove }: {
  items: ManualItem[]; onAdd: (i: Omit<ManualItem, 'id'>) => void; onRemove: (id: string) => void
}) {
  const [custom, setCustom] = useState(false)
  const [name, setName]     = useState('')
  const [kcal, setKcal]     = useState('')
  const [prot, setProt]     = useState('')

  function addQuick(q: QuickExtra) {
    onAdd({ name: q.label, kcal: q.kcal, protein: q.protein })
  }

  function addCustom() {
    const n = name.trim(); const k = parseInt(kcal); const pr = parseInt(prot)
    if (!n || !(k > 0)) return
    onAdd({ name: n, kcal: k, ...(pr > 0 ? { protein: pr } : {}) })
    setName(''); setKcal(''); setProt(''); setCustom(false)
  }

  const input: React.CSSProperties = {
    minWidth: 0, padding: '10px 12px', borderRadius: '12px', fontSize: '13px',
    border: '1.5px solid var(--border)', background: 'var(--surface-2)',
    color: 'var(--text-primary)', outline: 'none', fontFamily: FONT,
  }

  return (
    <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SectionLabel aside="valores aproximados">Extras e lanches livres</SectionLabel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {QUICK_EXTRAS.map(q => (
          <button key={q.id} onClick={() => addQuick(q)} className="meal-row"
            aria-label={`Adicionar ${q.label} (${q.portion}): ${q.protein} g de proteína, ${q.kcal} kcal`}
            style={{
              padding: '10px 6px', borderRadius: '14px', cursor: 'pointer', fontFamily: FONT,
              border: '1.5px solid var(--border)', background: 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center',
            }}>
            <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'var(--ice)', color: 'var(--cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <q.Icon size={15} strokeWidth={2} />
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{q.label}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--teal-d)' }}>+{q.protein} g</span>
          </button>
        ))}
        <button onClick={() => setCustom(c => !c)} className="meal-row" aria-expanded={custom} style={{
          padding: '10px 6px', borderRadius: '14px', cursor: 'pointer', fontFamily: FONT,
          border: `1.5px dashed ${custom ? 'var(--cobalt)' : 'var(--border-strong)'}`, background: custom ? 'var(--ice)' : 'transparent',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'var(--surface-2)', color: 'var(--cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {custom ? <X size={15} strokeWidth={2} /> : <Plus size={15} strokeWidth={2} />}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cobalt)' }}>{custom ? 'Cancelar' : 'Outro'}</span>
        </button>
      </div>

      {custom && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()} placeholder="O que você comeu?" aria-label="Descrição" style={input} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" inputMode="numeric" value={kcal} onChange={e => setKcal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()} placeholder="kcal" aria-label="Calorias" style={{ ...input, flex: 1 }} />
            <input type="number" inputMode="numeric" value={prot} onChange={e => setProt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()} placeholder="Proteína (g)" aria-label="Proteína em gramas, opcional" style={{ ...input, flex: 1 }} />
            <button onClick={addCustom} aria-label="Adicionar extra" disabled={!name.trim() || !(parseInt(kcal) > 0)} style={{
              width: '44px', borderRadius: '12px', border: 'none', flexShrink: 0,
              background: 'var(--g-cta)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !name.trim() || !(parseInt(kcal) > 0) ? 0.4 : 1,
            }}>
              <Check size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {items.map(m => (
            <li key={m.id} className="fade-in" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 8px 8px 12px', borderRadius: '12px', background: 'var(--surface-2)',
            }}>
              <Utensils size={13} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <p style={{ flex: 1, minWidth: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
                {m.protein ? <span style={{ color: 'var(--teal-d)', fontWeight: 700 }}>{m.protein} g · </span> : null}{m.kcal} kcal
              </p>
              <button onClick={() => onRemove(m.id)} aria-label={`Remover ${m.name}`} style={{
                width: '28px', height: '28px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <X size={14} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 2px', lineHeight: 1.45 }}>
          Comeu algo fora das refeições? Toque para somar proteína e calorias ao dia.
        </p>
      )}
    </div>
  )
}
