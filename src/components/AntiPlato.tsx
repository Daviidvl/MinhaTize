import { useState, useEffect } from 'react'
import { Search, BarChart2, AlertTriangle, CheckCircle2, TrendingDown, Scale, Info } from 'lucide-react'
import { UserProfile, Tab, PlateauScreeningAnswers, PlateauNewUserAnswers, PlateauTracking } from '../types'
import { getDayNumber, getRawDay } from '../utils/antiPlatoUtils'
import {
  hasUsableHistory, getWeightTrend, evaluateNewUser, evaluateReassessment, writePlateauStatus,
  autoPlateauStatus, getPlateauStatus,
} from '../utils/plateauUtils'
import { getCurrentWeight } from '../utils/profileUtils'
import { todayStr } from '../utils/dateUtils'
import { RadioBtn, CheckBtn, StepHeader, NextBtn } from './AntiPlatoShared'
import HabitsWizard from './HabitsWizard'

// Platô: avaliação automática pelo histórico de peso, triagens rápidas e o
// acompanhamento de 14 dias. O assistente completo de hábitos fica em HabitsWizard.

function PlateauCard({
  tone, icon, title, subtitle, cta, secondaryCta,
}: {
  tone: 'positive' | 'warning' | 'negative' | 'neutral'
  icon: React.ReactNode
  title: string
  subtitle: string
  cta: { label: string; onClick: () => void }
  secondaryCta?: { label: string; onClick: () => void }
}) {
  const palette = {
    positive: { bg: 'var(--primary-light)', border: 'var(--teal)', color: 'var(--teal-d)' },
    warning:  { bg: 'var(--amber-bg)', border: 'var(--amber-line)', color: 'var(--amber)' },
    negative: { bg: 'var(--red-bg)', border: 'var(--red-line)', color: 'var(--red)' },
    neutral:  { bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text-muted)' },
  }[tone]

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        borderRadius: '20px', padding: '24px 22px', textAlign: 'center',
        background: palette.bg, border: `1.5px solid ${palette.border}`,
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 14px',
          background: palette.bg, border: `1px solid ${palette.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.color,
        }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: palette.color, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>{subtitle}</p>
      </div>

      <button onClick={cta.onClick} className="btn-primary" style={{ width: '100%' }}>{cta.label}</button>
      {secondaryCta && (
        <button onClick={secondaryCta.onClick} className="btn-ghost" style={{ width: '100%' }}>{secondaryCta.label}</button>
      )}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Módulo educativo. Não substitui avaliação médica. Não sugere alteração de dose.
      </p>
    </div>
  )
}

// ── Fluxo automático (entrada da tela Platô) ───────────────────────────────────

interface AutoViewProps {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onGoProgress: () => void
  onStartScreening: () => void
  onStartNewUser: () => void
  onOpenHabits: () => void
}

function AutoView({ profile, onUpdateProfile, onGoProgress, onStartScreening, onStartNewUser, onOpenHabits }: AutoViewProps) {
  const tracking = profile.plateau?.tracking
  const usable   = !tracking && hasUsableHistory(profile)
  const trend    = usable ? getWeightTrend(profile) : null

  // Abrir a tela reavalia o status pelo histórico (o Início mostra o aviso de platô)
  const nextStatus = trend ? autoPlateauStatus(getPlateauStatus(profile), trend.verdict) : null
  useEffect(() => {
    if (nextStatus) onUpdateProfile(writePlateauStatus(profile, { status: nextStatus }))
  }, [nextStatus, profile, onUpdateProfile])

  if (tracking) {
    const rawDay = getRawDay(tracking.startDate)
    if (rawDay > 14) {
      return (
        <ReassessmentView
          profile={profile} onUpdateProfile={onUpdateProfile} tracking={tracking}
          onOpenHabits={onOpenHabits} onGoProgress={onGoProgress}
        />
      )
    }
    return <TrackingView profile={profile} tracking={tracking} onGoProgress={onGoProgress} onOpenHabits={onOpenHabits} />
  }

  if (!usable) {
    return (
      <PlateauCard
        tone="neutral"
        icon={<Scale size={26} strokeWidth={1.75} />}
        title="Vamos avaliar seu platô"
        subtitle="Ainda não temos histórico suficiente de peso. Responda 3 perguntas rápidas para uma primeira avaliação."
        cta={{ label: 'Iniciar avaliação rápida', onClick: onStartNewUser }}
      />
    )
  }

  if (trend!.verdict === 'queda') {
    return (
      <PlateauCard
        tone="positive"
        icon={<TrendingDown size={26} strokeWidth={1.75} />}
        title="Sua tendência de peso ainda é de queda"
        subtitle="Pequenas oscilações são normais. Continue registrando seu peso para acompanharmos sua evolução."
        cta={{ label: 'Ver minha evolução', onClick: onGoProgress }}
      />
    )
  }

  if (trend!.verdict === 'insuficiente') {
    return (
      <PlateauCard
        tone="neutral"
        icon={<BarChart2 size={26} strokeWidth={1.75} />}
        title="Sua evolução continua acontecendo"
        subtitle="Pelos registros disponíveis, seu peso ainda apresenta tendência de mudança. No momento, não há sinal claro de estabilização."
        cta={{ label: 'Ver minha evolução', onClick: onGoProgress }}
      />
    )
  }

  return (
    <PlateauCard
      tone="warning"
      icon={<Search size={26} strokeWidth={1.75} />}
      title="Possível estagnação identificada"
      subtitle="Seu peso apresentou pouca variação nas últimas semanas. Vamos fazer uma avaliação rápida antes de concluir se existe um platô."
      cta={{ label: 'Fazer avaliação rápida', onClick: onStartScreening }}
      secondaryCta={{ label: 'Quero uma avaliação completa de hábitos', onClick: onOpenHabits }}
    />
  )
}

// ── Acompanhamento ativo (dia X de 14) ─────────────────────────────────────────

function TrackingView({ profile, tracking, onGoProgress, onOpenHabits }: {
  profile: UserProfile
  tracking: PlateauTracking
  onGoProgress: () => void
  onOpenHabits: () => void
}) {
  const day = getDayNumber(tracking.startDate)
  const entriesSinceStart = profile.weightHistory.filter(e => e.date >= tracking.startDate)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        background: 'var(--g-hero)',
        borderRadius: '20px', padding: '20px', color: '#fff',
        boxShadow: '0 8px 24px rgba(var(--shadow-rgb),0.28)',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Acompanhamento de platô
        </p>
        <p style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>
          Dia {day} <span style={{ fontSize: '16px', opacity: 0.7 }}>de 14</span>
        </p>
        <div style={{ marginTop: '12px', height: '4px', borderRadius: '99px', background: 'var(--track-on-dark)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', background: 'var(--g-ring)', width: `${(day / 14) * 100}%`, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Continue registrando seu peso normalmente
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Não é preciso preencher nada aqui — seus registros feitos em Progresso alimentam automaticamente esta avaliação.
        </p>
      </div>

      {entriesSinceStart.length > 0 && (
        <div className="card">
          <p className="label-base" style={{ marginBottom: '10px' }}>Pesagens neste período</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {entriesSinceStart.map((e, i) => (
              <div key={e.date + i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                borderRadius: '10px', background: 'var(--surface-2)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{e.weight}kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onGoProgress} className="btn-primary" style={{ width: '100%' }}>Registrar peso</button>
      <button onClick={onOpenHabits} className="btn-ghost" style={{ width: '100%' }}>Quero uma avaliação completa de hábitos</button>
    </div>
  )
}

// ── Reavaliação após 14 dias ────────────────────────────────────────────────────

function ReassessmentView({ profile, onUpdateProfile, tracking, onOpenHabits, onGoProgress }: {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  tracking: PlateauTracking
  onOpenHabits: () => void
  onGoProgress: () => void
}) {
  const verdict = evaluateReassessment(profile, tracking)

  const config = {
    tendencia_queda: {
      icon: <TrendingDown size={36} strokeWidth={1.5} />, color: 'var(--teal-d)',
      bg: 'var(--primary-light)', border: 'var(--teal)',
      title: 'Tendência de queda',
      msg: 'Sua evolução mostra tendência de queda. Não há evidência suficiente de estagnação neste momento.',
      nextStatus: 'tendencia_queda' as const,
    },
    oscilacao_inconclusiva: {
      icon: <Search size={36} strokeWidth={1.5} />, color: 'var(--amber)',
      bg: 'var(--amber-bg)', border: 'var(--amber-line)',
      title: 'Oscilação nos dados',
      msg: 'Sua evolução apresentou oscilações. Ainda não há dados suficientes para concluir que exista um platô. Continue registrando seu peso.',
      nextStatus: 'possivel_estagnacao' as const,
    },
    estagnacao_persistente: {
      icon: <AlertTriangle size={36} strokeWidth={1.5} />, color: 'var(--red)',
      bg: 'var(--red-bg)', border: 'var(--red-line)',
      title: 'Estabilidade persistente',
      msg: 'A estabilidade do peso persiste. Os dados mostram uma possível estagnação. Considere discutir sua evolução com o profissional que acompanha seu tratamento.',
      nextStatus: 'estagnacao_persistente' as const,
    },
  }[verdict]

  function conclude() {
    onUpdateProfile(writePlateauStatus(profile, {
      status: config.nextStatus,
      tracking: undefined,
      lastCycleResult: { date: todayStr(), status: config.nextStatus, note: config.msg },
    }))
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ padding: '22px', borderRadius: '20px', background: config.bg, border: `1.5px solid ${config.border}`, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', color: config.color }}>{config.icon}</div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: config.color, margin: 0 }}>{config.title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>{config.msg}</p>
      </div>

      <button onClick={conclude} className="btn-primary" style={{ width: '100%' }}>Concluir avaliação</button>
      {verdict === 'estagnacao_persistente'
        ? <button onClick={onOpenHabits} className="btn-ghost" style={{ width: '100%' }}>Quero uma avaliação completa de hábitos</button>
        : <button onClick={onGoProgress} className="btn-ghost" style={{ width: '100%' }}>Ver minha evolução</button>
      }
    </div>
  )
}

// ── Triagem rápida (4 perguntas — usuário com histórico) ───────────────────────

const DEFAULT_SCREENING: PlateauScreeningAnswers = {
  pesoIgualTresSemanas: null, alimentacaoMudou: null, atividadeMudou: null,
  fatoresTemporarios: [], controleFome: null,
}

const FATORES_TEMPORARIOS = [
  { id: 'retencao',        label: 'Retenção de líquidos' },
  { id: 'constipacao',     label: 'Constipação' },
  { id: 'ciclo_menstrual', label: 'Ciclo menstrual' },
  { id: 'treino_intenso',  label: 'Treino mais intenso' },
  { id: 'sono_estresse',   label: 'Sono / estresse' },
  { id: 'nenhum',          label: 'Nenhum' },
]

function ScreeningFlow({ profile, onUpdateProfile, onDone, onCancel }: {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onDone: () => void
  onCancel: () => void
}) {
  const [answers, setAnswers] = useState<PlateauScreeningAnswers>(DEFAULT_SCREENING)
  const ok = answers.pesoIgualTresSemanas !== null && answers.alimentacaoMudou !== null
    && answers.atividadeMudou !== null && answers.fatoresTemporarios.length > 0 && answers.controleFome !== null

  function toggleFator(id: string) {
    setAnswers(a => {
      if (id === 'nenhum') return { ...a, fatoresTemporarios: a.fatoresTemporarios.includes('nenhum') ? [] : ['nenhum'] }
      const semNenhum = a.fatoresTemporarios.filter(f => f !== 'nenhum')
      const next = semNenhum.includes(id) ? semNenhum.filter(f => f !== id) : [...semNenhum, id]
      return { ...a, fatoresTemporarios: next }
    })
  }

  function startTracking() {
    const lastWeight = getCurrentWeight(profile)
    onUpdateProfile(writePlateauStatus(profile, {
      status: 'em_acompanhamento_14dias',
      screeningAnswers: answers,
      tracking: { startDate: todayStr(), origin: 'com_historico', baselineWeight: lastWeight },
    }))
    onDone()
  }

  const fatoresAtivos = answers.fatoresTemporarios.filter(f => f !== 'nenhum')
  const showNote = ok && (fatoresAtivos.length > 0 || answers.pesoIgualTresSemanas === 'nao_tenho_certeza')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <StepHeader title="Avaliação rápida" subtitle="5 perguntas para entender melhor o momento" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          Seu peso está praticamente igual há 3 semanas ou mais?
        </p>
        <RadioBtn label="Sim" selected={answers.pesoIgualTresSemanas === 'sim'} onClick={() => setAnswers(a => ({ ...a, pesoIgualTresSemanas: 'sim' }))} />
        <RadioBtn label="Não" selected={answers.pesoIgualTresSemanas === 'nao'} onClick={() => setAnswers(a => ({ ...a, pesoIgualTresSemanas: 'nao' }))} />
        <RadioBtn label="Não tenho certeza" selected={answers.pesoIgualTresSemanas === 'nao_tenho_certeza'} onClick={() => setAnswers(a => ({ ...a, pesoIgualTresSemanas: 'nao_tenho_certeza' }))} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Sua alimentação mudou nas últimas semanas?</p>
        <RadioBtn label="Sim"       selected={answers.alimentacaoMudou === 'sim'}       onClick={() => setAnswers(a => ({ ...a, alimentacaoMudou: 'sim' }))} />
        <RadioBtn label="Não"       selected={answers.alimentacaoMudou === 'nao'}       onClick={() => setAnswers(a => ({ ...a, alimentacaoMudou: 'nao' }))} />
        <RadioBtn label="Um pouco"  selected={answers.alimentacaoMudou === 'um_pouco'}  onClick={() => setAnswers(a => ({ ...a, alimentacaoMudou: 'um_pouco' }))} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Sua atividade física ou rotina de exercícios mudou?</p>
        <RadioBtn label="Sim"      selected={answers.atividadeMudou === 'sim'}      onClick={() => setAnswers(a => ({ ...a, atividadeMudou: 'sim' }))} />
        <RadioBtn label="Não"      selected={answers.atividadeMudou === 'nao'}      onClick={() => setAnswers(a => ({ ...a, atividadeMudou: 'nao' }))} />
        <RadioBtn label="Um pouco" selected={answers.atividadeMudou === 'um_pouco'} onClick={() => setAnswers(a => ({ ...a, atividadeMudou: 'um_pouco' }))} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          Você percebeu algum fator que possa alterar temporariamente seu peso?
        </p>
        {FATORES_TEMPORARIOS.map(f => (
          <CheckBtn key={f.id} label={f.label} checked={answers.fatoresTemporarios.includes(f.id)} onChange={() => toggleFator(f.id)} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Como está o controle da fome atualmente?</p>
        <RadioBtn label="Igual"     selected={answers.controleFome === 'igual'}     onClick={() => setAnswers(a => ({ ...a, controleFome: 'igual' }))} />
        <RadioBtn label="Aumentou"  selected={answers.controleFome === 'aumentou'}  onClick={() => setAnswers(a => ({ ...a, controleFome: 'aumentou' }))} />
        <RadioBtn label="Diminuiu"  selected={answers.controleFome === 'diminuiu'}  onClick={() => setAnswers(a => ({ ...a, controleFome: 'diminuiu' }))} />
      </div>

      {showNote && (
        <div className="card-warning">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
            <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
              {fatoresAtivos.length > 0 && 'Os fatores selecionados podem mascarar a balança temporariamente. '}
              {answers.pesoIgualTresSemanas === 'nao_tenho_certeza' && 'Sem certeza sobre a estabilidade, o acompanhamento de 14 dias ajuda a confirmar a tendência.'}
            </p>
          </div>
        </div>
      )}

      <NextBtn onClick={startTracking} disabled={!ok} label="Iniciar acompanhamento de 14 dias" />
      <button onClick={onCancel} className="btn-ghost" style={{ width: '100%' }}>Cancelar</button>
    </div>
  )
}

// ── Avaliação inicial (3 perguntas — usuário sem histórico) ────────────────────

const DEFAULT_NEWUSER: PlateauNewUserAnswers = {
  currentWeight: '', weightThreeWeeksAgo: '', stagnantThreeWeeks: null,
}

function NewUserFlow({ profile, onUpdateProfile, onDone, onCancel, onGoProgress }: {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onDone: () => void
  onCancel: () => void
  onGoProgress: () => void
}) {
  const [answers, setAnswers] = useState<PlateauNewUserAnswers>(DEFAULT_NEWUSER)
  const [dontRemember, setDontRemember] = useState(false)
  const [result, setResult] = useState<'possivel_estagnacao' | 'sem_sinal' | null>(null)

  const currentValid = parseFloat(answers.currentWeight) > 0
  const pastValid = dontRemember || parseFloat(answers.weightThreeWeeksAgo) > 0
  const ok = currentValid && pastValid && answers.stagnantThreeWeeks !== null

  function submit() {
    const verdict = evaluateNewUser(answers)
    const w = parseFloat(answers.currentWeight)
    const entry = { date: todayStr(), weight: w }
    const alreadyToday = profile.weightHistory.some(e => e.date === entry.date)
    const nextHistory = alreadyToday ? profile.weightHistory : [...profile.weightHistory, entry]

    const patched = writePlateauStatus(
      { ...profile, weightHistory: nextHistory, currentWeight: w },
      {
        status: verdict,
        newUserAnswers: answers,
        ...(verdict === 'possivel_estagnacao'
          ? { tracking: { startDate: entry.date, origin: 'sem_historico' as const, baselineWeight: w } }
          : {}),
      }
    )
    onUpdateProfile(patched)
    setResult(verdict)
  }

  if (result === 'possivel_estagnacao') {
    return (
      <PlateauCard
        tone="warning"
        icon={<Search size={26} strokeWidth={1.75} />}
        title="Possível estagnação identificada"
        subtitle="Como ainda não temos histórico suficiente do seu peso, vamos acompanhar sua evolução por 14 dias antes de tirar uma conclusão."
        cta={{ label: 'Ok, entendi', onClick: onDone }}
      />
    )
  }
  if (result === 'sem_sinal') {
    return (
      <PlateauCard
        tone="neutral"
        icon={<CheckCircle2 size={26} strokeWidth={1.75} />}
        title="Não há sinal claro de estagnação neste momento"
        subtitle="Continue registrando seu peso para que o Minha Tize acompanhe sua evolução ao longo do tempo."
        cta={{ label: 'Registrar peso', onClick: onGoProgress }}
      />
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <StepHeader title="Avaliação inicial" subtitle="3 perguntas rápidas, já que ainda não temos seu histórico" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Qual é o seu peso atual? (kg)</p>
        <input
          type="number" className="input-field" placeholder="Ex: 80" min={20} max={400} step={0.1} inputMode="decimal"
          value={answers.currentWeight} onChange={e => setAnswers(a => ({ ...a, currentWeight: e.target.value }))}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          Quanto você pesava aproximadamente 3 semanas atrás? (kg)
        </p>
        <input
          type="number" className="input-field" placeholder="Ex: 82" min={20} max={400} step={0.1} inputMode="decimal"
          disabled={dontRemember}
          value={answers.weightThreeWeeksAgo}
          onChange={e => setAnswers(a => ({ ...a, weightThreeWeeksAgo: e.target.value }))}
          style={{ opacity: dontRemember ? 0.5 : 1 }}
        />
        <CheckBtn
          label="Não lembro" checked={dontRemember}
          onChange={() => { setDontRemember(v => !v); setAnswers(a => ({ ...a, weightThreeWeeksAgo: '' })) }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          Seu peso está praticamente estagnado há 3 semanas ou mais?
        </p>
        <RadioBtn label="Sim" selected={answers.stagnantThreeWeeks === 'sim'} onClick={() => setAnswers(a => ({ ...a, stagnantThreeWeeks: 'sim' }))} />
        <RadioBtn label="Não" selected={answers.stagnantThreeWeeks === 'nao'} onClick={() => setAnswers(a => ({ ...a, stagnantThreeWeeks: 'nao' }))} />
        <RadioBtn label="Não tenho certeza" selected={answers.stagnantThreeWeeks === 'nao_tenho_certeza'} onClick={() => setAnswers(a => ({ ...a, stagnantThreeWeeks: 'nao_tenho_certeza' }))} />
      </div>

      <NextBtn onClick={submit} disabled={!ok} label="Ver avaliação" />
      <button onClick={onCancel} className="btn-ghost" style={{ width: '100%' }}>Cancelar</button>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onNavigate?: (tab: Tab, section?: string) => void
}

type Mode = 'auto' | 'screening' | 'newuser' | 'habits'

export default function AntiPlato({ profile, onUpdateProfile, onNavigate }: Props) {
  const [mode, setMode] = useState<Mode>('auto')

  function goProgress() {
    onNavigate?.('progress')
  }

  if (mode === 'screening') {
    return (
      <ScreeningFlow
        profile={profile} onUpdateProfile={onUpdateProfile}
        onDone={() => setMode('auto')} onCancel={() => setMode('auto')}
      />
    )
  }
  if (mode === 'newuser') {
    return (
      <NewUserFlow
        profile={profile} onUpdateProfile={onUpdateProfile}
        onDone={() => setMode('auto')} onCancel={() => setMode('auto')} onGoProgress={goProgress}
      />
    )
  }
  if (mode === 'habits') {
    return <HabitsWizard profile={profile} onUpdateProfile={onUpdateProfile} onBack={() => setMode('auto')} />
  }

  return (
    <AutoView
      profile={profile}
      onUpdateProfile={onUpdateProfile}
      onGoProgress={goProgress}
      onStartScreening={() => setMode('screening')}
      onStartNewUser={() => setMode('newuser')}
      onOpenHabits={() => setMode('habits')}
    />
  )
}
