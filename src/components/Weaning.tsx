import { useState } from 'react'
import { AlertTriangle, RotateCcw, Info, ChevronLeft, Scale, Flame, Zap, Utensils, Dumbbell } from 'lucide-react'
import { UserProfile } from '../types'
import {
  type Step, type Answers,
  STEP_ORDER, NONE_SYMPTOM, SEVERE_SYMPTOMS, classify, TAPER_DOSES, PROFILE_CONFIG,
} from '../utils/weaningUtils'

interface Props { profile: UserProfile }

// ── Option (single select) ────────────────────────────────────────────────────
function Option({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 16px', borderRadius: '14px',
        border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        background: selected ? 'var(--primary-light)' : 'var(--surface)',
        color: 'var(--text-primary)',
        fontWeight: selected ? 700 : 500, fontSize: '14px', textAlign: 'left',
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'Inter, -apple-system, sans-serif',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? 'var(--primary)' : 'transparent',
      }}>
        {selected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
      </span>
      {label}
    </button>
  )
}

// ── Option (multi select) ─────────────────────────────────────────────────────
function MultiOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 16px', borderRadius: '14px',
        border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        background: selected ? 'var(--primary-light)' : 'var(--surface)',
        color: 'var(--text-primary)',
        fontWeight: selected ? 700 : 500, fontSize: '14px', textAlign: 'left',
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'Inter, -apple-system, sans-serif',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      <span style={{
        width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        background: selected ? 'var(--primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Weaning({ profile }: Props) {
  const defaultDose = profile.currentDose.toString()

  const [step, setStep]       = useState<Step>('intro')
  const [answers, setAnswers] = useState<Answers>({
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: [], q8: defaultDose,
  })

  const stepNum  = STEP_ORDER.indexOf(step as Step) + 1
  const progress = step === 'result' ? 100 : step === 'intro' ? 0 : (stepNum / 8) * 100

  function go(next: Step) { setStep(next) }
  function back() {
    const order: Step[] = ['intro', '1', '2', '3', '4', '5', '6', '7', '8', 'result']
    const idx = order.indexOf(step)
    if (idx > 0) setStep(order[idx - 1])
  }

  function setQ(key: keyof Omit<Answers, 'q7'>, val: string, next: Step) {
    setAnswers(prev => ({ ...prev, [key]: val }))
    setStep(next)
  }

  function toggleQ7(symptom: string) {
    setAnswers(prev => {
      if (symptom === NONE_SYMPTOM) return { ...prev, q7: [NONE_SYMPTOM] }
      const without = prev.q7.filter(s => s !== NONE_SYMPTOM)
      const already = without.includes(symptom)
      return { ...prev, q7: already ? without.filter(s => s !== symptom) : [...without, symptom] }
    })
  }

  function finish() {
    setStep('result')
  }

  function restart() {
    setStep('intro')
    setAnswers({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: [], q8: defaultDose })
  }

  const profile_type = classify(answers)
  const cfg          = PROFILE_CONFIG[profile_type]
  const taperPlan    = TAPER_DOSES[answers.q8] ?? []

  const qBadge = (n: number) => (
    <p style={{
      fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px',
      fontFamily: 'Inter, sans-serif',
    }}>
      Pergunta {n} de 8
    </p>
  )

  const backBtn = (
    <button
      onClick={back}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif',
        fontSize: '13px', fontWeight: 600, marginTop: '4px',
      }}
    >
      <ChevronLeft size={14} strokeWidth={2.5} /> Voltar
    </button>
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Progress bar */}
      {step !== 'intro' && (
        <div style={{ background: 'var(--border)', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '99px', background: 'var(--primary)',
            width: `${progress}%`, transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      )}

      {/* ── INTRO ─────────────────────────────────────────────────────────── */}
      {step === 'intro' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <p style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Ferramenta educativa
            </p>
            <h3 style={{
              fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)',
              margin: '0 0 10px', lineHeight: 1.3, fontFamily: 'Inter, sans-serif',
            }}>
              Assistente Inteligente de Desmame da Tirzepatida
            </h3>
            <p style={{
              fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0,
              fontFamily: 'Inter, sans-serif',
            }}>
              Esta ferramenta analisa seu momento atual e oferece uma orientação educativa sobre o desmame.
              Não substitui o acompanhamento médico.
            </p>
          </div>

          <div style={{
            padding: '14px 16px', borderRadius: '14px',
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <Info size={14} strokeWidth={2} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Qualquer ajuste de dose deve ser realizado com orientação do médico responsável.
            </p>
          </div>

          <button
            onClick={() => go('1')}
            style={{
              padding: '15px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
              color: '#fff', fontWeight: 700, fontSize: '15px',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            }}
          >
            Iniciar avaliação →
          </button>
        </div>
      )}

      {/* ── Q1 ────────────────────────────────────────────────────────────── */}
      {step === '1' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(1)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Você atingiu o peso que considera como objetivo?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <Option label="Sim"       selected={answers.q1 === 'Sim'}       onClick={() => setQ('q1', 'Sim',       '2')} />
            <Option label="Ainda não" selected={answers.q1 === 'Ainda não'} onClick={() => setQ('q1', 'Ainda não', '2')} />
          </div>
          {backBtn}
        </div>
      )}

      {/* ── Q2 ────────────────────────────────────────────────────────────── */}
      {step === '2' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(2)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Há quanto tempo seu peso permanece estável?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {['Menos de 1 mês', 'Entre 1 e 2 meses', 'Entre 2 e 3 meses', 'Mais de 3 meses'].map(opt => (
              <Option key={opt} label={opt} selected={answers.q2 === opt} onClick={() => setQ('q2', opt, '3')} />
            ))}
          </div>
          {backBtn}
        </div>
      )}

      {/* ── Q3 ────────────────────────────────────────────────────────────── */}
      {step === '3' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(3)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Como está sua fome atualmente?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {['Muito controlada', 'Moderadamente controlada', 'Voltando com frequência', 'Fome intensa'].map(opt => (
              <Option key={opt} label={opt} selected={answers.q3 === opt} onClick={() => setQ('q3', opt, '4')} />
            ))}
          </div>
          {backBtn}
        </div>
      )}

      {/* ── Q4 ────────────────────────────────────────────────────────────── */}
      {step === '4' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(4)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Como está sua rotina alimentar?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {['Bem estruturada', 'Razoável', 'Desorganizada'].map(opt => (
              <Option key={opt} label={opt} selected={answers.q4 === opt} onClick={() => setQ('q4', opt, '5')} />
            ))}
          </div>
          {backBtn}
        </div>
      )}

      {/* ── Q5 ────────────────────────────────────────────────────────────── */}
      {step === '5' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(5)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Você pratica atividade física regularmente?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {['Sim, 3 ou mais vezes por semana', 'Eventualmente', 'Não'].map(opt => (
              <Option key={opt} label={opt} selected={answers.q5 === opt} onClick={() => setQ('q5', opt, '6')} />
            ))}
          </div>
          {backBtn}
        </div>
      )}

      {/* ── Q6 ────────────────────────────────────────────────────────────── */}
      {step === '6' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(6)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Como está sua perda de peso atualmente?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {['Peso estabilizado', 'Ainda estou perdendo peso', 'Estou recuperando peso'].map(opt => (
              <Option key={opt} label={opt} selected={answers.q6 === opt} onClick={() => setQ('q6', opt, '7')} />
            ))}
          </div>
          {backBtn}
        </div>
      )}

      {/* ── Q7 (multi-select) ─────────────────────────────────────────────── */}
      {step === '7' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(7)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Você apresenta algum destes sintomas?
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0', fontFamily: 'Inter, sans-serif' }}>
            Pode selecionar mais de uma opção.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {[...SEVERE_SYMPTOMS, NONE_SYMPTOM].map(opt => (
              <MultiOption
                key={opt}
                label={opt}
                selected={answers.q7.includes(opt)}
                onClick={() => toggleQ7(opt)}
              />
            ))}
          </div>
          <button
            onClick={() => { if (answers.q7.length > 0) go('8') }}
            disabled={answers.q7.length === 0}
            style={{
              padding: '14px', borderRadius: '14px', border: 'none',
              background: answers.q7.length > 0 ? 'var(--primary)' : 'var(--surface-2)',
              color: answers.q7.length > 0 ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '14px', cursor: answers.q7.length > 0 ? 'pointer' : 'default',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', marginTop: '4px',
            }}
          >
            Próximo →
          </button>
          {backBtn}
        </div>
      )}

      {/* ── Q8 ────────────────────────────────────────────────────────────── */}
      {step === '8' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {qBadge(8)}
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Qual a sua dose atual?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
            {(['2.5', '5', '7.5', '10', '12.5', '15'] as const).map(dose => (
              <button
                key={dose}
                onClick={() => { setAnswers(prev => ({ ...prev, q8: dose })); finish() }}
                style={{
                  padding: '16px 8px', borderRadius: '14px',
                  border: `2px solid ${answers.q8 === dose ? 'var(--primary)' : 'var(--border)'}`,
                  background: answers.q8 === dose ? 'var(--primary-light)' : 'var(--surface)',
                  color: answers.q8 === dose ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                }}
              >
                {dose.replace('.', ',')} mg
              </button>
            ))}
          </div>
          {backBtn}
        </div>
      )}

      {/* ── RESULT ────────────────────────────────────────────────────────── */}
      {step === 'result' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Profile badge */}
          <div style={{
            padding: '20px', borderRadius: '18px',
            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%',
                background: cfg.dot, flexShrink: 0,
                boxShadow: `0 0 0 4px ${cfg.bg}, 0 0 0 6px ${cfg.border}`,
              }} />
              <p style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
                fontFamily: 'Inter, sans-serif',
              }}>
                Seu perfil
              </p>
            </div>
            <h3 style={{
              fontSize: '17px', fontWeight: 800, color: cfg.dot,
              margin: '0 0 12px', lineHeight: 1.3, fontFamily: 'Inter, sans-serif',
            }}>
              {cfg.label}
            </h3>
            {cfg.message.split('\n\n').map((para, i) => (
              <p key={i} style={{
                fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65,
                margin: i < cfg.message.split('\n\n').length - 1 ? '0 0 10px' : 0,
                fontFamily: 'Inter, sans-serif',
              }}>
                {para}
              </p>
            ))}
          </div>

          {/* ── Etapa 3: Tapering plan (green only) ─────────────────────── */}
          {profile_type === 'green' && taperPlan.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <p style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px',
                fontFamily: 'Inter, sans-serif',
              }}>
                Estratégia educacional
              </p>
              <h4 style={{
                fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)',
                margin: '0 0 6px', fontFamily: 'Inter, sans-serif',
              }}>
                Estratégia mais frequentemente utilizada
              </h4>
              <p style={{
                fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6,
                margin: '0 0 18px', fontFamily: 'Inter, sans-serif',
              }}>
                Não existe um protocolo universal para o desmame da Tirzepatida. Uma das abordagens mais utilizadas na prática clínica consiste em reduzir gradualmente a dose e, posteriormente, aumentar progressivamente o intervalo entre as aplicações.
              </p>

              {/* Vertical timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                {taperPlan.map((doseLabel, idx) => {
                  const isFirst = idx === 0
                  const isLast  = idx === taperPlan.length - 1
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      {/* Dose pill */}
                      <div style={{
                        padding: isFirst ? '10px 24px' : '9px 20px',
                        borderRadius: '99px',
                        background: isFirst
                          ? 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)'
                          : 'var(--surface-2)',
                        border: isFirst ? 'none' : '1.5px solid var(--border)',
                        boxShadow: isFirst ? '0 4px 12px rgba(37,99,235,0.28)' : 'none',
                        color: isFirst ? '#fff' : 'var(--text-primary)',
                        fontWeight: isFirst ? 800 : 700,
                        fontSize: isFirst ? '15px' : '14px',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.2px',
                        width: 'fit-content',
                        maxWidth: '80%',
                        textAlign: 'center',
                      }}>
                        {isFirst && <span style={{ fontSize: '10px', opacity: 0.75, marginRight: '6px', fontWeight: 600 }}>INÍCIO</span>}
                        {doseLabel}
                      </div>

                      {/* Connector (not after last dose) */}
                      {!isLast && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
                          <div style={{ width: '1.5px', height: '10px', background: 'var(--border)' }} />
                          <div style={{
                            padding: '3px 12px', borderRadius: '99px',
                            background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)',
                            fontSize: '10px', fontWeight: 700, color: 'var(--primary)',
                            fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em',
                          }}>
                            2–4 semanas
                          </div>
                          <div style={{ width: '1.5px', height: '10px', background: 'var(--border)' }} />
                          <div style={{
                            width: 0, height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '7px solid var(--border)',
                          }} />
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Final: Reavaliar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
                    <div style={{ width: '1.5px', height: '10px', background: 'var(--border)' }} />
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '7px solid var(--border)',
                    }} />
                  </div>
                  <div style={{
                    padding: '10px 20px', borderRadius: '99px',
                    background: 'rgba(5,150,105,0.1)', border: '1.5px solid rgba(5,150,105,0.3)',
                    color: '#059669', fontWeight: 800, fontSize: '13px',
                    fontFamily: 'Inter, sans-serif', textAlign: 'center',
                  }}>
                    Reavaliar com o médico
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Etapa 4: Monitorização (green only) ─────────────────────── */}
          {profile_type === 'green' && (
            <>
              <div className="card" style={{ padding: '18px 20px' }}>
                <p style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Monitorização
                </p>
                <p style={{
                  fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6,
                  margin: '0 0 14px', fontFamily: 'Inter, sans-serif',
                }}>
                  Durante o desmame, pode ser interessante acompanhar:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: <Scale size={15} strokeWidth={2} />, label: 'Peso', sub: 'Acompanhe semanalmente' },
                    { icon: <Flame size={15} strokeWidth={2} />, label: 'Fome', sub: 'Observe variações ao longo do dia' },
                    { icon: <Zap size={15} strokeWidth={2} />, label: 'Energia', sub: 'Note mudanças na disposição' },
                    { icon: <Utensils size={15} strokeWidth={2} />, label: 'Alimentação', sub: 'Mantenha a rotina estruturada' },
                    { icon: <Dumbbell size={15} strokeWidth={2} />, label: 'Exercícios', sub: 'Continue a atividade física regular' },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '12px',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: 'var(--primary-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                      }}>
                        {item.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '1px', fontFamily: 'Inter, sans-serif' }}>
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert signs */}
              <div style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(245,158,11,0.07)', border: '1.5px solid rgba(245,158,11,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <AlertTriangle size={15} strokeWidth={2} color="#D97706" style={{ flexShrink: 0 }} />
                  <p style={{
                    fontSize: '12px', fontWeight: 800, color: '#D97706',
                    textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Sinais de atenção
                  </p>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                  Se durante o desmame ocorrer:
                </p>
                <ul style={{ margin: '0 0 10px', paddingLeft: '16px' }}>
                  {['Retorno importante da fome', 'Episódios de compulsão alimentar', 'Ganho progressivo de peso'].map(s => (
                    <li key={s} style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                      {s}
                    </li>
                  ))}
                </ul>
                <p style={{
                  fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                  lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif',
                  fontStyle: 'italic',
                }}>
                  "Pode ser interessante permanecer mais tempo na etapa atual ou discutir os próximos passos com o médico."
                </p>
              </div>
            </>
          )}

          {/* Disclaimer */}
          <div style={{
            padding: '12px 14px', borderRadius: '12px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            display: 'flex', gap: '8px', alignItems: 'flex-start',
          }}>
            <Info size={13} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Esta ferramenta possui finalidade exclusivamente educativa e não substitui avaliação médica. Qualquer ajuste de dose deve ser realizado com acompanhamento profissional.
            </p>
          </div>

          {/* Restart */}
          <button
            onClick={restart}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '13px', borderRadius: '14px', border: '1.5px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text-muted)',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <RotateCcw size={14} strokeWidth={2} /> Refazer avaliação
          </button>
        </div>
      )}

    </div>
  )
}
