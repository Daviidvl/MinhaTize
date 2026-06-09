import { useState } from 'react'
import { Pill, Syringe, TrendingUp, Lock, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Medication, Sex, UserProfile, WEEK_DAYS_FULL } from '../types'

interface Props {
  onComplete: (profile: UserProfile) => void
}

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]

const MEDICATIONS: { value: Medication; label: string; icon: React.ReactNode }[] = [
  { value: 'tirzepatida', label: 'Tirzepatida',  icon: <Pill size={18} strokeWidth={2} /> },
  { value: 'semaglutida', label: 'Semaglutida',  icon: <Syringe size={18} strokeWidth={2} /> },
  { value: 'ozempic',     label: 'Ozempic',      icon: <Syringe size={18} strokeWidth={2} /> },
  { value: 'wegovy',      label: 'Wegovy',       icon: <Syringe size={18} strokeWidth={2} /> },
  { value: 'mounjaro',    label: 'Mounjaro',     icon: <Pill size={18} strokeWidth={2} /> },
]

const STEPS = [
  { id: 1, title: 'Bem-vindo ao TizeTrack',  subtitle: 'Vamos configurar seu perfil em 5 passos rápidos.' },
  { id: 2, title: 'Dados corporais',          subtitle: 'Para calcular IMC e acompanhar sua evolução.' },
  { id: 3, title: 'Sua meta',                 subtitle: 'Defina onde você quer chegar. Pode alterar depois.' },
  { id: 4, title: 'Seu medicamento',          subtitle: 'Qual GLP-1 você está usando atualmente?' },
  { id: 5, title: 'Dia da aplicação',         subtitle: 'Qual dia da semana você aplica sua dose?' },
]

export default function ProfileSetup({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    age: '',
    sex: '' as Sex | '',
    medication: 'tirzepatida' as Medication,
    height: '',
    startWeight: '',
    currentWeight: '',
    goalWeight: '',
    currentDose: 2.5,
    startDate: new Date().toISOString().split('T')[0],
    applicationDay: new Date().getDay(),
  })

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function canAdvance() {
    if (step === 1) return form.name.trim().length >= 2
    if (step === 2) return parseFloat(form.height) > 0 && parseFloat(form.startWeight) > 0
    if (step === 3) return parseFloat(form.goalWeight) > 0 && parseFloat(form.goalWeight) < parseFloat(form.startWeight)
    if (step === 4) return true
    return true
  }

  function handleFinish() {
    const profile: UserProfile = {
      name: form.name.trim(),
      age: form.age ? parseInt(form.age) : undefined,
      sex: form.sex || undefined,
      medication: form.medication,
      height: parseFloat(form.height),
      startWeight: parseFloat(form.startWeight),
      currentWeight: form.currentWeight ? parseFloat(form.currentWeight) : undefined,
      goalWeight: parseFloat(form.goalWeight),
      currentDose: form.currentDose,
      startDate: form.startDate,
      applicationDay: form.applicationDay,
      weightHistory: form.currentWeight ? [{ date: new Date().toISOString().split('T')[0], weight: parseFloat(form.currentWeight) }] : [],
      diary: [],
      sideEffects: [],
    }
    onComplete(profile)
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  // helpers de estilo
  const selBtn = (active: boolean, color = 'var(--primary)') => ({
    padding: '12px 8px', borderRadius: '11px', border: 'none', cursor: 'pointer',
    background: active ? `linear-gradient(135deg, ${color}, #0D9488)` : 'var(--surface-2)',
    color: active ? '#fff' : 'var(--text-primary)',
    fontWeight: 700, fontSize: '13px', transition: 'all 0.15s',
    fontFamily: 'Inter, -apple-system, sans-serif',
    boxShadow: active ? 'var(--shadow-green)' : 'none',
    outline: active ? 'none' : '1px solid var(--border)',
  })

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--surface-2)' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: '440px', width: '100%', margin: '0 auto',
        padding: '28px 20px 24px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
            background: 'var(--primary-light)',
            border: '1px solid rgba(37,99,235,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
          }}><TrendingUp size={17} strokeWidth={2} /></div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>TizeTrack</span>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '28px' }}>
          {STEPS.map(s => (
            <div key={s.id} style={{
              flex: 1, height: '3px', borderRadius: '99px',
              background: s.id <= step ? 'var(--primary)' : 'var(--surface-2)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step content */}
        <div style={{ flex: 1 }} className="fade-in" key={step}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Passo {step} de {STEPS.length}
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '6px' }}>
            {STEPS[step - 1].title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.5 }}>
            {STEPS[step - 1].subtitle}
          </p>

          {/* ── PASSO 1: Nome + Sexo + Idade ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-base">Como você quer ser chamado?</label>
                <input type="text" className="input-field" placeholder="Seu nome ou apelido"
                  value={form.name} onChange={e => set('name', e.target.value)} autoFocus maxLength={40} />
              </div>

              <div>
                <label className="label-base">Sexo (opcional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {(['Feminino', 'Masculino', 'Outro'] as const).map((l, i) => {
                    const v = (['female', 'male', 'other'] as const)[i]
                    return (
                      <button key={v} style={selBtn(form.sex === v)} onClick={() => set('sex', v)}>
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label-base">Idade (opcional)</label>
                <input type="number" className="input-field" placeholder="Ex: 35"
                  value={form.age} onChange={e => set('age', e.target.value)} min={10} max={120} />
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--primary-light)', borderRadius: '11px', border: '1px solid rgba(37,99,235,0.15)' }}>
                <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                  Seus dados ficam salvos apenas neste dispositivo.
                </p>
              </div>
            </div>
          )}

          {/* ── PASSO 2: Dados corporais ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-base">Altura (cm)</label>
                  <input type="number" className="input-field" placeholder="Ex: 168"
                    value={form.height} onChange={e => set('height', e.target.value)} min={100} max={250} autoFocus />
                </div>
                <div>
                  <label className="label-base">Peso inicial (kg)</label>
                  <input type="number" className="input-field" placeholder="Ex: 92"
                    value={form.startWeight} onChange={e => set('startWeight', e.target.value)} min={20} max={300} step={0.1} />
                </div>
              </div>
              <div>
                <label className="label-base">Peso atual (kg) <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— se diferente do inicial</span></label>
                <input type="number" className="input-field" placeholder="Ex: 88.5"
                  value={form.currentWeight} onChange={e => set('currentWeight', e.target.value)} min={20} max={300} step={0.1} />
              </div>
              <div>
                <label className="label-base">Início do protocolo</label>
                <input type="date" className="input-field"
                  value={form.startDate} onChange={e => set('startDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          )}

          {/* ── PASSO 3: Meta ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label-base">Peso que você quer atingir (kg)</label>
                <input type="number" className="input-field" placeholder="Ex: 70"
                  value={form.goalWeight} onChange={e => set('goalWeight', e.target.value)}
                  min={20} max={300} step={0.1} autoFocus />
              </div>
              {form.startWeight && form.goalWeight && parseFloat(form.goalWeight) < parseFloat(form.startWeight) && (
                <div style={{ padding: '14px', background: 'var(--primary-light)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>
                    Meta: perder {(parseFloat(form.startWeight) - parseFloat(form.goalWeight)).toFixed(1)}kg
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Você está no caminho certo. Vamos juntos!
                  </p>
                </div>
              )}
              {form.goalWeight && form.startWeight && parseFloat(form.goalWeight) >= parseFloat(form.startWeight) && (
                <div className="card-warning">
                  <p style={{ fontSize: '13px', color: 'var(--warn-text)', fontWeight: 600 }}>
                    A meta deve ser menor que o peso inicial.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 4: Medicamento + Dose ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-base">Medicamento</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {MEDICATIONS.map(m => (
                    <button key={m.value} onClick={() => set('medication', m.value)}
                      style={{
                        ...selBtn(form.medication === m.value),
                        textAlign: 'left', padding: '12px 14px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}>
                      <span style={{ display: 'flex', flexShrink: 0 }}>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-base">Dose atual</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
                  {DOSES.map(d => (
                    <button key={d} style={selBtn(form.currentDose === d)} onClick={() => set('currentDose', d)}>
                      {d}mg
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 5: Dia da aplicação ── */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label-base">Dia da semana</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '7px' }}>
                  {WEEK_DAYS_FULL.map((day, i) => (
                    <button key={i} style={{ ...selBtn(form.applicationDay === i), textAlign: 'left', padding: '12px 14px' }}
                      onClick={() => set('applicationDay', i)}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              {form.applicationDay !== undefined && (
                <div style={{ padding: '12px 14px', background: 'var(--primary-light)', borderRadius: '11px', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    Você aplica toda {WEEK_DAYS_FULL[form.applicationDay]}. O TizeTrack vai acompanhar isso pra você.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
          {step > 1 && (
            <button className="btn-ghost" onClick={() => setStep(s => s - 1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ChevronLeft size={15} strokeWidth={2} />Voltar
            </button>
          )}
          <button
            className="btn-primary"
            style={{ flex: 1, opacity: canAdvance() ? 1 : 0.4, cursor: canAdvance() ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => {
              if (!canAdvance()) return
              if (step < STEPS.length) setStep(s => s + 1)
              else handleFinish()
            }}
          >
            {step < STEPS.length
              ? <><span>Continuar</span><ChevronRight size={15} strokeWidth={2} /></>
              : 'Entrar no TizeTrack'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
