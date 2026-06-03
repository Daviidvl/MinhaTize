import { useState } from 'react'
import { UserProfile } from '../types'

interface Props {
  onComplete: (profile: UserProfile) => void
}

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]

const STEPS = [
  { id: 1, title: 'Bem-vindo ao TizeTrack', subtitle: 'Vamos configurar seu perfil em 4 passos rápidos.' },
  { id: 2, title: 'Seus dados', subtitle: 'Usaremos para calcular seu IMC e acompanhar sua evolução.' },
  { id: 3, title: 'Seu objetivo', subtitle: 'Defina sua meta de peso. Você pode alterar depois.' },
  { id: 4, title: 'Seu protocolo', subtitle: 'Qual dose você está usando atualmente?' },
]

export default function ProfileSetup({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    height: '',
    startWeight: '',
    goalWeight: '',
    currentDose: 2.5,
    startDate: new Date().toISOString().split('T')[0],
  })

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function canAdvance() {
    if (step === 1) return form.name.trim().length >= 2
    if (step === 2) return parseFloat(form.height) > 0 && parseFloat(form.startWeight) > 0
    if (step === 3) return parseFloat(form.goalWeight) > 0
    return true
  }

  function handleFinish() {
    const profile: UserProfile = {
      name: form.name.trim(),
      height: parseFloat(form.height),
      startWeight: parseFloat(form.startWeight),
      goalWeight: parseFloat(form.goalWeight),
      currentDose: form.currentDose,
      startDate: form.startDate,
      weightHistory: [],
    }
    onComplete(profile)
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        padding: '0',
      }}
    >
      {/* Barra de progresso no topo */}
      <div style={{ height: '4px', background: 'var(--surface-2)' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '440px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px 24px',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'var(--primary-light)', border: '1.5px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>
            📈
          </div>
          <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)' }}>TizeTrack</span>
        </div>

        {/* Indicador de passos */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
          {STEPS.map(s => (
            <div
              key={s.id}
              style={{
                flex: 1, height: '4px', borderRadius: '99px',
                background: s.id <= step ? 'var(--primary)' : 'var(--surface-2)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Conteúdo do passo */}
        <div style={{ flex: 1 }} className="fade-in" key={step}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Passo {step} de {STEPS.length}
          </p>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '8px' }}>
            {STEPS[step - 1].title}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.5 }}>
            {STEPS[step - 1].subtitle}
          </p>

          {/* PASSO 1 — Nome */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label-base">Como você quer ser chamado?</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Seu nome ou apelido"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoFocus
                  maxLength={40}
                />
              </div>
              <div style={{
                padding: '14px 16px',
                background: 'var(--primary-light)',
                borderRadius: '12px',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--primary-dark)', fontWeight: 600, lineHeight: 1.5 }}>
                  Seus dados ficam salvos apenas no seu dispositivo. Nenhuma informação é enviada a servidores.
                </p>
              </div>
            </div>
          )}

          {/* PASSO 2 — Altura e peso */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="label-base">Altura (cm)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ex: 168"
                  value={form.height}
                  onChange={e => set('height', e.target.value)}
                  min={100}
                  max={250}
                  autoFocus
                />
              </div>
              <div>
                <label className="label-base">Peso no início do protocolo (kg)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ex: 92.5"
                  value={form.startWeight}
                  onChange={e => set('startWeight', e.target.value)}
                  min={20}
                  max={300}
                  step={0.1}
                />
              </div>
              <div>
                <label className="label-base">Quando você começou?</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {/* PASSO 3 — Meta */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="label-base">Peso que você quer atingir (kg)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ex: 70"
                  value={form.goalWeight}
                  onChange={e => set('goalWeight', e.target.value)}
                  min={20}
                  max={300}
                  step={0.1}
                  autoFocus
                />
              </div>
              {form.startWeight && form.goalWeight && parseFloat(form.goalWeight) < parseFloat(form.startWeight) && (
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--primary-light)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  <p style={{ fontSize: '13px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                    Meta: perder {(parseFloat(form.startWeight) - parseFloat(form.goalWeight)).toFixed(1)}kg
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
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

          {/* PASSO 4 — Dose */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="label-base">Dose atual de Tirzepatida</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  {DOSES.map(dose => (
                    <button
                      key={dose}
                      onClick={() => set('currentDose', dose)}
                      style={{
                        padding: '14px 8px',
                        borderRadius: '10px',
                        border: `2px solid ${form.currentDose === dose ? 'var(--primary)' : 'var(--border)'}`,
                        background: form.currentDose === dose ? 'var(--primary-light)' : 'var(--surface)',
                        color: form.currentDose === dose ? 'var(--primary-dark)' : 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {dose}mg
                    </button>
                  ))}
                </div>
              </div>
              <div style={{
                padding: '14px 16px',
                background: 'var(--primary-light)',
                borderRadius: '12px',
                border: '1px solid rgba(16,185,129,0.2)',
                marginTop: '8px',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--primary-dark)', fontWeight: 600, lineHeight: 1.5 }}>
                  Você poderá atualizar sua dose a qualquer momento no seu perfil.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botões de navegação */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '32px' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                minHeight: '44px',
              }}
            >
              Voltar
            </button>
          )}
          <button
            className="btn-primary"
            style={{ flex: 1, opacity: canAdvance() ? 1 : 0.4, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}
            onClick={() => {
              if (!canAdvance()) return
              if (step < STEPS.length) setStep(s => s + 1)
              else handleFinish()
            }}
          >
            {step < STEPS.length ? 'Continuar →' : 'Entrar no TizeTrack 🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}
