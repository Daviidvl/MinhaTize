import { Check, Dumbbell, ChevronRight } from 'lucide-react'
import { DAY_ICON_MAP } from '../data/exercisePlans'
import {
  type WorkoutHistory,
  calcStreak, getMotivation, plannedLabel, focusWorkoutLabel,
} from '../utils/exerciseUtils'
import { toDateStr, getWeekDays } from '../utils/dateUtils'
import { alpha } from '../utils/color'
import { HeroCard, HeroEyebrow, GoalRing, DarkMeter, WeekStrip, type StripDay } from './HeroShared'

const FONT = 'Inter, -apple-system, sans-serif'

export interface WorkoutSummary {
  label: string
  name: string
  color: string
  total: number  // exercícios do treino no local escolhido
}

interface Props {
  workouts: WorkoutSummary[]
  checks: Record<string, number[]>  // marcações de hoje
  workoutLog: string[]              // dias com treino completo
  history: WorkoutHistory
  target: number                    // meta semanal = nº de treinos da divisão
  sets: string
  schedule: number[]                // dias da semana (0=dom) de cada treino, na ordem da divisão
  onOpenWorkout: () => void         // abre a lista já com o treino em foco expandido
}

// Tela inicial de treinos: card azul da semana + treino sugerido para agora
export default function ExerciseToday(p: Props) {
  const today    = toDateStr(new Date())
  const week     = getWeekDays().map(toDateStr)
  const done     = week.filter(d => p.workoutLog.includes(d)).length
  const streak   = calcStreak(p.workoutLog)
  const labels   = p.workouts.map(w => w.label)
  const left     = Math.max(0, p.target - done)

  const plannedOn = (date: string) => plannedLabel(p.schedule, labels, date)

  const todayComplete = p.workoutLog.includes(today)
  const restDay       = !plannedOn(today) && !p.history[today] && !todayComplete
  const focusLabel    = focusWorkoutLabel(p.history, labels, p.schedule, today)
  const focus         = p.workouts.find(w => w.label === focusLabel) ?? p.workouts[0]
  const focusDone     = focus ? Array.from({ length: focus.total }, (_, i) => i).filter(i => p.checks[focus.label]?.includes(i)).length : 0
  const upcoming      = labels.length ? labels[(labels.indexOf(focus?.label ?? '') + 1) % labels.length] : undefined

  const nameOf = (label: string) => p.workouts.find(w => w.label === label)?.name

  // Semana: anel = exercícios do treino do dia · letra = qual treino
  const stripDays: StripDay[] = week.map(date => {
    const entry    = p.history[date]
    const complete = p.workoutLog.includes(date)
    const name     = entry && nameOf(entry.label)
    const plan     = plannedOn(date)
    return {
      date,
      pct: entry && entry.total > 0 ? entry.done / entry.total : complete ? 1 : 0,
      complete,
      mark: entry?.label,
      summary: entry
        ? `Treino ${entry.label}${name ? ` — ${name}` : ''} · ${entry.done}/${entry.total} exercícios`
        : complete ? 'Treino concluído'
        : plan ? `Treino ${plan} planejado · não registrado`
        : 'Dia de descanso',
      ariaLabel: entry
        ? `treino ${entry.label}, ${entry.done} de ${entry.total} exercícios`
        : complete ? 'treino concluído'
        : plan ? `treino ${plan} planejado, não registrado`
        : 'dia de descanso',
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── Semana de treino ──────────────────────────────────────────── */}
      <HeroCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
          <GoalRing pct={p.target > 0 ? done / p.target : 0} label={`Treinos da semana: ${done} de ${p.target}`}>
            {done >= p.target && <Check size={20} strokeWidth={2.5} color="var(--aqua)" style={{ marginBottom: '1px' }} />}
            <p style={{ fontSize: done >= p.target ? '20px' : '26px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.8px' }}>
              {done}<span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.8 }}>/{p.target}</span>
            </p>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#fff', opacity: 0.8, margin: '3px 0 0' }}>treinos</p>
          </GoalRing>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <HeroEyebrow>Treinos da semana</HeroEyebrow>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '2px 0 0', letterSpacing: '-0.3px' }}>
                {left === 0 ? 'Meta batida' : `Falta${left > 1 ? 'm' : ''} ${left} treino${left > 1 ? 's' : ''}`}
              </p>
            </div>
            {focus && (
              <DarkMeter
                label={restDay ? 'Hoje' : `Hoje · Treino ${focus.label}`}
                value={restDay ? 'Descanso' : todayComplete ? 'Feito' : `${focusDone}/${focus.total}`}
                pct={todayComplete ? 100 : focus.total > 0 ? (focusDone / focus.total) * 100 : 0}
              />
            )}
          </div>
        </div>

        <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', margin: '14px 0 0', lineHeight: 1.45, position: 'relative' }}>
          {getMotivation(done, p.target, streak)}
        </p>

        <WeekStrip
          days={stripDays}
          headline={{ value: done, text: ` de ${p.target} treinos` }}
          streak={streak} streakSuffix=" sem" streakLabel="semanas seguidas com treino"
        />
      </HeroCard>

      {/* ── Treino de agora ───────────────────────────────────────────── */}
      {focus && (
        <button
          onClick={p.onOpenWorkout}
          className="meal-row"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
            borderRadius: '18px', cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
            background: 'var(--surface)', border: `1.5px solid ${alpha(focus.color, 19)}`,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <span style={{
            width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
            background: alpha(focus.color, 9), border: `1px solid ${alpha(focus.color, 19)}`, color: focus.color,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
          }}>
            {DAY_ICON_MAP[focus.label] ?? <Dumbbell size={18} strokeWidth={1.75} />}
            <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.05em' }}>{focus.label}</span>
          </span>

          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: todayComplete ? 'var(--teal-d)' : focusDone > 0 ? focus.color : 'var(--text-muted)',
            }}>
              {todayComplete ? 'Concluído hoje' : focusDone > 0 ? 'Em andamento' : restDay ? 'Dia de descanso' : 'Treino de hoje'}
            </span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              Treino {focus.label} — {focus.name}
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {todayComplete && upcoming && upcoming !== focus.label
                ? `Próximo: Treino ${upcoming}${nameOf(upcoming) ? ` — ${nameOf(upcoming)}` : ''}`
                : restDay
                  ? 'Se quiser treinar hoje, este é o próximo'
                  : focusDone > 0
                  ? `${focusDone} de ${focus.total} feitos · ${p.sets} séries`
                  : `${focus.total} exercícios · ${p.sets} séries`}
            </span>
            {focusDone > 0 && !todayComplete && (
              <span className="progress-track" style={{ display: 'block', height: '5px', marginTop: '8px' }}>
                <span className="progress-fill" style={{ display: 'block', width: `${(focusDone / focus.total) * 100}%` }} />
              </span>
            )}
          </span>

          {todayComplete ? (
            <ChevronRight size={16} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          ) : (
            <span style={{
              flexShrink: 0, padding: '8px 12px', borderRadius: '11px',
              background: 'var(--cobalt)', color: '#fff', fontSize: '12px', fontWeight: 800,
            }}>
              {focusDone > 0 ? 'Continuar' : restDay ? 'Treinar' : 'Começar'}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
