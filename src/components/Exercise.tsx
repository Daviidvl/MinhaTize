import { useState } from 'react'
import {
  Dumbbell, Droplets, Moon, Waves, Lightbulb, Info,
  RotateCcw, ChevronDown, BarChart2, Check, Flame,
} from 'lucide-react'
import { readJSON, writeJSON, removeKey } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'
import {
  type WorkoutProfile, type WorkoutDays, type SplitKey,
  VOLUME, SPLIT_LABEL, SPLITS, DAY_ICON_MAP,
} from '../data/exercisePlans'
import {
  DAY_INITIALS, DAY_NAMES, DAY_FULL, toDateStr, getWeekDays, calcStreak, getMotivation,
} from '../utils/exerciseUtils'

const STORAGE_KEY = STORAGE_KEYS.workoutProfile
const LOG_KEY     = STORAGE_KEYS.workoutLog

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
        border: active ? '2px solid #22C55E' : '1.5px solid var(--border)',
        background: active ? 'rgba(34,197,94,0.12)' : 'var(--surface-2)',
        color: active ? '#22C55E' : 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Exercise() {
  const [profile, setProfile] = useState<WorkoutProfile | null>(() => readJSON(STORAGE_KEY, null))

  const [form, setForm] = useState<Partial<WorkoutProfile>>(profile ?? {})
  const [showForm, setShowForm] = useState(profile === null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['A']))

  const formComplete = !!(
    form.sex && form.level && form.location && form.days &&
    form.preferredDays?.length === form.days
  )

  function togglePreferredDay(idx: number) {
    setForm(f => {
      const prev = f.preferredDays ?? []
      const next = prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
      return { ...f, preferredDays: next }
    })
  }

  const [workoutLog, setWorkoutLog] = useState<string[]>(() => readJSON(LOG_KEY, []))

  function toggleLog(date: string) {
    setWorkoutLog(prev => {
      const next = prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
      writeJSON(LOG_KEY, next)
      return next
    })
  }

  function saveProfile() {
    if (!formComplete) return
    const p = form as WorkoutProfile
    writeJSON(STORAGE_KEY, p)
    setProfile(p)
    setShowForm(false)
    setExpandedDays(new Set(['A']))
  }

  function resetProfile() {
    removeKey(STORAGE_KEY)
    setProfile(null)
    setForm({})
    setShowForm(true)
  }

  function toggleDay(label: string) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const splitDays = profile
    ? SPLITS[`${profile.days}_${profile.sex}` as SplitKey]
    : []
  const vol = profile ? VOLUME[profile.level] : null

  // ── Render: form ──────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Banner */}
        <div style={{
          background: 'linear-gradient(155deg, #0C1F18 0%, #132D22 60%, #0F2219 100%)',
          borderRadius: '20px', padding: '18px 20px', color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Avaliação de treino
          </p>
          <p style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '8px' }}>
            Treino personalizado para o seu perfil
          </p>
          <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
            Responda as perguntas abaixo e receba um plano adequado ao seu nível, dias disponíveis e local de treino.
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

          {/* Dias */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Dias disponíveis por semana
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([2, 3, 4, 5] as WorkoutDays[]).map(d => (
                <Pill key={d} active={form.days === d} onClick={() => setForm(f => ({ ...f, days: d }))}>
                  {d}×
                </Pill>
              ))}
            </div>
            {form.days && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '7px' }}>
                {form.days === 2 && 'Full Body A/B — treinar dias alternados (ex: Seg e Qui)'}
                {form.days === 3 && 'Divisão ABC — cada grupo muscular 1× por semana'}
                {form.days === 4 && 'Divisão ABCD — mais volume, boa frequência por grupo'}
                {form.days === 5 && 'Divisão ABCDE — foco máximo por músculo por sessão'}
              </p>
            )}
          </div>

          {/* Dias da semana */}
          {form.days && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                Quais dias você costuma treinar?
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Selecione exatamente <strong>{form.days}</strong> dia{form.days > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                {DAY_NAMES.map((name, idx) => {
                  const sel = (form.preferredDays ?? []).includes(idx)
                  const full = (form.preferredDays ?? []).length >= form.days! && !sel
                  return (
                    <button
                      key={idx}
                      onClick={() => !full && togglePreferredDay(idx)}
                      style={{
                        flex: 1, paddingTop: '8px', paddingBottom: '8px',
                        borderRadius: '10px', cursor: full ? 'not-allowed' : 'pointer',
                        fontFamily: "Inter, -apple-system, sans-serif",
                        fontWeight: 700, fontSize: '11px',
                        border: sel ? '2px solid #22C55E' : '1.5px solid var(--border)',
                        background: sel ? 'rgba(34,197,94,0.12)' : 'var(--surface-2)',
                        color: sel ? '#22C55E' : full ? 'var(--text-muted)' : 'var(--text-secondary)',
                        opacity: full ? 0.45 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              {(form.preferredDays?.length ?? 0) > 0 && (form.preferredDays?.length ?? 0) < form.days && (
                <p style={{ fontSize: '11px', color: '#22C55E', marginTop: '7px' }}>
                  {form.days - (form.preferredDays?.length ?? 0)} dia{form.days - (form.preferredDays?.length ?? 0) > 1 ? 's' : ''} restante{form.days - (form.preferredDays?.length ?? 0) > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={saveProfile}
            disabled={!formComplete}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 800, fontSize: '15px',
              cursor: formComplete ? 'pointer' : 'not-allowed',
              background: formComplete ? 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)' : 'var(--surface-3)',
              color: formComplete ? '#fff' : 'var(--text-muted)',
              opacity: formComplete ? 1 : 0.6,
              transition: 'all 0.2s',
              boxShadow: formComplete ? 'var(--shadow-green)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Dumbbell size={16} strokeWidth={2.5} />
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

      {/* Plan header */}
      <div style={{
        background: 'linear-gradient(155deg, #0C1F18 0%, #132D22 60%, #0F2219 100%)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden',
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
          {profile!.days}× por semana · {SPLIT_LABEL[profile!.days]}
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

      {/* Weekly calendar */}
      {(() => {
        const preferred   = profile!.preferredDays ?? []
        const weekDays    = getWeekDays()
        const todayStr    = toDateStr(new Date())
        const doneThisWeek = weekDays.filter(d => workoutLog.includes(toDateStr(d))).length
        const streak       = calcStreak(workoutLog)

        return (
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Flame size={14} strokeWidth={2} style={{ color: '#22C55E', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Semana de treino
              </p>
            </div>

            {/* Day circles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              {weekDays.map((d, i) => {
                const ds       = toDateStr(d)
                const isPref   = preferred.includes(d.getDay())
                const isDone   = workoutLog.includes(ds)
                const isToday  = ds === todayStr
                let bg        = isPref ? 'var(--surface-2)' : 'transparent'
                let border    = isPref ? '1.5px solid var(--border)' : '1px dashed var(--border)'
                let color     = isPref ? 'var(--text-secondary)' : 'var(--text-muted)'
                let showCheck = false
                let pulsing   = false

                if (isDone) {
                  bg = '#22C55E'; border = '1.5px solid #22C55E'
                  color = '#fff'; showCheck = true
                } else if (isToday) {
                  border = '2px solid #22C55E'; color = '#22C55E'
                  bg = 'transparent'; pulsing = true
                }

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => toggleLog(ds)}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: bg, border, color,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "Inter, -apple-system, sans-serif",
                        animation: pulsing ? 'pulse-ring 1.8s ease-in-out infinite' : 'none',
                        transition: 'all 0.18s', flexShrink: 0,
                      }}
                    >
                      {showCheck
                        ? <Check size={16} strokeWidth={3} />
                        : <span style={{ fontSize: '12px', fontWeight: 700 }}>{DAY_INITIALS[i]}</span>
                      }
                    </button>
                    <span style={{
                      width: '4px', height: '4px', borderRadius: '50%', display: 'block',
                      background: isPref ? '#22C55E' : 'transparent',
                      opacity: isDone ? 0 : 0.6,
                    }} />
                  </div>
                )
              })}
            </div>

            {/* Stats */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doneThisWeek}</span>
              {doneThisWeek === 1 ? ' treino' : ' treinos'} essa semana
              {streak > 0 && (
                <>
                  {' · '}
                  <span style={{ fontWeight: 700, color: '#22C55E' }}>{streak}</span>
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
          </div>
        )
      })()}

      {/* Volume info */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
          <BarChart2 size={14} strokeWidth={2} style={{ color: '#22C55E', flexShrink: 0 }} />
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
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#22C55E', margin: 0 }}>{item.value}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day cards */}
      {(() => {
        const sorted = [...(profile!.preferredDays ?? [])].sort((a, b) => a - b)
        return splitDays.map((day, dayIdx) => {
        const isOpen = expandedDays.has(day.label)
        const exercises = profile!.location === 'gym' ? day.gym : day.home
        const dayName = sorted[dayIdx] !== undefined ? DAY_FULL[sorted[dayIdx]] : null
        return (
          <div key={day.label} style={{
            borderRadius: '16px', overflow: 'hidden',
            border: `1.5px solid ${isOpen ? `${day.color}30` : 'var(--border)'}`,
            background: isOpen ? `${day.color}06` : 'var(--surface)',
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
                background: `${day.color}18`, border: `1px solid ${day.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '2px', color: day.color,
              }}>
                {DAY_ICON_MAP[day.label] ?? <Dumbbell size={18} strokeWidth={2} />}
                <span style={{ fontSize: '9px', fontWeight: 900, color: day.color, letterSpacing: '0.05em' }}>
                  {day.label}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                  Treino {day.label} — {day.name}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {dayName && <span style={{ color: day.color, fontWeight: 700 }}>{dayName} · </span>}
                  {exercises.length} exercícios · {vol!.sets} séries
                </p>
              </div>
              <span style={{
                flexShrink: 0, color: 'var(--text-muted)',
                transition: 'transform 0.2s', display: 'inline-flex',
                transform: isOpen ? 'rotate(180deg)' : 'none',
              }}><ChevronDown size={16} strokeWidth={2} /></span>
            </button>

            {isOpen && (
              <div style={{
                padding: '0 14px 14px',
                borderTop: `1px solid ${day.color}20`,
                display: 'flex', flexDirection: 'column', gap: '7px',
              }}>
                {exercises.map((ex, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '9px 12px', borderRadius: '11px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <span style={{
                      minWidth: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                      background: `${day.color}20`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '10px', fontWeight: 900,
                      color: day.color, marginTop: '1px',
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {ex.name}
                      </p>
                      {ex.tip && (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start', marginTop: '3px' }}>
                          <Lightbulb size={11} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-muted)' }} />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>{ex.tip}</p>
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: day.color,
                      background: `${day.color}15`, padding: '2px 7px', borderRadius: '99px',
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {vol!.sets}×{vol!.reps.split('–')[0]}
                    </span>
                  </div>
                ))}

              </div>
            )}
          </div>
        )
      })
      })()}

      {/* Tips */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Lightbulb size={14} strokeWidth={2} style={{ color: '#22C55E', flexShrink: 0 }} />
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
