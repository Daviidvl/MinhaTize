import { useState, useEffect } from 'react'

const PLAN_KEY = 'tizetrack_antiplato'

const FOOD_ITEMS = [
  'Café com açúcar',
  'Molhos (maionese, ketchup, etc.)',
  'Refrigerantes',
  'Bebidas alcoólicas',
  'Beliscos entre refeições',
  'Doces diários',
  'Bebidas calóricas (sucos, vitaminas)',
  'Óleo em excesso',
  'Fast food frequente',
  'Petiscos noturnos',
]

const MEDS_LIST = [
  'Antidepressivos',
  'Corticoides',
  'Antipsicóticos',
  'Insulina',
  'Outros',
]

const CHECK_ITEMS = [
  { id: 'water',    label: 'Água',               detail: '2–3 litros',  icon: '💧' },
  { id: 'food',     label: 'Registro alimentar',  detail: '',            icon: '📝' },
  { id: 'protein',  label: 'Proteína',            detail: '',            icon: '🥩' },
  { id: 'steps',    label: 'Passos',              detail: '',            icon: '👟' },
  { id: 'exercise', label: 'Treino',              detail: '',            icon: '💪' },
  { id: 'sleep',    label: 'Sono',                detail: '7+ horas',    icon: '😴' },
]

const WEIGH_DAYS = [1, 4, 8, 12, 14]

type WizardStep =
  | 'intro' | 'step1' | 'not-plateau'
  | 'step2' | 'step3' | 'step4' | 'step5' | 'step6'
  | 'diagnosis' | 'plan' | 'reeval' | 'report'

const STEP_NUMS: Partial<Record<WizardStep, number>> = {
  step1: 1, step2: 2, step3: 3, step4: 4, step5: 5, step6: 6,
}

interface Answers {
  usingMed: boolean | null
  stableDuration: 'lt2' | '2to4' | 'gt4' | null
  recentExcess: boolean | null
  routineChange: boolean | null
  menstruating: 'yes' | 'no' | 'na' | null
  weightGainDay: boolean | null
  foodItems: string[]
  currentWeight: string
  meetsProtein: boolean | null
  usesWhey: boolean | null
  dailySteps: string | null
  strengthTraining: string | null
  cardio: string | null
  sleepHours: string | null
  stressLevel: number
  medications: string[]
}

interface PriorityItem {
  id: string
  level: 'high' | 'moderate' | 'low'
  label: string
  detail: string
}

interface PlanData {
  startDate: string
  checks: Record<string, boolean[]>
  weighIns: Record<string, string>
  proteinMin: number
  proteinMax: number
  stepsGoal: string
  priorities: PriorityItem[]
  reevalResult?: 'dropped' | 'same' | 'increased'
  aiReport?: string
}

const DEFAULT_ANSWERS: Answers = {
  usingMed: null, stableDuration: null, recentExcess: null,
  routineChange: null, menstruating: null, weightGainDay: null,
  foodItems: [], currentWeight: '', meetsProtein: null, usesWhey: null,
  dailySteps: null, strengthTraining: null, cardio: null,
  sleepHours: null, stressLevel: 5, medications: [],
}

function computeDiagnosis(a: Answers): PriorityItem[] {
  const items: PriorityItem[] = []
  const w = parseFloat(a.currentWeight) || 0
  if (a.meetsProtein === false)
    items.push({ id: 'protein', level: 'high', label: 'Baixa ingestão de proteínas', detail: w > 0 ? `Meta: ${Math.round(w * 1.2)}–${Math.round(w * 1.5)} g/dia` : '' })
  if (a.foodItems.length >= 6)
    items.push({ id: 'calories', level: 'high', label: 'Possível excesso calórico oculto', detail: `${a.foodItems.length} fatores identificados` })
  else if (a.foodItems.length >= 3)
    items.push({ id: 'calories', level: 'moderate', label: 'Calorias ocultas — risco moderado', detail: `${a.foodItems.length} fatores identificados` })
  if (a.dailySteps && ['lt3000', '3to5k', '5to7k'].includes(a.dailySteps))
    items.push({ id: 'steps', level: 'moderate', label: 'Pouca movimentação diária', detail: 'Meta: 7.000–8.000 passos/dia' })
  if (a.strengthTraining && ['never', '1x'].includes(a.strengthTraining))
    items.push({ id: 'strength', level: 'moderate', label: 'Treino de força insuficiente', detail: 'Recomendado: 2–3x por semana' })
  if (a.sleepHours && ['lt5', '5to6'].includes(a.sleepHours))
    items.push({ id: 'sleep', level: 'moderate', label: 'Sono insuficiente', detail: 'Meta: 7+ horas por noite' })
  if (a.stressLevel > 7)
    items.push({ id: 'stress', level: 'moderate', label: 'Estresse elevado', detail: `Nível ${a.stressLevel}/10` })
  if (a.cardio && ['no', '1x'].includes(a.cardio))
    items.push({ id: 'cardio', level: 'low', label: 'Cardio abaixo do recomendado', detail: 'Recomendado: 2x por semana' })
  if (a.medications.length > 0)
    items.push({ id: 'meds', level: 'low', label: 'Medicamentos que podem interferir', detail: a.medications.join(', ') })
  return items.sort((x, y) =>
    ['high', 'moderate', 'low'].indexOf(x.level) - ['high', 'moderate', 'low'].indexOf(y.level)
  )
}

function getDayNumber(startDate: string): number {
  const startMs = new Date(startDate).getTime()
  const todayMs = new Date(new Date().toISOString().split('T')[0]).getTime()
  const diff    = Math.round((todayMs - startMs) / 86400000)
  return Math.min(14, Math.max(1, diff + 1))
}

function getRawDay(startDate: string): number {
  const startMs = new Date(startDate).getTime()
  const todayMs = new Date(new Date().toISOString().split('T')[0]).getTime()
  return Math.round((todayMs - startMs) / 86400000) + 1
}

function saveToStorage(plan: PlanData) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function RadioBtn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
      borderRadius: '12px', border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-strong)'}`,
      background: selected ? 'var(--primary-light)' : 'var(--surface)',
      color: selected ? 'var(--primary)' : 'var(--text-secondary)',
      fontWeight: selected ? 700 : 500, fontSize: '14px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-strong)'}`,
        background: selected ? 'var(--primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
      </span>
      {label}
    </button>
  )
}

function CheckBtn({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width: '100%', padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
      borderRadius: '12px', border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
      background: checked ? 'var(--primary-light)' : 'var(--surface)',
      color: checked ? 'var(--primary)' : 'var(--text-secondary)',
      fontWeight: checked ? 700 : 500, fontSize: '13px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{
        width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
        border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-strong)'}`,
        background: checked ? 'var(--primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', color: '#fff',
      }}>
        {checked && '✓'}
      </span>
      {label}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AntiPlato() {
  const [step, setStep]         = useState<WizardStep>('intro')
  const [answers, setAnswers]   = useState<Answers>(DEFAULT_ANSWERS)
  const [plan, setPlan]         = useState<PlanData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]   = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(PLAN_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw) as PlanData
      setPlan(data)
      if (data.aiReport)        setStep('report')
      else if (data.reevalResult) setStep('reeval')
      else if (getRawDay(data.startDate) > 14) setStep('reeval')
      else setStep('plan')
    } catch { /**/ }
  }, [])

  function updatePlan(updates: Partial<PlanData>) {
    setPlan(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      saveToStorage(next)
      return next
    })
  }

  function resetAll() {
    localStorage.removeItem(PLAN_KEY)
    setPlan(null)
    setAnswers(DEFAULT_ANSWERS)
    setAiError('')
    setConfirmReset(false)
    setStep('intro')
  }

  function set<K extends keyof Answers>(key: K, val: Answers[K]) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }

  function toggleFood(item: string) {
    setAnswers(prev => ({
      ...prev,
      foodItems: prev.foodItems.includes(item)
        ? prev.foodItems.filter(i => i !== item)
        : [...prev.foodItems, item],
    }))
  }

  function toggleMed(item: string) {
    setAnswers(prev => ({
      ...prev,
      medications: prev.medications.includes(item)
        ? prev.medications.filter(i => i !== item)
        : [...prev.medications, item],
    }))
  }

  function toggleCheck(dayKey: string, idx: number) {
    if (!plan) return
    const curr = plan.checks[dayKey] ?? Array(6).fill(false)
    const next  = [...curr]
    next[idx]   = !next[idx]
    updatePlan({ checks: { ...plan.checks, [dayKey]: next } })
  }

  function isNotPlateau() {
    const { stableDuration, recentExcess, routineChange, menstruating, weightGainDay } = answers
    return (
      stableDuration === 'lt2' || stableDuration === '2to4' ||
      recentExcess === true || routineChange === true ||
      menstruating === 'yes' || weightGainDay === true
    )
  }

  function handleStep1Next() {
    setStep(isNotPlateau() ? 'not-plateau' : 'step2')
  }

  function handleStartPlan() {
    const w    = parseFloat(answers.currentWeight) || 0
    const newPlan: PlanData = {
      startDate:  new Date().toISOString().split('T')[0],
      checks:     {},
      weighIns:   {},
      proteinMin: w > 0 ? Math.round(w * 1.2) : 0,
      proteinMax: w > 0 ? Math.round(w * 1.5) : 0,
      stepsGoal:  ['7to10k', 'gt10k'].includes(answers.dailySteps ?? '') ? '8000' : '7000',
      priorities: computeDiagnosis(answers),
    }
    saveToStorage(newPlan)
    setPlan(newPlan)
    setStep('plan')
  }

  async function generateReport() {
    if (!plan) return
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!key) {
      setAiError('Chave da API não configurada. Adicione VITE_ANTHROPIC_API_KEY no .env.local e reinicie o servidor.')
      return
    }
    setAiLoading(true)
    setAiError('')
    const payload = {
      prioridades: plan.priorities.map(p => `${p.level}: ${p.label}`).join(' | '),
      proteina:    plan.priorities.find(p => p.id === 'protein') ? 'insuficiente' : 'adequada',
      passos_meta: plan.stepsGoal,
      peso_kg:     plan.weighIns['1'] ?? 'não informado',
      resultado_14_dias: plan.reevalResult ?? 'sem dado',
    }
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Você é um assistente educativo de saúde em um app de acompanhamento de tirzepatida. Analise os dados do usuário após 14 dias de plano anti-platô e gere um relatório educativo em português, com linguagem acolhedora e simples.

Dados:
${JSON.stringify(payload, null, 2)}

O relatório deve conter exatamente estes 5 blocos em texto corrido (sem markdown):

1. Resumo dos principais gargalos encontrados
2. Ordem de prioridade de ação com metas práticas e específicas
3. Orientações para os próximos 14 dias
4. Reforço de que platô não é fracasso — é parte do processo
5. Quando buscar acompanhamento médico

Use parágrafos curtos. Não sugira alteração de dose do medicamento.`,
          }],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const text = data.content?.[0]?.text ?? 'Relatório não disponível.'
      updatePlan({ aiReport: text })
      setStep('report')
    } catch {
      setAiError('Erro ao gerar o relatório. Verifique sua conexão e a chave da API.')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Progress bar shown on wizard steps 1–6 ───────────────────────────────
  const stepNum = STEP_NUMS[step]

  function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
      <div>
        {stepNum && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '99px', background: 'var(--surface-3)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px', background: 'var(--primary)',
                width: `${(stepNum / 6) * 100}%`, transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {stepNum} de 6
            </span>
          </div>
        )}
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>{subtitle}</p>}
      </div>
    )
  }

  function NextBtn({ onClick, disabled = false, label = 'Continuar →' }: { onClick: () => void; disabled?: boolean; label?: string }) {
    return (
      <button onClick={onClick} disabled={disabled} className="btn-primary" style={{ width: '100%', marginTop: '4px' }}>
        {label}
      </button>
    )
  }

  function ResetBtn() {
    if (confirmReset) {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={resetAll} style={{
            flex: 1, padding: '10px', borderRadius: '10px', background: '#EF444415', border: '1.5px solid #EF444430',
            color: '#EF4444', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Confirmar reset
          </button>
          <button onClick={() => setConfirmReset(false)} style={{
            flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--surface-2)',
            border: '1.5px solid var(--border)', color: 'var(--text-muted)',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Cancelar
          </button>
        </div>
      )
    }
    return (
      <button onClick={() => setConfirmReset(true)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
        fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Plus Jakarta Sans', sans-serif",
        display: 'block', margin: '0 auto',
      }}>
        Reiniciar avaliação
      </button>
    )
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
        borderRadius: '24px', padding: '28px 22px', color: '#fff',
        boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
      }}>
        <span style={{ fontSize: '40px', display: 'block', marginBottom: '14px' }}>🚧</span>
        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>Anti-Platô da Tize</h2>
        <p style={{ fontSize: '14px', opacity: 0.85, marginTop: '8px', lineHeight: 1.6 }}>
          Seu peso parou de cair?<br />
          Descubra se é um platô verdadeiro e receba um plano prático para voltar a evoluir.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { icon: '🔍', text: '6 perguntas para identificar as causas' },
          { icon: '📊', text: 'Diagnóstico automático personalizado' },
          { icon: '📅', text: 'Plano de ação de 14 dias com checklist diário' },
          { icon: '📝', text: 'Relatório educativo ao final' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>{item.text}</p>
          </div>
        ))}
      </div>

      <button onClick={() => setStep('step1')} className="btn-primary" style={{ width: '100%' }}>
        Iniciar avaliação
      </button>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Módulo educativo. Não substitui avaliação médica. Não sugere alteração de dose.
      </p>
    </div>
  )

  // ── STEP 1 ────────────────────────────────────────────────────────────────
  if (step === 'step1') {
    const ok = answers.usingMed !== null && answers.stableDuration !== null &&
      answers.recentExcess !== null && answers.routineChange !== null &&
      answers.menstruating !== null && answers.weightGainDay !== null

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <StepHeader title="É platô de verdade?" subtitle="Responda para identificar o tipo de estagnação" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Você está usando tirzepatida regularmente?</p>
          <RadioBtn label="Sim" selected={answers.usingMed === true}  onClick={() => set('usingMed', true)} />
          <RadioBtn label="Não" selected={answers.usingMed === false} onClick={() => set('usingMed', false)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Seu peso está praticamente igual há:</p>
          <RadioBtn label="Menos de 2 semanas" selected={answers.stableDuration === 'lt2'}   onClick={() => set('stableDuration', 'lt2')} />
          <RadioBtn label="2 a 4 semanas"      selected={answers.stableDuration === '2to4'}  onClick={() => set('stableDuration', '2to4')} />
          <RadioBtn label="Mais de 4 semanas"  selected={answers.stableDuration === 'gt4'}   onClick={() => set('stableDuration', 'gt4')} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Houve viagem, festa ou exageros recentes?</p>
          <RadioBtn label="Sim" selected={answers.recentExcess === true}  onClick={() => set('recentExcess', true)} />
          <RadioBtn label="Não" selected={answers.recentExcess === false} onClick={() => set('recentExcess', false)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Mudou drasticamente sua rotina?</p>
          <RadioBtn label="Sim" selected={answers.routineChange === true}  onClick={() => set('routineChange', true)} />
          <RadioBtn label="Não" selected={answers.routineChange === false} onClick={() => set('routineChange', false)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Está menstruada?</p>
          <RadioBtn label="Sim"           selected={answers.menstruating === 'yes'} onClick={() => set('menstruating', 'yes')} />
          <RadioBtn label="Não"           selected={answers.menstruating === 'no'}  onClick={() => set('menstruating', 'no')} />
          <RadioBtn label="Não se aplica" selected={answers.menstruating === 'na'}  onClick={() => set('menstruating', 'na')} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Você teve aumento de peso em apenas um dia?</p>
          <RadioBtn label="Sim" selected={answers.weightGainDay === true}  onClick={() => set('weightGainDay', true)} />
          <RadioBtn label="Não" selected={answers.weightGainDay === false} onClick={() => set('weightGainDay', false)} />
        </div>

        <NextBtn onClick={handleStep1Next} disabled={!ok} />
      </div>
    )
  }

  // ── NOT PLATEAU ───────────────────────────────────────────────────────────
  if (step === 'not-plateau') {
    const reasons = [
      answers.stableDuration !== 'gt4' && 'Peso parado há menos de 4 semanas — é cedo para ser platô',
      answers.recentExcess    === true  && 'Houve eventos ou exageros recentes que podem explicar a estabilidade',
      answers.routineChange   === true  && 'Mudança de rotina pode impactar o peso temporariamente',
      answers.menstruating    === 'yes' && 'Retenção hídrica menstrual pode mascarar a perda real',
      answers.weightGainDay   === true  && 'Variações de peso em um único dia são normais e não indicam platô',
    ].filter(Boolean) as string[]

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          borderRadius: '20px', padding: '22px', textAlign: 'center',
          background: 'var(--primary-light)', border: '1.5px solid rgba(5,150,105,0.3)',
        }}>
          <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>🌱</span>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            Provavelmente não é um platô verdadeiro
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
            Os dados indicam que a estagnação pode ter uma causa temporária.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Motivos identificados
          </p>
          {reasons.map((r, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '10px 14px', borderRadius: '12px',
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>💡</span>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{r}</p>
            </div>
          ))}
        </div>

        <div className="card-warning">
          <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
            Continue seu protocolo normalmente. Se o peso permanecer estável por mais de 4 semanas sem explicação, retorne e refaça a avaliação.
          </p>
        </div>

        <button onClick={() => { setAnswers(DEFAULT_ANSWERS); setStep('intro') }} className="btn-ghost" style={{ width: '100%' }}>
          Reiniciar avaliação
        </button>
      </div>
    )
  }

  // ── STEP 2 ────────────────────────────────────────────────────────────────
  if (step === 'step2') {
    const score = answers.foodItems.length
    const riskColor = score >= 6 ? '#EF4444' : score >= 3 ? '#F59E0B' : '#10B981'
    const riskLabel = score >= 6 ? 'Possível excesso calórico oculto' : score >= 3 ? 'Risco moderado' : score > 0 ? 'Baixo risco' : ''

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <StepHeader title="Auditoria alimentar" subtitle="Selecione tudo o que aconteceu na última semana" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FOOD_ITEMS.map(item => (
            <CheckBtn key={item} label={item} checked={answers.foodItems.includes(item)} onChange={() => toggleFood(item)} />
          ))}
        </div>

        {score > 0 && (
          <div style={{
            padding: '12px 14px', borderRadius: '14px',
            background: `${riskColor}08`, border: `1.5px solid ${riskColor}30`,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '22px' }}>{score >= 6 ? '🔴' : score >= 3 ? '🟡' : '🟢'}</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: '13px', color: riskColor, margin: 0 }}>{riskLabel}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{score} item{score !== 1 ? 's' : ''} identificado{score !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        <NextBtn onClick={() => setStep('step3')} />
      </div>
    )
  }

  // ── STEP 3 ────────────────────────────────────────────────────────────────
  if (step === 'step3') {
    const w    = parseFloat(answers.currentWeight) || 0
    const pMin = w > 0 ? Math.round(w * 1.2) : null
    const pMax = w > 0 ? Math.round(w * 1.5) : null
    const ok   = (parseFloat(answers.currentWeight) > 0) && answers.meetsProtein !== null && answers.usesWhey !== null

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <StepHeader title="Proteína" subtitle="Fundamental para preservar músculo durante o emagrecimento" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Peso atual (kg)</p>
          <input
            type="number" value={answers.currentWeight}
            onChange={e => set('currentWeight', e.target.value)}
            placeholder="Ex: 80"
            min={20} max={400} step={0.1}
            inputMode="decimal"
            className="input-field"
          />
          {pMin && pMax && (
            <div style={{
              padding: '11px 14px', borderRadius: '12px',
              background: 'var(--primary-light)', border: '1px solid rgba(5,150,105,0.25)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800, margin: 0 }}>
                Sua meta: {pMin}–{pMax} g de proteína/dia
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Você acredita atingir essa meta diariamente?</p>
          <RadioBtn label="Sim" selected={answers.meetsProtein === true}  onClick={() => set('meetsProtein', true)} />
          <RadioBtn label="Não" selected={answers.meetsProtein === false} onClick={() => set('meetsProtein', false)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Você utiliza whey protein?</p>
          <RadioBtn label="Sim" selected={answers.usesWhey === true}  onClick={() => set('usesWhey', true)} />
          <RadioBtn label="Não" selected={answers.usesWhey === false} onClick={() => set('usesWhey', false)} />
        </div>

        <NextBtn onClick={() => setStep('step4')} disabled={!ok} />
      </div>
    )
  }

  // ── STEP 4 ────────────────────────────────────────────────────────────────
  if (step === 'step4') {
    const ok = answers.dailySteps !== null && answers.strengthTraining !== null && answers.cardio !== null

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <StepHeader title="Movimento e treino" subtitle="A atividade física impacta diretamente o metabolismo" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Passos por dia (em média)</p>
          {[
            { v: 'lt3000', l: 'Menos de 3.000' },
            { v: '3to5k',  l: '3.000 a 5.000' },
            { v: '5to7k',  l: '5.000 a 7.000' },
            { v: '7to10k', l: '7.000 a 10.000' },
            { v: 'gt10k',  l: 'Mais de 10.000' },
          ].map(opt => (
            <RadioBtn key={opt.v} label={opt.l} selected={answers.dailySteps === opt.v} onClick={() => set('dailySteps', opt.v)} />
          ))}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Meta recomendada: 7.000–8.000 passos/dia</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Treino de força (musculação)</p>
          {[
            { v: 'never', l: 'Nunca' },
            { v: '1x',    l: '1x por semana' },
            { v: '2to3x', l: '2–3x por semana' },
            { v: '4plus', l: '4x ou mais' },
          ].map(opt => (
            <RadioBtn key={opt.v} label={opt.l} selected={answers.strengthTraining === opt.v} onClick={() => set('strengthTraining', opt.v)} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Cardio semanal</p>
          {[
            { v: 'no',  l: 'Não pratico' },
            { v: '1x',  l: '1x por semana' },
            { v: '2x',  l: '2x por semana' },
            { v: '3x+', l: '3x ou mais' },
          ].map(opt => (
            <RadioBtn key={opt.v} label={opt.l} selected={answers.cardio === opt.v} onClick={() => set('cardio', opt.v)} />
          ))}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Recomendação: 2 sessões semanais</p>
        </div>

        <NextBtn onClick={() => setStep('step5')} disabled={!ok} />
      </div>
    )
  }

  // ── STEP 5 ────────────────────────────────────────────────────────────────
  if (step === 'step5') {
    const slColor = answers.stressLevel > 7 ? '#EF4444' : answers.stressLevel > 4 ? '#F59E0B' : 'var(--primary)'

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <StepHeader title="Sono e estresse" subtitle="Fatores muitas vezes ignorados, mas fundamentais no metabolismo" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Horas de sono por noite (em média)</p>
          {[
            { v: 'lt5',  l: 'Menos de 5 horas' },
            { v: '5to6', l: '5 a 6 horas' },
            { v: '6to7', l: '6 a 7 horas' },
            { v: 'gt7',  l: 'Mais de 7 horas' },
          ].map(opt => (
            <RadioBtn key={opt.v} label={opt.l} selected={answers.sleepHours === opt.v} onClick={() => set('sleepHours', opt.v)} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Nível de estresse atual</p>
            <span style={{
              padding: '4px 10px', borderRadius: '99px', fontSize: '14px', fontWeight: 800,
              background: `${slColor}12`, color: slColor,
            }}>
              {answers.stressLevel}/10
            </span>
          </div>
          <input
            type="range" min={0} max={10} value={answers.stressLevel}
            onChange={e => set('stressLevel', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)', height: '6px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sem estresse</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Muito estressado</span>
          </div>
        </div>

        <NextBtn onClick={() => setStep('step6')} disabled={answers.sleepHours === null} />
      </div>
    )
  }

  // ── STEP 6 ────────────────────────────────────────────────────────────────
  if (step === 'step6') {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <StepHeader title="Medicamentos" subtitle="Alguns remédios podem influenciar o metabolismo" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
            Faz uso de algum destes medicamentos?
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Selecione todos que se aplicam — pode deixar em branco se não usa nenhum
          </p>
          {MEDS_LIST.map(item => (
            <CheckBtn key={item} label={item} checked={answers.medications.includes(item)} onChange={() => toggleMed(item)} />
          ))}
        </div>

        {answers.medications.length > 0 && (
          <div className="card-warning">
            <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
              ⚕️ Alguns medicamentos podem interferir na perda de peso. Converse com seu médico antes de qualquer alteração.
            </p>
          </div>
        )}

        <NextBtn onClick={() => setStep('diagnosis')} label="Ver diagnóstico →" />
      </div>
    )
  }

  // ── DIAGNOSIS ─────────────────────────────────────────────────────────────
  if (step === 'diagnosis') {
    const priorities = computeDiagnosis(answers)
    const levelIcon:  Record<string, string> = { high: '🔴', moderate: '🟡', low: '🟢' }
    const levelLabel: Record<string, string> = { high: 'Alta prioridade', moderate: 'Moderada', low: 'Baixa prioridade' }
    const levelColor: Record<string, string> = { high: '#EF4444', moderate: '#F59E0B', low: '#10B981' }
    const w = parseFloat(answers.currentWeight) || 0

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
          borderRadius: '20px', padding: '20px', color: '#fff',
          boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Diagnóstico
          </p>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Platô provável</h3>
          <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '8px', lineHeight: 1.4 }}>
            {priorities.length > 0
              ? `${priorities.length} fator${priorities.length !== 1 ? 'es' : ''} identificado${priorities.length !== 1 ? 's' : ''}`
              : 'Nenhum gargalo crítico encontrado'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
            Principais gargalos
          </p>
          {priorities.length === 0 ? (
            <div style={{
              padding: '18px', borderRadius: '14px', textAlign: 'center',
              background: 'var(--primary-light)', border: '1px solid rgba(5,150,105,0.25)',
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>✨</span>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Hábitos bem alinhados!</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>O platô pode ser fisiológico. O plano ajuda a desbloquear.</p>
            </div>
          ) : (
            priorities.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px 14px', borderRadius: '14px',
                background: 'var(--surface)', border: `1px solid ${levelColor[p.level]}22`,
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <span style={{ fontSize: '20px' }}>{levelIcon[p.level]}</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: levelColor[p.level] }}>#{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{p.label}</p>
                  {p.detail && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>{p.detail}</p>}
                  <span style={{ fontSize: '10px', fontWeight: 700, color: levelColor[p.level] }}>{levelLabel[p.level]}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {w > 0 && (
          <div className="card" style={{ padding: '14px 16px' }}>
            <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0, marginBottom: '10px' }}>
              🎯 Suas metas no plano
            </p>
            {[
              { icon: '🥩', label: 'Proteína', value: `${Math.round(w * 1.2)}–${Math.round(w * 1.5)} g/dia` },
              { icon: '👟', label: 'Passos',   value: '7.000–8.000/dia' },
              { icon: '💧', label: 'Água',     value: '2–3 litros/dia' },
              { icon: '😴', label: 'Sono',     value: '7+ horas/noite' },
            ].map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{m.icon} {m.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>{m.value}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleStartPlan} className="btn-primary" style={{ width: '100%' }}>
          🚀 Iniciar Plano de 14 dias
        </button>
      </div>
    )
  }

  // ── PLAN ──────────────────────────────────────────────────────────────────
  if (step === 'plan' && plan) {
    const today    = getDayNumber(plan.startDate)
    const todayKey = String(today)
    const todayChecks    = plan.checks[todayKey] ?? Array(6).fill(false)
    const completedToday = todayChecks.filter(Boolean).length
    const isWeighDay     = WEIGH_DAYS.includes(today)
    const totalChecked   = Object.values(plan.checks).flat().filter(Boolean).length
    const totalPossible  = today * 6
    const adherence      = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
          borderRadius: '20px', padding: '18px 20px', color: '#fff',
          boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                Plano Anti-Platô
              </p>
              <p style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                Dia {today} <span style={{ fontSize: '16px', opacity: 0.7 }}>de 14</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', opacity: 0.7, margin: 0 }}>Adesão geral</p>
              <p style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{adherence}%</p>
            </div>
          </div>
          <div style={{ marginTop: '12px', height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: '#fff', width: `${(today / 14) * 100}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Today's checklist */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
              📋 Hoje — Dia {today}
            </p>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px',
              background: completedToday === 6 ? 'var(--primary-light)' : 'var(--surface-2)',
              color: completedToday === 6 ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {completedToday}/6
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CHECK_ITEMS.map((item, idx) => {
              const checked = todayChecks[idx] ?? false
              const detail  = item.id === 'protein' && plan.proteinMin > 0
                ? `${plan.proteinMin}–${plan.proteinMax} g`
                : item.id === 'steps'
                ? `${plan.stepsGoal}+ passos`
                : item.detail
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(todayKey, idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
                    border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                    background: checked ? 'var(--primary-light)' : 'var(--surface-2)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: checked ? 'var(--primary)' : 'var(--surface-3)',
                    fontSize: checked ? '15px' : '18px', color: checked ? '#fff' : undefined,
                    fontWeight: 700,
                  }}>
                    {checked ? '✓' : item.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: checked ? 'var(--primary)' : 'var(--text-primary)', margin: 0 }}>
                      {item.label}
                    </p>
                    {detail && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{detail}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Weigh-in field */}
        {isWeighDay && (
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              ⚖️ Pesagem — Dia {today}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Preferencialmente pela manhã, em jejum
            </p>
            <input
              type="number" step="0.1" min={20} max={400}
              placeholder="Ex: 79.5"
              value={plan.weighIns[todayKey] ?? ''}
              onChange={e => updatePlan({ weighIns: { ...plan.weighIns, [todayKey]: e.target.value } })}
              className="input-field" inputMode="decimal"
            />
          </div>
        )}

        {/* Upcoming weigh-ins strip */}
        {WEIGH_DAYS.filter(d => d > today).length > 0 && (
          <div style={{
            padding: '11px 14px', borderRadius: '14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
              Próximas pesagens:
            </p>
            {WEIGH_DAYS.filter(d => d > today).map(d => (
              <span key={d} style={{
                padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                background: 'var(--surface-2)', color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}>
                Dia {d}
              </span>
            ))}
          </div>
        )}

        {/* History */}
        {today > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              Histórico
            </p>
            {Array.from({ length: today - 1 }, (_, i) => today - 1 - i).map(day => {
              const key    = String(day)
              const checks = plan.checks[key] ?? []
              const done   = checks.filter(Boolean).length
              const weighIn = plan.weighIns[key]
              return (
                <div key={day} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 14px', borderRadius: '12px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', width: '38px', flexShrink: 0 }}>
                    Dia {day}
                  </span>
                  <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: 'var(--primary)', width: `${(done / 6) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: done === 6 ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}>
                    {done}/6
                  </span>
                  {WEIGH_DAYS.includes(day) && (
                    <span style={{ fontSize: '10px', color: weighIn ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}>
                      {weighIn ? `${weighIn} kg` : '⚖️ —'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {today >= 14 && (
          <button
            onClick={() => setStep('reeval')}
            className="btn-primary"
            style={{ width: '100%', background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
          >
            🏁 Avaliar resultado do plano
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
          <ResetBtn />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            Ao reiniciar, o plano atual e os registros serão apagados.
          </p>
        </div>
      </div>
    )
  }

  // ── REEVAL ────────────────────────────────────────────────────────────────
  if (step === 'reeval') {
    if (plan?.reevalResult) {
      const config = {
        dropped:   { icon: '🎉', color: '#10B981', bg: 'var(--primary-light)', border: 'rgba(16,185,129,0.3)', title: 'Excelente resultado!', msg: 'Continue os hábitos construídos. O platô foi desbloqueado!' },
        same:      { icon: '🔍', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', title: 'Peso estável', msg: 'Pode ser interessante apresentar seus registros ao médico e discutir os próximos passos.' },
        increased: { icon: '📊', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', title: 'Peso aumentou', msg: 'Revise possíveis calorias ocultas e sua rotina alimentar. Considere conversar com seu médico.' },
      }[plan.reevalResult]

      return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '22px', borderRadius: '20px', background: config.bg, border: `1.5px solid ${config.border}`, textAlign: 'center' }}>
            <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>{config.icon}</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: config.color, margin: 0 }}>{config.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>{config.msg}</p>
          </div>

          {plan.aiReport ? (
            <button onClick={() => setStep('report')} className="btn-primary" style={{ width: '100%' }}>
              📝 Ver relatório completo
            </button>
          ) : (
            <>
              <button onClick={generateReport} className="btn-primary" style={{ width: '100%' }} disabled={aiLoading}>
                {aiLoading ? 'Gerando relatório...' : '✨ Gerar relatório com IA'}
              </button>
              {aiError && <p style={{ fontSize: '12px', color: '#EF4444', textAlign: 'center', lineHeight: 1.5 }}>{aiError}</p>}
            </>
          )}

          <button onClick={resetAll} className="btn-ghost" style={{ width: '100%' }}>
            Nova avaliação
          </button>
        </div>
      )
    }

    // Selection screen
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
          borderRadius: '20px', padding: '20px', color: '#fff',
          boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
        }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>🏁</span>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>14 dias concluídos!</h3>
          <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '8px', lineHeight: 1.4 }}>
            Como está seu peso em relação ao início do plano?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { v: 'dropped',   icon: '✅', label: 'Peso caiu',             sub: 'Ótimo — desbloqueamos o platô' },
            { v: 'same',      icon: '⏸️', label: 'Peso permaneceu igual', sub: 'Sem mudança significativa' },
            { v: 'increased', icon: '📈', label: 'Peso aumentou',          sub: 'Precisa de revisão' },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => { updatePlan({ reevalResult: opt.v as PlanData['reevalResult'] }); setStep('reeval') }}
              style={{
                width: '100%', padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                borderRadius: '14px', border: '1.5px solid var(--border-strong)',
                background: 'var(--surface)', fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{opt.icon}</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{opt.label}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── REPORT ────────────────────────────────────────────────────────────────
  if (step === 'report' && plan) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>
            📝
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Relatório Final
          </h3>
        </div>

        {plan.aiReport ? (
          <div className="card" style={{ padding: '18px' }}>
            {plan.aiReport.split('\n').filter(l => l.trim()).map((line, i) => (
              <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, marginBottom: '10px' }}>
                {line}
              </p>
            ))}
          </div>
        ) : (
          <>
            <button onClick={generateReport} className="btn-primary" style={{ width: '100%' }} disabled={aiLoading}>
              {aiLoading ? 'Gerando relatório...' : '✨ Gerar relatório com IA'}
            </button>
            {aiError && <p style={{ fontSize: '12px', color: '#EF4444', textAlign: 'center', lineHeight: 1.5 }}>{aiError}</p>}
          </>
        )}

        <div className="card-warning">
          <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
            ⚕️ Este relatório é educativo e não substitui avaliação médica individualizada.
          </p>
        </div>

        <button onClick={resetAll} className="btn-ghost" style={{ width: '100%' }}>
          Nova avaliação
        </button>
      </div>
    )
  }

  return null
}
