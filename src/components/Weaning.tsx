import { useState } from 'react'
import { UserProfile } from '../types'

interface Props {
  profile: UserProfile
}

const DOSE_STEPS = [15, 12.5, 10, 7.5, 5, 2.5]

const WEANING_STEPS = [
  {
    phase: 'Preparação',
    duration: '2 semanas antes',
    icon: '🧠',
    color: '#6366F1',
    actions: [
      'Converse com seu médico sobre o plano de desmame',
      'Registre seu peso atual como referência',
      'Prepare-se psicologicamente para o retorno gradual do apetite',
      'Reforce hábitos alimentares saudáveis antes de iniciar',
    ],
  },
  {
    phase: 'Redução inicial',
    duration: '4 semanas',
    icon: '📉',
    color: '#10B981',
    actions: [
      'Reduza uma etapa de dose por vez (ex: 10mg → 7.5mg)',
      'Mantenha a frequência semanal de aplicação',
      'Monitore o retorno do apetite — é esperado e normal',
      'Continue registrando o peso semanalmente',
    ],
  },
  {
    phase: 'Dose mínima',
    duration: '4 semanas',
    icon: '⚖️',
    color: '#F59E0B',
    actions: [
      'Use 2.5mg por pelo menos 4 semanas antes de parar',
      'Observe se há ganho de peso acelerado',
      'Intensifique a atividade física nesta fase',
      'Mantenha o diário alimentar ativo',
    ],
  },
  {
    phase: 'Suspensão',
    duration: 'Semana final',
    icon: '🏁',
    color: '#EC4899',
    actions: [
      'Aplique a última dose com o suporte do seu médico',
      'Agende consulta de acompanhamento em 30 dias',
      'Mantenha os hábitos construídos durante o protocolo',
      'Pesagem semanal continua sendo importante',
    ],
  },
  {
    phase: 'Pós-desmame',
    duration: 'Meses seguintes',
    icon: '🌱',
    color: '#10B981',
    actions: [
      'Peso pode subir levemente — até 3-5kg é considerado normal',
      'Alimentação equilibrada é fundamental para manter o resultado',
      'Exercício físico regular é o principal aliado',
      'Retorne ao médico se ganho de peso for significativo',
    ],
  },
]

const MONITOR_ITEMS = [
  { icon: '📈', text: 'Peso semanalmente — alertas se ganho > 2kg em 2 semanas' },
  { icon: '🍽️', text: 'Retorno do apetite — intensidade e fissuras alimentares' },
  { icon: '😴', text: 'Qualidade do sono e níveis de energia' },
  { icon: '🩺', text: 'Glicemia se diabético ou pré-diabético' },
  { icon: '💪', text: 'Manutenção de massa muscular com exercício' },
]

export default function Weaning({ profile }: Props) {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const currentDoseIndex = DOSE_STEPS.indexOf(profile.currentDose)
  const stepsToWeaning = currentDoseIndex >= 0 ? currentDoseIndex : DOSE_STEPS.length - 1
  const weeksEstimate = stepsToWeaning * 4 + 8

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Protocolo de Desmame
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>
          Parar a Tirzepatida abruptamente pode causar rebote de peso. O desmame gradual protege os resultados conquistados.
        </p>
      </div>

      {/* Card de estimativa personalizada */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.06))',
        border: '1.5px solid rgba(99,102,241,0.2)',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Sua estimativa
        </p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          Dose atual: <span style={{ color: 'var(--primary)' }}>{profile.currentDose}mg</span>
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
          Reduzindo uma etapa por mês, seu processo de desmame levaria aproximadamente{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{weeksEstimate} semanas</strong>.
          {stepsToWeaning === 0 && ' Você já está na dose mínima — pode iniciar o protocolo de suspensão.'}
        </p>

        {/* Timeline de doses */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '14px', flexWrap: 'wrap' }}>
          {DOSE_STEPS.map((dose, i) => {
            const isCurrent = dose === profile.currentDose
            const isPast = i < currentDoseIndex
            return (
              <div key={dose} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                  background: isCurrent ? 'var(--primary)' : isPast ? 'var(--primary-light)' : 'var(--surface-2)',
                  color: isCurrent ? '#fff' : isPast ? 'var(--primary-dark)' : 'var(--text-muted)',
                  border: `1.5px solid ${isCurrent ? 'var(--primary)' : isPast ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                }}>
                  {dose}mg
                </div>
                {i < DOSE_STEPS.length - 1 && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>→</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Fases do desmame */}
      <div>
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Fases do processo
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {WEANING_STEPS.map((step, i) => (
            <div key={step.phase} style={{
              borderRadius: '14px',
              border: `1.5px solid ${activeStep === i ? step.color + '40' : 'var(--border)'}`,
              background: activeStep === i ? step.color + '08' : 'var(--surface)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--card-shadow)',
            }}>
              <button
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{
                  width: '100%', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: step.color + '15', border: `1px solid ${step.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{step.phase}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{step.duration}</p>
                </div>
                <span style={{
                  fontSize: '11px', color: 'var(--text-muted)',
                  transform: activeStep === i ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}>▼</span>
              </button>

              {activeStep === i && (
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {step.actions.map((action, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                        background: step.color + '15', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', marginTop: '1px',
                      }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: step.color }}>{j + 1}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>
                        {action}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* O que monitorar */}
      <div className="card">
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>
          🔍 O que monitorar durante o desmame
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MONITOR_ITEMS.map(item => (
            <div key={item.text} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '9px 10px', borderRadius: '10px', background: 'var(--surface-2)',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-warning">
        <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
          ⚕️ O desmame deve sempre ser orientado pelo médico que prescreveu o tratamento. Este guia é educativo e não substitui acompanhamento profissional.
        </p>
      </div>
    </div>
  )
}
