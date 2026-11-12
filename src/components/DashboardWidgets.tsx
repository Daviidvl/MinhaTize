import { useState, type ReactNode, type CSSProperties } from 'react'
import { ChevronRight, Moon, GlassWater, Check } from 'lucide-react'
import { UserProfile, Tab } from '../types'
import { VOLUME } from '../data/exercisePlans'
import { MEAL_PREVIEW, WATER_QUICK_ADD } from '../data/foodPlans'
import { getWorkoutPlan, readWorkoutLog, readWorkoutProfile } from '../utils/exerciseUtils'
import {
  type WaterLog, waterGoalMl, waterTotal, formatMl, currentMeal, todayCalories,
  readDietProfile, readWaterLog, saveWaterLog,
} from '../utils/foodUtils'
import { addDays, getMondayOf, todayStr } from '../utils/dateUtils'
import { notifyRemindersChanged } from '../utils/reminderUtils'

// Cartões do Início. Cada um lê do aparelho o que mostra: o Dashboard é
// re-renderizado a cada minuto e a cada registro (useReminders).

type Navigate = (t: Tab, s?: string) => void

// ── Cartão "configurar" (plano ainda não escolhido) ───────────────────────────
function SetupCard({ eyebrow, title, path, onClick }: { eyebrow: string; title: string; path: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px',
      padding: '16px', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
      background: 'var(--surface)', border: '1.5px dashed var(--border-strong)',
      boxShadow: 'var(--shadow-card)', fontFamily: 'Inter, -apple-system, sans-serif',
      minHeight: '136px', transition: 'transform 0.15s, box-shadow 0.2s',
    }}>
      <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0 }}>{eyebrow}</p>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>{title}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{path}</p>
      </div>
      <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />
    </button>
  )
}

// ── Widget de Treino ──────────────────────────────────────────────────────────
export function WorkoutWidget({ onNavigate }: { onNavigate: Navigate }) {
  const wp      = readWorkoutProfile()
  const wLog    = readWorkoutLog()
  const plan    = getWorkoutPlan(wp)
  const today   = todayStr()
  const workout = plan[new Date().getDay()] ?? null

  if (!wp || Object.keys(plan).length === 0) {
    return <SetupCard eyebrow="Treino Hoje" title="Configurar treino" path="Saúde → Exercícios" onClick={() => onNavigate('health', 'exercise')} />
  }

  const isRest   = !workout
  const monday   = getMondayOf(new Date())
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const ds = addDays(monday, i)
    return { ds, isToday: ds === today, done: wLog.includes(ds) }
  })
  const weekDone = weekDots.filter(d => d.done).length
  const [mainName, ...restNames] = workout ? workout.name.split(' + ') : []

  return (
    <button
      onClick={() => onNavigate('health', 'exercise')}
      style={{
        display: 'flex', flexDirection: 'column', gap: '12px',
        padding: '16px', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
        background: 'var(--g-hero)', border: 'none',
        boxShadow: isRest
          ? '0 6px 20px rgba(var(--shadow-rgb),0.2), 0 1px 3px rgba(var(--shadow-rgb),0.12)'
          : '0 6px 20px rgba(var(--shadow-rgb),0.28), 0 1px 3px rgba(var(--shadow-rgb),0.12)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#fff', transition: 'transform 0.15s ease, box-shadow 0.2s ease',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-16px', left: '-8px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Treino Hoje
          </p>
          <ChevronRight size={11} strokeWidth={2.5} color="rgba(255,255,255,0.30)" />
        </div>

        {/* Badge + nome */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: isRest ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.14)',
            border: `1px solid ${isRest ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {workout
              ? <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{workout.label}</span>
              : <Moon size={15} strokeWidth={2} color="rgba(255,255,255,0.50)" />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {workout ? mainName : 'Descanso'}
            </p>
            {restNames.length > 0 && (
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', margin: '0 0 1px', lineHeight: 1.2 }}>
                + {restNames.join(' + ')}
              </p>
            )}
            <p style={{ fontSize: '9px', opacity: 0.38, margin: 0 }}>
              {isRest ? 'Recuperação ativa' : `${wp.days}×/sem · ${VOLUME[wp.level]?.tag ?? wp.level}`}
            </p>
          </div>
        </div>

        {/* Barra semanal */}
        <div>
          <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
            {weekDots.map(d => (
              <div key={d.ds} style={{
                flex: 1, height: '3px', borderRadius: '99px',
                background: d.done
                  ? 'var(--g-ring)'
                  : d.isToday ? 'var(--track-on-dark)' : 'rgba(255,255,255,0.07)',
                outline: d.isToday ? '1.5px solid rgba(255,255,255,0.35)' : 'none',
                outlineOffset: '1.5px',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
          <p style={{ fontSize: '9px', opacity: 0.38, margin: 0, fontWeight: 600 }}>
            {weekDone}/{wp.days} treinos esta semana
          </p>
        </div>
      </div>
    </button>
  )
}

// ── Widget de Refeição ────────────────────────────────────────────────────────
export function MealWidget({ profile, onNavigate }: { profile: UserProfile; onNavigate: Navigate }) {
  const dietProfile = readDietProfile()

  if (!dietProfile) {
    return <SetupCard eyebrow="Alimentação" title="Configurar plano" path="Saúde → Alimentação" onClick={() => onNavigate('health', 'food')} />
  }

  const dietSex             = (dietProfile.sex ?? (profile.sex === 'female' ? 'F' : 'M')) === 'F' ? 'F' : 'M'
  const { id, isCurrent }   = currentMeal()
  const meal                = MEAL_PREVIEW[id]
  const kcal                = todayCalories(todayStr())

  const pct      = kcal?.pct ?? 0
  const consumed = kcal?.consumed ?? 0
  const target   = kcal?.target ?? dietProfile.dailyKcal ?? 0
  const arcR     = 18
  const arcCirc  = 2 * Math.PI * arcR
  const arcOff   = arcCirc * (1 - pct / 100)
  const sub      = meal.sub[dietSex].split(' · ')[0].trim()

  return (
    <button
      onClick={() => onNavigate('health', 'food')}
      style={{
        display: 'flex', flexDirection: 'column', gap: '12px',
        padding: '16px', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
        background: 'var(--g-hero)',
        border: 'none',
        boxShadow: '0 6px 20px rgba(var(--shadow-rgb),0.28), 0 1px 3px rgba(var(--shadow-rgb),0.12)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#fff', transition: 'transform 0.15s ease, box-shadow 0.2s ease',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-16px', left: '-8px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            {isCurrent ? 'Agora' : 'Próxima refeição'}
          </p>
          <ChevronRight size={11} strokeWidth={2.5} color="rgba(255,255,255,0.30)" />
        </div>

        {/* Refeição + arco */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {meal.label}
            </p>
            <p style={{ fontSize: '10px', opacity: 0.50, margin: 0, fontWeight: 500 }}>{sub}</p>
          </div>
          <div style={{ position: 'relative', flexShrink: 0, width: '44px', height: '44px' }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <defs>
                <linearGradient id="ring-agora" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--sky)" />
                  <stop offset="100%" stopColor="var(--aqua)" />
                </linearGradient>
              </defs>
              <circle cx="22" cy="22" r={arcR} fill="none" stroke="var(--track-on-dark)" strokeWidth="4" />
              <circle cx="22" cy="22" r={arcR} fill="none" stroke="url(#ring-agora)" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={arcCirc}
                strokeDashoffset={arcOff}
                transform="rotate(-90 22 22)"
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '9px', fontWeight: 800, margin: 0, lineHeight: 1, opacity: 0.92 }}>{pct}%</p>
            </div>
          </div>
        </div>

        {/* Progresso kcal */}
        <div>
          <div style={{ background: 'var(--track-on-dark)', borderRadius: '99px', height: '3px', overflow: 'hidden', marginBottom: '5px' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'var(--g-ring)',
              borderRadius: '99px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
            }} />
          </div>
          <p style={{ fontSize: '9px', opacity: 0.38, margin: 0, fontWeight: 600 }}>
            {consumed} / {target} kcal hoje
          </p>
        </div>
      </div>
    </button>
  )
}

// ── Widget de Água ────────────────────────────────────────────────────────────
export function WaterWidget({ weight, onNavigate }: { weight: number; onNavigate: Navigate }) {
  const today = todayStr()
  const [log, setLog] = useState<WaterLog>(readWaterLog)

  const goal  = waterGoalMl(weight)
  const total = waterTotal(log[today])
  const pct   = Math.min(100, Math.round((total / goal) * 100))

  function add(ml: number) {
    const updated = { ...log, [today]: [...(log[today] ?? []), ml] }
    setLog(updated)
    saveWaterLog(updated)
    notifyRemindersChanged()
  }

  return (
    <div style={{
      borderRadius: '22px', padding: '14px 18px',
      background: 'var(--g-water), var(--surface)',
      boxShadow: 'inset 0 0 0 1px var(--line), var(--shadow-card)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Resumo: abre a tela de Hidratação */}
      <button
        onClick={() => onNavigate('health', 'food:hydration')}
        aria-label="Abrir hidratação"
        style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            {/* Texto em --ink: o --ink-2 perde contraste sobre o azul do degradê */}
            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 5px', color: 'var(--ink)', opacity: 0.8 }}>
              Água hoje
            </p>
            <p className="num-display" style={{ fontSize: '30px', color: 'var(--ink)', margin: '0 0 2px' }}>
              {formatMl(total)}
              <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.75, marginLeft: '5px', letterSpacing: '0.02em' }}>ml</span>
            </p>
            <p style={{ fontSize: '11px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ink)', opacity: total >= goal ? 1 : 0.8 }}>
              {total >= goal
                ? <><Check size={12} strokeWidth={2.5} style={{ flexShrink: 0, color: 'var(--teal-d)' }} />Meta de {formatMl(goal)} ml atingida</>
                : `de ${formatMl(goal)} ml · faltam ${formatMl(goal - total)} ml`}
            </p>
          </div>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: 'var(--surface)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GlassWater size={19} strokeWidth={1.75} color="var(--cobalt)" />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: '99px', height: '4px', overflow: 'hidden', margin: '10px 0' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'var(--g-progress)',
            borderRadius: '99px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      </button>

      {/* Registro rápido */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {WATER_QUICK_ADD.map(q => (
          <button
            key={q.ml}
            onClick={() => add(q.ml)}
            aria-label={`Registrar ${q.ml} ml de água`}
            className="meal-row"
            style={{
              flex: 1, minHeight: '34px', padding: '6px 4px', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              background: 'var(--surface)', border: '1px solid var(--line)',
              color: 'var(--cobalt)', fontSize: '12px', fontWeight: 800, fontFamily: 'inherit',
            }}
          >
            <q.Icon size={14} strokeWidth={2} />
            +{q.ml} ml
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Tile de Stat ──────────────────────────────────────────────────────────────
export function StatTile({
  label, value, unit, sub, subColor, icon, style,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  subColor?: string
  icon?: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {icon && (
        <div style={{ position: 'absolute', top: '14px', right: '14px', opacity: 0.12 }}>
          {icon}
        </div>
      )}
      <p className="label-base" style={{ marginBottom: '8px' }}>{label}</p>
      <p className="num-display" style={{ fontSize: '28px', color: 'var(--text-primary)', margin: 0 }}>
        {value}
        {unit && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px', letterSpacing: '0' }}>{unit}</span>}
      </p>
      {sub && (
        <p style={{ fontSize: '11px', marginTop: '6px', fontWeight: 700, color: subColor ?? 'var(--primary)', margin: '6px 0 0' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
