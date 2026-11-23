import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Play, Pause, SkipForward, Plus, Check, Volume2, VolumeX, Lightbulb, Flame, Trophy, Info, Dumbbell,
} from 'lucide-react'
import type { ExItem, Level } from '../data/exercisePlans'
import {
  type SessionState, type WorkoutSessionRecord,
  REST_OPTIONS, REST_MET, WORK_MET,
  buildSessionPlan, estimatePlan, setOptions, parseSeconds, setsPlanned,
  startSession, tick, completeSet, startSet, addRest, skipExercise, pauseSession, resumeSession, finishSession,
  phaseElapsed, phaseRemaining, sessionElapsed, totalSetsDone, completedExercises, isBetweenExercises,
  summarizeSession, phaseCue, coachTip, targetLabel, fmtClock, fmtCountdown, fmtDuration,
  readWorkoutPrefs, saveWorkoutPrefs, saveActiveSession, clearActiveSession,
} from '../utils/workoutSessionUtils'
import { createCoach, requestWakeLock } from '../utils/workoutCoach'
import { todayStr } from '../utils/dateUtils'
import { alpha } from '../utils/color'
import { HeroCard, HeroEyebrow } from './HeroShared'

const FONT = 'Inter, -apple-system, sans-serif'

const SR_ONLY: React.CSSProperties = {
  position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px',
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
}

interface Props {
  day: { label: string; name: string; color: string }
  items: ExItem[]
  level: Level
  volume: { sets: string; reps: string; rest: string }
  weightKg: number
  resume: SessionState | null       // treino em andamento deste dia de treino
  otherActiveLabel?: string         // outro treino em andamento (começar este o substitui)
  onProgress: (label: string, done: number[]) => void  // exercícios com todas as séries feitas
  onFinish: (record: WorkoutSessionRecord) => void
  onClose: () => void
}

// Treino guiado em tela cheia: o app faz o papel do personal — conduz série a
// série, cronometra a execução, conta o descanso e avisa (voz, bipe, vibração)
// a hora de voltar. No fim, resumo com tempo e calorias estimadas.
export default function WorkoutSession(p: Props) {
  const titleId = useId()
  const [prefs, setPrefs] = useState(readWorkoutPrefs)

  // ── Configuração ────────────────────────────────────────────────────────
  const setChoices  = setOptions(p.volume.sets)
  const defaultRest = parseSeconds(p.volume.rest)
  const [sets, setSets] = useState(() => (prefs.sets && setChoices.includes(prefs.sets) ? prefs.sets : setChoices[0]))
  const [restSecs, setRestSecs] = useState(() => (prefs.restSecs && REST_OPTIONS.includes(prefs.restSecs) ? prefs.restSecs : defaultRest))
  const plan = useMemo(
    () => buildSessionPlan(p.day, p.items, { level: p.level, sets, reps: p.volume.reps, restSecs }),
    [p.day, p.items, p.level, p.volume.reps, sets, restSecs],
  )
  const estimate = estimatePlan(plan, p.weightKg)

  // ── Sessão ──────────────────────────────────────────────────────────────
  const [state, setState] = useState<SessionState | null>(p.resume)
  const [now, setNow] = useState(Date.now)
  const [confirmExit, setConfirmExit] = useState(false)
  const coach = useMemo(createCoach, [])
  const live  = state !== null && state.phase !== 'done'

  const act = (fn: (s: SessionState, t: number) => SessionState) => {
    const t = Date.now()
    setNow(t)
    setState(prev => (prev ? fn(tick(prev, t), t) : prev))
  }

  // Callbacks do pai sempre atuais dentro dos efeitos
  const cb = useRef(p)
  cb.current = p
  const voiceOn = useRef(prefs.voice)
  voiceOn.current = prefs.voice

  // Trava a rolagem do fundo; Esc fecha (ou pergunta, com treino em andamento)
  const escFn = useRef<() => void>(() => {})
  escFn.current = () => (live ? setConfirmExit(c => !c) : p.onClose())
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') escFn.current() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [])

  useEffect(() => () => coach.dispose(), [coach])

  // Relógio: 4× por segundo avança as fases e redesenha os tempos
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      setState(prev => (prev ? tick(prev, t) : prev))
    }, 250)
    return () => window.clearInterval(id)
  }, [live])

  // Tela acesa durante o treino
  useEffect(() => {
    if (!live) return
    let lock: { release(): Promise<void> } | null = null
    let gone = false
    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      const l = await requestWakeLock()
      if (gone) void l?.release().catch(() => {})
      else lock = l
    }
    void acquire()
    const onVis = () => { if (document.visibilityState === 'visible') void acquire() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      gone = true
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release().catch(() => {})
    }
  }, [live])

  // Guarda o andamento a cada mudança: o app pode ser fechado no meio do treino
  useEffect(() => {
    if (state && state.phase !== 'done') saveActiveSession(state)
  }, [state])

  // Exercício com todas as séries feitas já entra marcado no dia
  const reported = useRef(p.resume ? completedExercises(p.resume).join(',') : '')
  const setsDoneKey = state?.setsDone.join(',') ?? ''
  useEffect(() => {
    if (!state) return
    const done = completedExercises(state)
    const key  = done.join(',')
    if (key === reported.current) return
    reported.current = key
    if (done.length) cb.current.onProgress(state.plan.label, done)
  }, [setsDoneKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fim do treino: grava a sessão uma única vez
  const saved = useRef(false)
  useEffect(() => {
    if (state?.phase !== 'done' || saved.current) return
    saved.current = true
    clearActiveSession()
    if (totalSetsDone(state) > 0) cb.current.onFinish(summarizeSession(state, cb.current.weightKg))
  }, [state?.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fala e sinal ao entrar em cada fase (não repete a fase atual ao retomar)
  const phaseKey = state ? `${state.phase}|${state.ex}|${state.set}` : ''
  const firstCue = useRef(true)
  useEffect(() => {
    if (!state) return
    const resumed = firstCue.current && p.resume !== null
    firstCue.current = false
    if (resumed) return
    // Fase que terminou com o app em segundo plano: chegou atrasada, fica em silêncio
    if (state.phase !== 'done' && Date.now() - state.phaseAt > 3000) return
    if (state.phase === 'work') { if (voiceOn.current) coach.beep('go'); coach.buzz(250) }
    if (state.phase === 'rest') coach.buzz([120, 80, 120])
    if (state.phase === 'done') coach.buzz([200, 100, 200, 100, 400])
    if (voiceOn.current) coach.say(phaseCue(state))
  }, [phaseKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Contagem final (3, 2, 1), aviso de 10 s no descanso e metade da isometria
  const lastRem = useRef<number | null>(null)
  useEffect(() => { lastRem.current = null }, [phaseKey])
  useEffect(() => {
    if (!state || state.phase === 'done' || state.pausedAt !== null || state.phaseLen === 0) return
    const rem  = Math.ceil(phaseRemaining(state, now) / 1000)
    const prev = lastRem.current
    lastRem.current = rem
    if (prev === null || prev === rem || document.visibilityState !== 'visible' || !voiceOn.current) return
    if (rem >= 1 && rem <= 3) coach.beep('tick')
    else if (state.phase === 'rest' && rem === 10 && state.phaseLen >= 20_000) coach.say('10 segundos. Prepare-se.')
    else if (state.phase === 'work' && state.phaseLen >= 20_000 && rem === Math.round(state.phaseLen / 2000)) coach.say('Metade! Segura firme.')
  }, [now]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ações ────────────────────────────────────────────────────────────────
  function begin() {
    coach.unlock()
    const next = { ...prefs, sets, restSecs }
    saveWorkoutPrefs(next)
    setPrefs(next)
    const t = Date.now()
    setNow(t)
    setState(startSession(plan, todayStr(), t))
  }

  function toggleVoice() {
    coach.unlock()
    const next = { ...prefs, voice: !prefs.voice }
    if (!next.voice) coach.silence()
    saveWorkoutPrefs(next)
    setPrefs(next)
  }

  function pauseAndLeave() {
    if (state) saveActiveSession(pauseSession(tick(state, Date.now()), Date.now()))
    coach.silence()
    p.onClose()
  }

  function discard() {
    clearActiveSession()
    coach.silence()
    p.onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  // Portal no body: um ancestral animado (transform) prenderia o position: fixed
  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-labelledby={titleId}
      onPointerDown={live ? () => coach.unlock() : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, overflowY: 'auto', overscrollBehavior: 'contain',
        background: live ? 'var(--g-hero)' : 'var(--bg)', fontFamily: FONT,
        animation: 'slide-up 0.28s cubic-bezier(0.34,1.06,0.64,1) both',
      }}
    >
      <div style={{
        maxWidth: '480px', margin: '0 auto', minHeight: '100dvh', boxSizing: 'border-box',
        padding: 'calc(12px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column',
      }}>
        {state === null && (
          <Setup
            titleId={titleId} p={p} prefs={prefs} sets={sets} restSecs={restSecs}
            setChoices={setChoices} defaultRest={defaultRest} plan={plan} estimate={estimate}
            onSets={setSets} onRest={setRestSecs} onToggleVoice={toggleVoice} onBegin={begin}
          />
        )}

        {state !== null && live && (
          <Live
            titleId={titleId} s={state} now={now} voice={prefs.voice}
            onToggleVoice={toggleVoice} onExit={() => setConfirmExit(true)}
            onCompleteSet={() => act(completeSet)}
            onStartSet={() => act(startSet)}
            onAddRest={() => act(s => addRest(s, 15_000))}
            onSkip={() => act(skipExercise)}
            onPause={() => { coach.silence(); act(pauseSession) }}
            onResume={() => { coach.unlock(); act(resumeSession) }}
          />
        )}

        {state !== null && !live && (
          <Summary titleId={titleId} s={state} weightKg={p.weightKg} onClose={p.onClose} />
        )}
      </div>

      {confirmExit && live && state && (
        <ExitSheet
          setsDone={totalSetsDone(state)}
          onFinish={() => { setConfirmExit(false); act(finishSession) }}
          onPauseLeave={pauseAndLeave}
          onDiscard={discard}
          onCancel={() => setConfirmExit(false)}
        />
      )}
    </div>,
    document.body,
  )
}

// ── Peças ─────────────────────────────────────────────────────────────────────

function Pill({ active, onClick, children, label }: {
  active: boolean; onClick: () => void; children: React.ReactNode; label?: string
}) {
  return (
    <button
      onClick={onClick} aria-pressed={active} aria-label={label}
      style={{
        flex: 1, padding: '10px 6px', borderRadius: '12px', cursor: 'pointer', fontFamily: FONT,
        fontWeight: 700, fontSize: '13px',
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
      {children}
    </p>
  )
}

function IconButton({ onClick, label, children, dark }: {
  onClick: () => void; label: string; children: React.ReactNode; dark?: boolean
}) {
  return (
    <button
      onClick={onClick} aria-label={label} title={label}
      style={{
        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: dark ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--border)',
        background: dark ? 'rgba(255,255,255,0.10)' : 'var(--surface)',
        color: dark ? '#fff' : 'var(--text-primary)',
      }}
    >
      {children}
    </button>
  )
}

function restLabel(secs: number) {
  return secs >= 60 && secs % 60 === 0 ? `${secs / 60} min` : `${secs} s`
}

// ── Antes de começar ──────────────────────────────────────────────────────────

function Setup({
  titleId, p, prefs, sets, restSecs, setChoices, defaultRest, plan, estimate,
  onSets, onRest, onToggleVoice, onBegin,
}: {
  titleId: string
  p: Props
  prefs: { voice: boolean }
  sets: number
  restSecs: number
  setChoices: number[]
  defaultRest: number
  plan: ReturnType<typeof buildSessionPlan>
  estimate: ReturnType<typeof estimatePlan>
  onSets: (n: number) => void
  onRest: (n: number) => void
  onToggleVoice: () => void
  onBegin: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconButton onClick={p.onClose} label="Fechar"><X size={18} strokeWidth={2} /></IconButton>
        <h2 id={titleId} style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
          Treino guiado
        </h2>
      </div>

      <HeroCard>
        <div style={{ position: 'relative' }}>
          <HeroEyebrow>Treino {plan.label}</HeroEyebrow>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '4px 0 12px', letterSpacing: '-0.4px' }}>
            {plan.name}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              `${plan.exercises.length} exercícios`,
              `${setsPlanned(plan)} séries`,
              `≈ ${fmtDuration(estimate.totalSecs)}`,
              ...(estimate.kcal > 0 ? [`~${estimate.kcal} kcal`] : []),
            ].map(t => (
              <span key={t} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.16)', color: '#fff' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </HeroCard>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 4px' }}>
        O app conduz cada série como um personal: cronômetro na execução, contagem regressiva no descanso e aviso na hora de voltar. No fim, você vê o tempo total e as calorias estimadas.
      </p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '16px' }}>
        <div>
          <SectionLabel>Séries por exercício</SectionLabel>
          <div style={{ display: 'flex', gap: '8px' }}>
            {setChoices.map(n => (
              <Pill key={n} active={sets === n} onClick={() => onSets(n)}>{n} séries</Pill>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Descanso entre séries</SectionLabel>
          <div style={{ display: 'flex', gap: '6px' }}>
            {REST_OPTIONS.map(r => (
              <Pill key={r} active={restSecs === r} onClick={() => onRest(r)}
                label={`${restLabel(r)}${r === defaultRest ? ', recomendado para o seu nível' : ''}`}>
                {restLabel(r)}
              </Pill>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '7px 0 0' }}>
            Recomendado para o seu nível: {restLabel(defaultRest)}
          </p>
        </div>

        <button
          role="switch" aria-checked={prefs.voice} onClick={onToggleVoice}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: 0,
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
          }}
        >
          <span style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'var(--ice)', color: 'var(--cobalt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {prefs.voice ? <Volume2 size={17} strokeWidth={2} /> : <VolumeX size={17} strokeWidth={2} />}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Voz do personal</span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Anuncia séries e descanso, com bipe nos 3 segundos finais
            </span>
          </span>
          <span aria-hidden style={{
            width: '42px', height: '24px', borderRadius: '99px', flexShrink: 0, position: 'relative',
            background: prefs.voice ? 'var(--cobalt)' : 'var(--surface-3)', transition: 'background 0.2s',
          }}>
            <span style={{
              position: 'absolute', top: '3px', left: prefs.voice ? '21px' : '3px',
              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s',
            }} />
          </span>
        </button>
      </div>

      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SectionLabel>Sequência</SectionLabel>
        {plan.exercises.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '8px', flexShrink: 0,
              background: alpha(p.day.color, 9), color: p.day.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800,
            }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{e.name}</span>
            <span style={{
              fontSize: '10px', fontWeight: 700, color: p.day.color, background: alpha(p.day.color, 8),
              padding: '2px 7px', borderRadius: '99px', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {e.sets}× {targetLabel(e)}
            </span>
          </div>
        ))}
      </div>

      {p.otherActiveLabel && (
        <div className="card-warning" style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
            O Treino {p.otherActiveLabel} está em andamento. Começar este encerra aquele sem salvar o resumo (os exercícios já completos continuam marcados).
          </p>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ position: 'sticky', bottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <button
          onClick={onBegin}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
            background: 'var(--g-cta)', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: '16px',
            boxShadow: 'var(--shadow-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <Play size={18} strokeWidth={2.25} fill="currentColor" />
          Começar treino
        </button>
      </div>

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 4px', textAlign: 'center' }}>
        Sugestão educativa, não substitui um educador físico. Sentiu dor, tontura ou falta de ar? Pare e procure orientação.
      </p>
    </div>
  )
}

// ── Durante o treino ──────────────────────────────────────────────────────────

function TimerRing({ pct, children, dim }: { pct: number; children: React.ReactNode; dim: boolean }) {
  const gid    = useId().replace(/:/g, '')
  const size   = 232
  const stroke = 12
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const v      = Math.max(0, Math.min(1, pct))
  return (
    <div style={{ position: 'relative', width: size, height: size, maxWidth: '68vw', maxHeight: '68vw', opacity: dim ? 0.55 : 1, transition: 'opacity 0.2s' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sky)" />
            <stop offset="100%" stopColor="var(--aqua)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(255,255,255,0.04)" stroke="var(--track-on-dark)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.25s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function DarkButton({ onClick, children, primary, label }: {
  onClick: () => void; children: React.ReactNode; primary?: boolean; label?: string
}) {
  return (
    <button
      onClick={onClick} aria-label={label}
      style={{
        flex: 1, minWidth: 0, cursor: 'pointer', fontFamily: FONT,
        padding: primary ? '17px 14px' : '12px 8px', borderRadius: primary ? '18px' : '14px',
        fontSize: primary ? '16px' : '12px', fontWeight: 800,
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.18)',
        background: primary ? '#fff' : 'rgba(255,255,255,0.10)',
        color: primary ? 'var(--navy)' : '#fff',
        boxShadow: primary ? '0 8px 24px rgba(0,0,0,0.22)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        transition: 'transform 0.12s ease',
      }}
      onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  )
}

function Live({
  titleId, s, now, voice, onToggleVoice, onExit,
  onCompleteSet, onStartSet, onAddRest, onSkip, onPause, onResume,
}: {
  titleId: string
  s: SessionState
  now: number
  voice: boolean
  onToggleVoice: () => void
  onExit: () => void
  onCompleteSet: () => void
  onStartSet: () => void
  onAddRest: () => void
  onSkip: () => void
  onPause: () => void
  onResume: () => void
}) {
  const ex        = s.plan.exercises[s.ex]
  const paused    = s.pausedAt !== null
  const countdown = s.phaseLen > 0
  const elapsed   = phaseElapsed(s, now)
  const remaining = phaseRemaining(s, now)
  const clock     = countdown ? fmtCountdown(remaining) : fmtClock(elapsed)
  // Contagem regressiva: o anel esvazia · cronômetro livre: dá uma volta por minuto
  const ringPct   = countdown ? remaining / s.phaseLen : (elapsed % 60_000) / 60_000
  const between   = isBetweenExercises(s)
  const nExercises = s.plan.exercises.length

  const eyebrow =
    paused ? 'Pausado'
    : s.phase === 'ready' ? 'Prepare-se'
    : s.phase === 'rest' ? 'Descanso'
    : ex.sets > 1 && s.set === ex.sets ? `Última série · ${s.set} de ${ex.sets}`
    : `Série ${s.set} de ${ex.sets}`

  const caption =
    s.phase === 'work' ? (ex.secs ? 'segure a posição' : 'tempo de execução')
    : s.phase === 'rest' ? (between ? 'para o próximo exercício' : 'para a próxima série')
    : 'para começar'

  const tip = s.phase === 'rest' ? coachTip(s) : ex.tip
  const coach = s.phase === 'rest' ? undefined : coachTip(s)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px', color: '#fff' }}>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconButton dark onClick={onExit} label="Encerrar ou sair do treino"><X size={18} strokeWidth={2} /></IconButton>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <h2 id={titleId} style={{ fontSize: '13px', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Treino {s.plan.label} · {s.plan.name}
          </h2>
          <p className="num-display" style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8, margin: '3px 0 0', letterSpacing: 0 }}
            aria-label={`Tempo de treino: ${fmtClock(sessionElapsed(s, now))}`}>
            {fmtClock(sessionElapsed(s, now))}
          </p>
        </div>
        <IconButton dark onClick={onToggleVoice} label={voice ? 'Desligar voz do personal' : 'Ligar voz do personal'}>
          {voice ? <Volume2 size={18} strokeWidth={2} /> : <VolumeX size={18} strokeWidth={2} />}
        </IconButton>
      </div>

      {/* Progresso por exercício */}
      <div style={{ display: 'flex', gap: '4px' }} role="img"
        aria-label={`Exercício ${s.ex + 1} de ${nExercises}, ${totalSetsDone(s)} de ${setsPlanned(s.plan)} séries feitas`}>
        {s.plan.exercises.map((e, i) => (
          <div key={i} style={{
            flex: 1, height: '5px', borderRadius: '99px', overflow: 'hidden',
            background: 'var(--track-on-dark)',
            outline: i === s.ex ? '1.5px solid rgba(255,255,255,0.55)' : 'none', outlineOffset: '1.5px',
          }}>
            <div style={{
              width: `${Math.min(1, s.setsDone[i] / e.sets) * 100}%`, height: '100%',
              background: 'var(--g-ring)', transition: 'width 0.4s var(--ease-smooth)',
            }} />
          </div>
        ))}
      </div>

      {/* Relógio */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
          padding: '5px 12px', borderRadius: '99px',
          background: s.phase === 'rest' && !paused ? alpha('var(--aqua)', 22) : 'rgba(255,255,255,0.14)',
          color: s.phase === 'rest' && !paused ? 'var(--aqua)' : '#fff',
        }}>
          {eyebrow}
        </span>

        <TimerRing pct={ringPct} dim={paused}>
          <span className="num-display" style={{ fontSize: '58px', color: '#fff' }}>{clock}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, marginTop: '8px' }}>{caption}</span>
        </TimerRing>
      </div>

      {/* Exercício */}
      <div style={{ textAlign: 'center', padding: '0 8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {s.phase === 'rest' ? (between ? 'Próximo exercício' : 'A seguir') : `Exercício ${s.ex + 1} de ${nExercises}`}
        </p>
        <p style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 8px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
          {ex.name}
        </p>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', fontWeight: 800, padding: '4px 11px', borderRadius: '99px',
          background: 'rgba(255,255,255,0.16)', color: '#fff',
        }}>
          <Dumbbell size={12} strokeWidth={2.25} />
          {s.phase === 'rest' ? `Série ${s.set} de ${ex.sets} · ${targetLabel(ex)}` : `${ex.sets}× ${targetLabel(ex)}`}
        </span>
        {tip && (
          <p style={{ fontSize: '12px', opacity: 0.88, margin: '10px auto 0', lineHeight: 1.45, maxWidth: '320px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <Lightbulb size={13} strokeWidth={2.25} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--aqua)' }} />
            <span>{tip}</span>
          </p>
        )}
        {coach && (
          <p style={{ fontSize: '11px', opacity: 0.7, margin: '6px 0 0', fontStyle: 'italic' }}>“{coach}”</p>
        )}
      </div>

      <p aria-live="polite" style={SR_ONLY}>{`${eyebrow}. ${ex.name}`}</p>

      <div style={{ flex: 1, minHeight: '8px' }} />

      {/* Controles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {paused ? (
          <>
            <DarkButton primary onClick={onResume}><Play size={18} strokeWidth={2.25} fill="currentColor" />Retomar</DarkButton>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DarkButton onClick={onExit}><X size={14} strokeWidth={2.25} />Encerrar treino</DarkButton>
            </div>
          </>
        ) : s.phase === 'work' ? (
          <>
            <DarkButton primary onClick={onCompleteSet}>
              <Check size={19} strokeWidth={2.5} />{ex.secs ? 'Terminar série' : 'Série concluída'}
            </DarkButton>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DarkButton onClick={onPause}><Pause size={14} strokeWidth={2.25} />Pausar</DarkButton>
              <DarkButton onClick={onSkip}><SkipForward size={14} strokeWidth={2.25} />Pular exercício</DarkButton>
            </div>
          </>
        ) : s.phase === 'rest' ? (
          <>
            <DarkButton primary onClick={onStartSet}><SkipForward size={18} strokeWidth={2.25} />Pular descanso</DarkButton>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DarkButton onClick={onAddRest} label="Mais 15 segundos de descanso"><Plus size={14} strokeWidth={2.25} />15 s</DarkButton>
              <DarkButton onClick={onPause}><Pause size={14} strokeWidth={2.25} />Pausar</DarkButton>
              <DarkButton onClick={onSkip} label="Pular o próximo exercício"><SkipForward size={14} strokeWidth={2.25} />Pular</DarkButton>
            </div>
          </>
        ) : (
          <>
            <DarkButton primary onClick={onStartSet}><Play size={18} strokeWidth={2.25} fill="currentColor" />Começar agora</DarkButton>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DarkButton onClick={onPause}><Pause size={14} strokeWidth={2.25} />Pausar</DarkButton>
              <DarkButton onClick={onSkip}><SkipForward size={14} strokeWidth={2.25} />Pular exercício</DarkButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Encerrar / sair ───────────────────────────────────────────────────────────

function ExitSheet({ setsDone, onFinish, onPauseLeave, onDiscard, onCancel }: {
  setsDone: number
  onFinish: () => void
  onPauseLeave: () => void
  onDiscard: () => void
  onCancel: () => void
}) {
  const titleId = useId()
  const row = (onClick: () => void, title: string, sub: string, tone: 'primary' | 'plain' | 'danger') => (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '13px 14px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
        border: tone === 'primary' ? 'none' : `1.5px solid ${tone === 'danger' ? 'var(--red-line)' : 'var(--border)'}`,
        background: tone === 'primary' ? 'var(--g-cta)' : tone === 'danger' ? 'var(--red-bg)' : 'var(--surface)',
        color: tone === 'primary' ? '#fff' : tone === 'danger' ? 'var(--red)' : 'var(--text-primary)',
      }}
    >
      <span style={{ display: 'block', fontSize: '14px', fontWeight: 800 }}>{title}</span>
      <span style={{ display: 'block', fontSize: '11px', marginTop: '2px', opacity: tone === 'primary' ? 0.85 : 1, color: tone === 'primary' ? '#fff' : 'var(--text-muted)' }}>{sub}</span>
    </button>
  )

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 210, background: 'var(--scrim)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        role="alertdialog" aria-modal="true" aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px', background: 'var(--bg)', borderRadius: '24px 24px 0 0',
          padding: '18px 16px calc(18px + env(safe-area-inset-bottom))',
          display: 'flex', flexDirection: 'column', gap: '10px',
          animation: 'slide-up 0.24s cubic-bezier(0.34,1.06,0.64,1) both',
        }}
      >
        <h3 id={titleId} style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
          {setsDone > 0 ? 'Encerrar o treino?' : 'Sair do treino?'}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px' }}>
          {setsDone > 0
            ? `Você já fez ${setsDone} série${setsDone > 1 ? 's' : ''}.`
            : 'Nenhuma série feita ainda.'}
        </p>
        {setsDone > 0 && row(onFinish, 'Encerrar e ver resumo', 'Salva o tempo e as calorias estimadas', 'primary')}
        {row(onPauseLeave, 'Pausar e sair', 'O cronômetro para; retome depois pela tela de treinos', 'plain')}
        {row(onDiscard, setsDone > 0 ? 'Descartar treino' : 'Sair sem salvar', setsDone > 0 ? 'Não salva o resumo (exercícios completos continuam marcados)' : 'Volta para a tela de treinos', 'danger')}
        <button
          onClick={onCancel} autoFocus
          style={{
            marginTop: '4px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--cobalt)', fontFamily: FONT, fontWeight: 800, fontSize: '14px',
          }}
        >
          Continuar treinando
        </button>
      </div>
    </div>
  )
}

// ── Resumo ────────────────────────────────────────────────────────────────────

function Summary({ titleId, s, weightKg, onClose }: {
  titleId: string; s: SessionState; weightKg: number; onClose: () => void
}) {
  const r        = summarizeSession(s, weightKg)
  const complete = r.sets >= r.setsPlanned
  const fmtMet   = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconButton onClick={onClose} label="Fechar resumo"><X size={18} strokeWidth={2} /></IconButton>
        <h2 id={titleId} style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
          Resumo do treino
        </h2>
      </div>

      <HeroCard>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span className="scale-in" style={{
            width: '56px', height: '56px', borderRadius: '50%', marginBottom: '10px',
            background: alpha('var(--aqua)', 20), color: 'var(--aqua)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={26} strokeWidth={2} />
          </span>
          <HeroEyebrow>{r.sets === 0 ? `Treino ${r.label}` : complete ? `Treino ${r.label} concluído` : `Treino ${r.label} encerrado`}</HeroEyebrow>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '4px 0 14px', letterSpacing: '-0.3px' }}>
            {r.sets === 0 ? 'Nenhuma série registrada' : complete ? 'Mandou muito bem!' : 'Cada série conta. Bom trabalho!'}
          </p>
          {r.kcal > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <Flame size={22} strokeWidth={2} color="var(--aqua)" style={{ alignSelf: 'center' }} />
              <span className="num-display" style={{ fontSize: '40px', color: '#fff' }}>~{r.kcal}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', opacity: 0.85 }}>kcal estimadas</span>
            </div>
          )}
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', opacity: 0.85, margin: '8px 0 0' }}>
            {fmtDuration(r.totalSecs)} de treino · {r.sets} série{r.sets === 1 ? '' : 's'}
          </p>
        </div>
      </HeroCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Duração total', value: fmtDuration(r.totalSecs), sub: 'sem contar pausas' },
          { label: 'Em execução', value: fmtDuration(r.workSecs), sub: 'tempo das séries' },
          { label: 'Descanso', value: fmtDuration(r.restSecs), sub: 'entre séries e exercícios' },
          { label: 'Séries', value: `${r.sets}/${r.setsPlanned}`, sub: `${r.exercises} de ${r.exercisesTotal} exercícios completos` },
        ].map(st => (
          <div key={st.label} className="stat-card" style={{ padding: '0.9rem 1rem' }}>
            <p className="label-base" style={{ marginBottom: '4px' }}>{st.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>{st.value}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{st.sub}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SectionLabel>Exercícios</SectionLabel>
        {s.plan.exercises.map((e, i) => {
          const done = s.setsDone[i]
          const full = done >= e.sets
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: full ? 'var(--teal-d)' : 'var(--surface-2)',
                border: `1.5px solid ${full ? 'var(--teal-d)' : 'var(--border-strong)'}`, color: 'var(--surface)',
              }}>
                {full && <Check size={12} strokeWidth={2.5} />}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 700, color: full ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{e.name}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: full ? 'var(--teal-d)' : 'var(--text-muted)', flexShrink: 0 }}>
                {done === 0 ? 'pulado' : `${done}/${e.sets} séries`}
              </span>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <Info size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--cobalt)' }} />
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          {weightKg > 0 ? (
            <>
              <strong>Como estimamos as calorias:</strong> seu peso atual ({r.weightKg.toLocaleString('pt-BR')} kg) × tempo × intensidade —
              MET {fmtMet(WORK_MET[s.plan.level])} durante as séries e {fmtMet(REST_MET)} no descanso (Compendium of Physical Activities).
              É uma aproximação: o gasto real varia com a carga, o ritmo e o condicionamento.
            </>
          ) : (
            <>Registre seu peso no perfil para ver a estimativa de calorias dos próximos treinos.</>
          )}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '15px', borderRadius: '16px', fontSize: '16px', fontWeight: 800 }}>
        <Check size={18} strokeWidth={2.5} />
        Concluir
      </button>
    </div>
  )
}
