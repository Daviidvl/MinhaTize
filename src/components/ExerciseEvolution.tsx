import { useState } from 'react'
import { TrendingDown, CalendarDays, Lightbulb, Check } from 'lucide-react'
import { UserProfile } from '../types'
import { daysSince } from '../utils/dashboardUtils'
import {
  DAY_FULL, calcStreak, calcBestStreak, getFavoriteDay, getWeeklyStats, getEvolutionInsight,
} from '../utils/exerciseUtils'

interface Props {
  profile: UserProfile
  workoutLog: string[]
  target: number  // treinos por semana do plano
}

const WEEKS  = 8
const BAR_H  = 72
const LINE_H = 64
const LINE_PAD = 18

function weekLabel(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function ExerciseEvolution({ profile, workoutLog, target }: Props) {
  const [sel, setSel] = useState(WEEKS - 1)

  // ── Peso ──────────────────────────────────────────────────────────────────
  const firstWeight = profile.startWeight
  const lastWeight  = profile.weightHistory.at(-1)?.weight ?? profile.currentWeight ?? firstWeight
  const totalLost   = firstWeight - lastWeight
  const toGoal      = lastWeight - profile.goalWeight
  const hasGoal     = profile.startWeight !== profile.goalWeight
  const pct         = hasGoal
    ? Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.goalWeight)) * 100))
    : 0
  const protocolWeeks = Math.floor(daysSince(profile.startDate) / 7)
  const pace          = protocolWeeks >= 1 && totalLost > 0 ? totalLost / protocolWeeks : null

  // ── Treino ────────────────────────────────────────────────────────────────
  const stats = getWeeklyStats(
    workoutLog,
    [{ date: profile.startDate, weight: firstWeight }, ...profile.weightHistory],
    WEEKS,
  )
  const streak      = calcStreak(workoutLog)
  const bestStreak  = calcBestStreak(workoutLog)
  const favoriteDay = getFavoriteDay(workoutLog)

  // Média e adesão contam só a partir da primeira semana com treino registrado
  const firstActive = stats.findIndex(s => s.workouts > 0)
  const active      = firstActive === -1 ? [] : stats.slice(firstActive)
  const avg         = active.length ? active.reduce((sum, s) => sum + s.workouts, 0) / active.length : 0
  const onTarget    = active.filter(s => s.workouts >= target).length

  // ── Escalas dos gráficos ──────────────────────────────────────────────────
  const maxBar = Math.max(target, ...stats.map(s => s.workouts), 1)
  const known  = stats.flatMap(s => (s.weight === null ? [] : [s.weight]))
  const minW   = Math.min(...known)
  const maxW   = Math.max(...known)
  const lineY  = (w: number) => maxW === minW
    ? LINE_H / 2
    : LINE_PAD + (1 - (w - minW) / (maxW - minW)) * (LINE_H - LINE_PAD * 2)
  const colCenter  = (i: number) => `${((i + 0.5) / WEEKS) * 100}%`
  const firstKnown = stats.findIndex(s => s.weight !== null)
  const picked     = stats[sel]

  const band = (
    <div style={{
      position: 'absolute', top: 0, bottom: 0,
      left: `${(sel / WEEKS) * 100}%`, width: `${100 / WEEKS}%`,
      background: 'var(--mist)', borderRadius: '8px', transition: 'left 0.2s ease',
    }} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Resumo */}
      <div style={{
        background: 'var(--g-hero)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: '0 6px 20px rgba(var(--shadow-rgb),0.28), 0 1px 3px rgba(var(--shadow-rgb),0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Sua evolução
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>
              {totalLost > 0 ? '-' : totalLost < 0 ? '+' : ''}{Math.abs(totalLost).toFixed(1)}kg
            </p>
            <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>desde o início do protocolo</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{workoutLog.length}</p>
            <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
              {workoutLog.length === 1 ? 'treino registrado' : 'treinos registrados'}
            </p>
          </div>
        </div>
        {hasGoal && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ height: '6px', borderRadius: '99px', background: 'var(--track-on-dark)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: '99px', background: 'var(--g-ring)', transition: 'width 0.9s var(--ease-smooth)' }} />
            </div>
            <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px' }}>
              {toGoal <= 0 ? 'Meta de peso atingida' : `${pct.toFixed(0)}% da meta · faltam ${toGoal.toFixed(1)}kg`}
            </p>
          </div>
        )}
      </div>

      {/* Constância */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Sequência atual',  value: `${streak}`,     sub: streak === 1 ? 'semana seguida' : 'semanas seguidas', good: streak > 0 },
          { label: 'Melhor sequência', value: `${bestStreak}`, sub: bestStreak === 1 ? 'semana' : 'semanas', good: false },
          { label: 'Média semanal',    value: active.length ? avg.toFixed(1) : '--', sub: `treinos · meta ${target}`, good: false },
          { label: 'Meta batida',      value: active.length ? `${onTarget}/${active.length}` : '--', sub: 'semanas', good: active.length > 0 && onTarget === active.length },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '0.9rem 1rem' }}>
            <p className="label-base" style={{ marginBottom: '4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px', color: s.good ? 'var(--teal-d)' : 'var(--text-primary)' }}>
              {s.value}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Treinos e peso por semana */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Treinos e peso
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '14px' }}>
          Últimas {WEEKS} semanas · toque em uma semana
        </p>

        {/* Treinos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <p className="label-base" style={{ margin: 0 }}>Treinos</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--teal)' }} />
              Meta batida
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', borderTop: '1px dashed var(--border-strong)' }} />
              Meta {target}×
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', height: `${BAR_H}px`, display: 'flex', alignItems: 'flex-end' }}>
          {band}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: `${(target / maxBar) * BAR_H}px`,
            borderTop: '1px dashed var(--border-strong)',
          }} />
          {stats.map((s, i) => (
            <button
              key={i}
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              aria-label={`Semana de ${weekLabel(s.start)}: ${s.workouts} ${s.workouts === 1 ? 'treino' : 'treinos'}${s.weight !== null ? `, ${s.weight}kg` : ''}`}
              style={{
                position: 'relative', flex: 1, height: '100%', padding: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}
            >
              <span style={{
                display: 'block', width: '56%', maxWidth: '22px',
                height: `${Math.max((s.workouts / maxBar) * BAR_H, 2)}px`,
                borderRadius: s.workouts > 0 ? '4px 4px 0 0' : '1px',
                background: s.workouts === 0 ? 'var(--border-strong)' : s.workouts >= target ? 'var(--teal)' : 'var(--azure)',
                transition: 'height 0.5s ease',
              }} />
            </button>
          ))}
        </div>

        {/* Peso */}
        {known.length > 0 && (
          <>
            <p className="label-base" style={{ margin: '14px 0 4px' }}>Peso (kg)</p>
            <div style={{ position: 'relative', height: `${LINE_H}px` }}>
              {band}
              <svg
                width="100%" height={LINE_H} viewBox={`0 0 ${WEEKS * 100} ${LINE_H}`}
                preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }} aria-hidden="true"
              >
                <polyline
                  points={stats.flatMap((s, i) => (s.weight === null ? [] : [`${(i + 0.5) * 100},${lineY(s.weight)}`])).join(' ')}
                  fill="none" stroke="var(--cobalt)" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                />
              </svg>
              {stats.map((s, i) => {
                if (s.weight === null) return null
                const y = lineY(s.weight)
                const labeled = i === firstKnown || i === WEEKS - 1
                return (
                  <div key={i}>
                    {(s.weighed || labeled) && (
                      <span style={{
                        position: 'absolute', left: colCenter(i), top: `${y}px`,
                        width: '8px', height: '8px', borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'var(--cobalt)', boxShadow: '0 0 0 2px var(--surface)',
                      }} />
                    )}
                    {labeled && (
                      <span style={{
                        position: 'absolute', left: colCenter(i), top: `${y - 17}px`,
                        transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                        fontSize: '10px', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)',
                      }}>
                        {s.weight}
                      </span>
                    )}
                  </div>
                )
              })}
              {stats.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSel(i)}
                  tabIndex={-1} aria-hidden="true"
                  style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${(i / WEEKS) * 100}%`, width: `${100 / WEEKS}%`,
                    padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Eixo das semanas */}
        <div style={{ display: 'flex', marginTop: '6px' }}>
          {stats.map((s, i) => (
            <span key={i} style={{
              flex: 1, textAlign: 'center', fontSize: '9px',
              fontWeight: sel === i ? 800 : 600,
              color: sel === i ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              {weekLabel(s.start)}
            </span>
          ))}
        </div>

        {/* Semana selecionada */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          marginTop: '12px', padding: '9px 12px', borderRadius: '12px',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
            Semana de {weekLabel(picked.start)}
          </p>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            {picked.workouts >= target && <Check size={13} strokeWidth={2.5} style={{ color: 'var(--teal-d)' }} />}
            {picked.workouts} {picked.workouts === 1 ? 'treino' : 'treinos'}
            {picked.weight !== null && ` · ${picked.weight}kg`}
          </p>
        </div>
      </div>

      {/* Destaques */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          favoriteDay !== null && {
            icon: <CalendarDays size={16} strokeWidth={1.75} />,
            label: 'Dia em que você mais treina', value: DAY_FULL[favoriteDay],
          },
          pace !== null && {
            icon: <TrendingDown size={16} strokeWidth={1.75} />,
            label: 'Ritmo médio de perda', value: `${pace.toFixed(1)}kg por semana`,
          },
        ].flatMap(row => (row ? [row] : [])).map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--ice)', color: 'var(--cobalt)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {row.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{row.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, marginTop: '1px' }}>{row.value}</p>
            </div>
          </div>
        ))}
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start',
          padding: '9px 12px', borderRadius: '12px',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <Lightbulb size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-muted)' }} />
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            {getEvolutionInsight(workoutLog.length, totalLost, onTarget, active.length)}
          </p>
        </div>
      </div>
    </div>
  )
}
