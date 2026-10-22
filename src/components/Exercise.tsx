import { useState } from 'react'
import {
  Dumbbell, Droplets, Moon, Waves, Lightbulb, Info,
  RotateCcw, ChevronDown, BarChart2, Check,
} from 'lucide-react'
import { UserProfile } from '../types'
import ExerciseEvolution from './ExerciseEvolution'
import WeekCard from './WeekCard'
import { readJSON, writeJSON, removeKey } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'
import {
  type WorkoutProfile, type WorkoutDays, type SplitKey, type ExerciseView,
  VOLUME, SPLIT_LABEL, SPLITS, DAY_ICON_MAP, EXERCISE_VIEWS,
} from '../data/exercisePlans'
import {
  type DayChecks,
  toDateStr, getWeekDays, calcStreak, getMotivation, isWorkoutComplete,
} from '../utils/exerciseUtils'
import { alpha } from '../utils/color'
import { notifyRemindersChanged } from '../utils/reminderUtils'

const STORAGE_KEY = STORAGE_KEYS.workoutProfile
const LOG_KEY     = STORAGE_KEYS.workoutLog
const CHECKS_KEY  = STORAGE_KEYS.workoutChecks

const SPLIT_HINT: Record<WorkoutDays, string> = {
  2: 'Full Body A/B — 2 treinos, corpo inteiro em cada um',
  3: 'Divisão ABC — 3 treinos, um grupo muscular por treino',
  4: 'Divisão ABCD — 4 treinos, mais volume por grupo',
  5: 'Divisão ABCDE — 5 treinos, foco máximo por músculo',
}

// ── Small helpers ────────────────────────────────────────────────────────────

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: '12px', cursor: 'pointer',
        fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 700, fontSize: '13px',
        border: active ? '2px solid var(--cobalt)' : '1.5px solid var(--border)',
        background: active ? 'var(--ice)' : 'var(--surface-2)',
        color: active ? 'var(--cobalt)' : 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

interface Props {
  userProfile: UserProfile
  view: ExerciseView | null  // null = tela inicial (semana + atalhos)
  onViewChange: (v: ExerciseView | null) => void
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Exercise({ userProfile, view, onViewChange }: Props) {
  const [profile, setProfile] = useState<WorkoutProfile | null>(() => readJSON(STORAGE_KEY, null))

  const [form, setForm] = useState<Partial<WorkoutProfile>>(profile ?? {})
  const [showForm, setShowForm] = useState(profile === null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['A']))

  const formComplete = !!(form.sex && form.level && form.location && form.days)

  const today = toDateStr(new Date())
  const [workoutLog, setWorkoutLog] = useState<string[]>(() => readJSON(LOG_KEY, []))
  const [checks, setChecks] = useState<DayChecks['done']>(() => {
    const saved = readJSON<DayChecks | null>(CHECKS_KEY, null)
    return saved?.date === today ? saved.done : {}
  })

  const splitDays = profile
    ? SPLITS[`${profile.days}_${profile.sex}` as SplitKey]
    : []
  const vol = profile ? VOLUME[profile.level] : null
  const exercisesOf = (day: (typeof splitDays)[number]) => (profile?.location === 'gym' ? day.gym : day.home)
  const anyWorkoutDone = (done: DayChecks['done']) =>
    splitDays.some(day => isWorkoutComplete(done[day.label], exercisesOf(day).length))

  function toggleExercise(label: string, idx: number) {
    const prev = checks[label] ?? []
    const next = { ...checks, [label]: prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx] }
    setChecks(next)
    writeJSON(CHECKS_KEY, { date: today, done: next })

    // O dia só é marcado (ou desmarcado) quando um treino inteiro fica completo (ou deixa de estar)
    const isDone = anyWorkoutDone(next)
    if (isDone !== anyWorkoutDone(checks)) {
      const others = workoutLog.filter(d => d !== today)
      const log = isDone ? [...others, today] : others
      setWorkoutLog(log)
      writeJSON(LOG_KEY, log)
      notifyRemindersChanged()
    }
  }

  function saveProfile() {
    if (!formComplete) return
    const p = form as WorkoutProfile
    writeJSON(STORAGE_KEY, p)
    setProfile(p)
    setShowForm(false)
    setExpandedDays(new Set(['A']))
    onViewChange('workout')
  }

  function resetProfile() {
    removeKey(STORAGE_KEY)
    removeKey(CHECKS_KEY)
    setChecks({})
    setProfile(null)
    setForm({})
    setShowForm(true)
    onViewChange(null)
  }

  function toggleDay(label: string) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // ── Render: form ──────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Banner */}
        <div style={{
          background: 'var(--g-hero)',
          borderRadius: '20px', padding: '18px 20px', color: '#fff',
          boxShadow: '0 6px 20px rgba(var(--shadow-rgb),0.28), 0 1px 3px rgba(var(--shadow-rgb),0.12)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Avaliação de treino
          </p>
          <p style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '8px' }}>
            Treino personalizado para o seu perfil
          </p>
          <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
            Responda as perguntas abaixo e receba um plano adequado ao seu nível, divisão e local de treino.
          </p>
        </div>

        {/* Form card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Sexo */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Sexo biológico
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill active={form.sex === 'M'} onClick={() => setForm(f => ({ ...f, sex: 'M' }))}>Masculino</Pill>
              <Pill active={form.sex === 'F'} onClick={() => setForm(f => ({ ...f, sex: 'F' }))}>Feminino</Pill>
            </div>
          </div>

          {/* Nível */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Nível de experiência
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill active={form.level === 'beginner'}     onClick={() => setForm(f => ({ ...f, level: 'beginner' }))}>Iniciante</Pill>
              <Pill active={form.level === 'intermediate'} onClick={() => setForm(f => ({ ...f, level: 'intermediate' }))}>Intermediário</Pill>
              <Pill active={form.level === 'advanced'}     onClick={() => setForm(f => ({ ...f, level: 'advanced' }))}>Avançado</Pill>
            </div>
          </div>

          {/* Local */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Local de treino
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill active={form.location === 'gym'}  onClick={() => setForm(f => ({ ...f, location: 'gym' }))}>Academia</Pill>
              <Pill active={form.location === 'home'} onClick={() => setForm(f => ({ ...f, location: 'home' }))}>Em casa</Pill>
            </div>
          </div>

          {/* Divisão */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Divisão de treino
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([2, 3, 4, 5] as WorkoutDays[]).map(d => (
                <Pill key={d} active={form.days === d} onClick={() => setForm(f => ({ ...f, days: d }))}>
                  {d === 2 ? 'A/B' : 'ABCDE'.slice(0, d)}
                </Pill>
              ))}
            </div>
            {form.days && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '7px' }}>
                {SPLIT_HINT[form.days]}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={saveProfile}
            disabled={!formComplete}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 800, fontSize: '15px',
              cursor: formComplete ? 'pointer' : 'not-allowed',
              background: formComplete ? 'var(--g-cta)' : 'var(--surface-3)',
              color: formComplete ? '#fff' : 'var(--text-muted)',
              opacity: formComplete ? 1 : 0.6,
              transition: 'all 0.2s',
              boxShadow: formComplete ? 'var(--shadow-green)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Dumbbell size={16} strokeWidth={1.75} />
            Gerar Meu Plano
          </button>
        </div>

        <div className="card-warning">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
            <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
              Os treinos são sugestões educativas e não substituem a orientação de um educador físico. Em caso de dores ou sintomas durante o exercício, interrompa e consulte seu médico.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: plan ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Weekly calendar */}
      {view === null && (() => {
        const weekDays    = getWeekDays()
        const doneThisWeek = weekDays.filter(d => workoutLog.includes(toDateStr(d))).length
        const streak       = calcStreak(workoutLog)

        return (
          <WeekCard title="Semana de treino" done={workoutLog} doneLabel="treino concluído" pendingLabel="sem treino">
            {/* Stats */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doneThisWeek}</span>
              {doneThisWeek === 1 ? ' treino' : ' treinos'} essa semana
              {streak > 0 && (
                <>
                  {' · '}
                  <span style={{ fontWeight: 700, color: 'var(--teal-d)' }}>{streak}</span>
                  {streak === 1 ? ' semana consecutiva' : ' semanas consecutivas'}
                </>
              )}
            </p>

            {/* Motivational message */}
            <div style={{
              padding: '9px 12px', borderRadius: '12px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {getMotivation(doneThisWeek, profile!.days, streak)}
              </p>
            </div>
          </WeekCard>
        )
      })()}

      {/* Treino / Evolução */}
      {view === null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {EXERCISE_VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              style={{
                padding: '14px 10px', borderRadius: '16px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                fontFamily: "Inter, -apple-system, sans-serif",
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                boxShadow: 'var(--shadow-card)', transition: 'transform 0.15s ease',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'var(--ice)', color: 'var(--cobalt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <v.Icon size={20} strokeWidth={1.75} />
              </span>
              <span>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{v.label}</span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{v.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {view === 'evolution' && (
        <ExerciseEvolution profile={userProfile} workoutLog={workoutLog} target={profile!.days} />
      )}

      {view === 'workout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Plan header */}
          <div style={{
            background: 'var(--g-hero)',
            borderRadius: '20px', padding: '18px 20px', color: '#fff',
            boxShadow: '0 6px 20px rgba(var(--shadow-rgb),0.28), 0 1px 3px rgba(var(--shadow-rgb),0.12)', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }} />
            <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Seu plano personalizado
            </p>
            <p style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '10px' }}>
              {SPLIT_LABEL[profile!.days]} · {profile!.days} treinos
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                profile!.sex === 'M' ? 'Masculino' : 'Feminino',
                vol!.tag,
                profile!.location === 'gym' ? 'Academia' : 'Em casa',
              ].map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px',
                  background: 'rgba(255,255,255,0.18)', color: '#fff',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Volume info */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
              <BarChart2 size={14} strokeWidth={2} style={{ color: 'var(--teal-d)', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Volume recomendado</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: 'Séries', value: vol!.sets },
                { label: 'Repetições', value: vol!.reps },
                { label: 'Descanso', value: vol!.rest },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--surface-2)', borderRadius: '10px', padding: '8px',
                  textAlign: 'center', border: '1px solid var(--border)',
                }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--teal-d)', margin: 0 }}>{item.value}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Como registrar */}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 4px' }}>
            Marque cada exercício ao terminar. Quando todos os exercícios de um treino estiverem marcados, o dia de hoje entra na sua semana de treino.
          </p>

          {/* Day cards */}
          {splitDays.map(day => {
            const isOpen    = expandedDays.has(day.label)
            const exercises = exercisesOf(day)
            const checked   = checks[day.label] ?? []
            const doneCount = exercises.filter((_, i) => checked.includes(i)).length
            const complete  = isWorkoutComplete(checked, exercises.length)
            return (
              <div key={day.label} style={{
                borderRadius: '16px', overflow: 'hidden',
                border: `1.5px solid ${isOpen ? alpha(day.color, 19) : 'var(--border)'}`,
                background: isOpen ? alpha(day.color, 2) : 'var(--surface)',
                transition: 'all 0.2s', boxShadow: 'var(--shadow-card)',
              }}>
                <button
                  onClick={() => toggleDay(day.label)}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    textAlign: 'left', fontFamily: "Inter, -apple-system, sans-serif",
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: alpha(day.color, 9), border: `1px solid ${alpha(day.color, 19)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '2px', color: day.color,
                  }}>
                    {DAY_ICON_MAP[day.label] ?? <Dumbbell size={18} strokeWidth={1.75} />}
                    <span style={{ fontSize: '9px', fontWeight: 900, color: day.color, letterSpacing: '0.05em' }}>
                      {day.label}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                      Treino {day.label} — {day.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {complete ? (
                        <span style={{ color: 'var(--teal-d)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Check size={12} strokeWidth={2.5} />Concluído hoje
                        </span>
                      ) : doneCount > 0 ? (
                        <span style={{ color: day.color, fontWeight: 700 }}>{doneCount}/{exercises.length} feitos</span>
                      ) : (
                        <span>{exercises.length} exercícios</span>
                      )}
                      <span>· {vol!.sets} séries</span>
                    </p>
                  </div>
                  <span style={{
                    flexShrink: 0, color: 'var(--text-muted)',
                    transition: 'transform 0.2s', display: 'inline-flex',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                  }}><ChevronDown size={16} strokeWidth={1.75} /></span>
                </button>

                {isOpen && (
                  <div style={{
                    padding: '0 14px 14px',
                    borderTop: `1px solid ${alpha(day.color, 13)}`,
                    display: 'flex', flexDirection: 'column', gap: '7px',
                  }}>
                    {exercises.map((ex, i) => {
                      const done = checked.includes(i)
                      return (
                        <button
                          key={i}
                          role="checkbox"
                          aria-checked={done}
                          onClick={() => toggleExercise(day.label, i)}
                          className="meal-row"
                          style={{
                            width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '9px 12px', borderRadius: '11px',
                            textAlign: 'left', cursor: 'pointer',
                            fontFamily: "Inter, -apple-system, sans-serif",
                            background: done ? 'var(--teal-l)' : 'var(--surface-2)',
                            border: `1px solid ${done ? alpha('var(--teal)', 30) : 'var(--border)'}`,
                          }}
                        >
                          <span
                            className={`check-btn${done ? ' is-done' : ''}`}
                            style={{
                              width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: done ? 'var(--teal-d)' : 'var(--surface)',
                              border: `1.5px solid ${done ? 'var(--teal-d)' : 'var(--border-strong)'}`,
                              color: 'var(--surface)',
                            }}
                          >
                            {done && <Check size={12} strokeWidth={2.5} />}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                              {ex.name}
                            </p>
                            {ex.tip && (
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start', marginTop: '3px' }}>
                                <Lightbulb size={11} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-muted)' }} />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>{ex.tip}</p>
                              </div>
                            )}
                          </div>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, color: day.color,
                            background: alpha(day.color, 8), padding: '2px 7px', borderRadius: '99px',
                            flexShrink: 0, whiteSpace: 'nowrap',
                          }}>
                            {vol!.sets}×{vol!.reps.split('–')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Tips */}
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Lightbulb size={14} strokeWidth={2} style={{ color: 'var(--teal-d)', flexShrink: 0 }} />
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>Dicas práticas</p>
            </div>
            {[
              { icon: <Droplets size={14} strokeWidth={2} />, text: 'Hidratação: aumente a ingestão de água nos dias de treino' },
              { icon: <Dumbbell size={14} strokeWidth={2} />, text: 'Proteína pós-treino: 20–30g auxilia na recuperação muscular' },
              { icon: <Moon     size={14} strokeWidth={2} />, text: 'Sono: ao menos 7h para o corpo recuperar e recompor a massa' },
              { icon: <Waves    size={14} strokeWidth={2} />, text: 'Sintomas de GLP-1? Caminhada leve de 15 min já é válida e benéfica' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>{t.icon}</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{t.text}</p>
              </div>
            ))}
          </div>

          {/* Refazer */}
          <button
            onClick={resetProfile}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)',
              background: 'var(--surface-2)', cursor: 'pointer',
              fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 700, fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
          >
            <RotateCcw size={14} strokeWidth={2} />
            Refazer avaliação
          </button>
        </div>
      )}

      <div className="card-warning">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
          <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
            Os treinos são sugestões educativas e não substituem a orientação de um educador físico. Em caso de dores ou sintomas durante o exercício, interrompa e consulte seu médico.
          </p>
        </div>
      </div>
    </div>
  )
}
