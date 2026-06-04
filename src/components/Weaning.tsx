import { useState } from 'react'
import { UserProfile } from '../types'

interface Props { profile: UserProfile }

// ─── Tipos ───────────────────────────────────────────────────────────
type Phase = 'intro' | 'q1' | 'blocked' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'result'

interface Answers {
  q2?: '<30' | '30-60' | '>60'
  q3?: 'very-controlled' | 'controlled' | 'moderate' | 'strong'
  q4?: 2.5 | 5 | 7.5 | 10 | 12.5 | 15
  q5?: 'yes' | 'partial' | 'no'
  q6?: 'yes' | 'no'
}

// ─── Pontuação ───────────────────────────────────────────────────────
function calcScore(a: Answers): number {
  let s = 0
  if (a.q2 === '>60')              s += 3
  else if (a.q2 === '30-60')       s += 2
  if (a.q3 === 'very-controlled')  s += 4
  else if (a.q3 === 'controlled')  s += 3
  else if (a.q3 === 'moderate')    s += 1
  else if (a.q3 === 'strong')      s -= 3
  if (a.q4 === 2.5)                s += 3
  else if (a.q4 === 5)             s += 2
  else if (a.q4 === 7.5)           s += 1
  if (a.q5 === 'yes')              s += 2
  else if (a.q5 === 'partial')     s += 1
  if (a.q6 === 'yes')              s += 2
  return s
}

// ─── Classificação ───────────────────────────────────────────────────
const LEVELS = [
  {
    emoji: '🔴', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    label: 'Baixa prontidão para desmame',
    message: 'Seu organismo pode ainda depender da medicação para manutenção dos resultados. Neste momento, pode ser interessante consolidar hábitos e evitar novas reduções sem orientação médica.',
  },
  {
    emoji: '🟡', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    label: 'Prontidão intermediária',
    message: 'Você já apresenta alguns sinais positivos. Considere permanecer mais tempo na etapa atual antes de avançar no processo de desmame.',
  },
  {
    emoji: '🟢', color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
    label: 'Boa prontidão para manutenção',
    message: 'Seu perfil sugere estabilidade. Converse com seu médico sobre estratégias graduais de manutenção e monitoramento.',
  },
  {
    emoji: '🔵', color: '#6366F1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',
    label: 'Possível candidato à retirada gradual',
    message: 'Você apresenta características frequentemente associadas a uma fase avançada de manutenção: peso estabilizado, fome controlada, hábitos alimentares consolidados e rotina de atividade física. Converse com seu médico sobre estratégias graduais de transição.',
    bullets: ['Peso estabilizado', 'Fome controlada', 'Hábitos alimentares consolidados', 'Rotina de atividade física'],
  },
]

function getLevel(score: number, answers: Answers): number {
  let lvl: number
  if (score <= 4)       lvl = 0
  else if (score <= 8)  lvl = 1
  else if (score <= 12) lvl = 2
  else                  lvl = 3
  // Regra 1: fome voltou forte → máximo intermediária
  if (answers.q3 === 'strong') lvl = Math.min(lvl, 1)
  return lvl
}

// ─── Componente de opção ─────────────────────────────────────────────
function Option({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none',
        background: selected
          ? 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)'
          : 'var(--surface-2)',
        color: selected ? '#fff' : 'var(--text-primary)',
        fontWeight: 700, fontSize: '14px', textAlign: 'left',
        cursor: 'pointer', transition: 'all 0.15s ease',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: selected ? 'var(--shadow-green)' : 'none',
        outline: selected ? 'none' : '1px solid var(--border)',
      }}
    >
      <span style={{ marginRight: '10px', fontSize: '16px' }}>
        {selected ? '✓' : '○'}
      </span>
      {label}
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────
export default function Weaning({ profile }: Props) {
  const [phase, setPhase]     = useState<Phase>('intro')
  const [answers, setAnswers] = useState<Answers>({
    q4: profile.currentDose as Answers['q4'],
  })

  const TOTAL_QUESTIONS = 6
  const phaseToNum: Record<Phase, number> = {
    intro: 0, q1: 1, blocked: 0, q2: 2, q3: 3, q4: 4, q5: 5, q6: 6, result: 6,
  }
  const progressPct = phase === 'result' ? 100 : (phaseToNum[phase] / TOTAL_QUESTIONS) * 100

  function answer<K extends keyof Answers>(key: K, val: Answers[K]) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }

  function restart() {
    setPhase('intro')
    setAnswers({ q4: profile.currentDose as Answers['q4'] })
  }

  const score = calcScore(answers)
  const level = getLevel(score, answers)
  const classif = LEVELS[level]

  // Regra 2: dose mínima + estabilidade > 60d + fome controlada
  const rule2 = answers.q4 === 2.5
    && answers.q2 === '>60'
    && (answers.q3 === 'controlled' || answers.q3 === 'very-controlled')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Assistente de Desmame
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>
          Avaliação de prontidão — exclusivamente educativa
        </p>
      </div>

      {/* Barra de progresso */}
      {phase !== 'intro' && phase !== 'blocked' && (
        <div className="progress-track" style={{ height: '5px' }}>
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {/* ── INTRO ───────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>🤔</p>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Meu organismo está pronto para depender menos da medicação?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Esta ferramenta analisa sinais clínicos e comportamentais para oferecer uma classificação educativa sobre sua prontidão para o desmame.
            </p>
          </div>

          <div className="card">
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Esta ferramenta NÃO recomenda:
            </p>
            {['Iniciar o desmame', 'Suspender a medicação', 'Aumentar a dose', 'Reduzir a dose'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', color: '#EF4444' }}>✕</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item}</span>
              </div>
            ))}
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginTop: '12px' }}>
              Fornece apenas uma classificação educativa baseada nas suas respostas.
            </p>
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setPhase('q1')}>
            Iniciar avaliação →
          </button>
        </div>
      )}

      {/* ── PERGUNTA 1 ───────────────────────────────────────────────── */}
      {phase === 'q1' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '10px', display: 'inline-flex' }}>
              Pergunta 1 de {TOTAL_QUESTIONS}
            </span>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Você atingiu seu peso objetivo?
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <Option label="Sim" selected={false} onClick={() => setPhase('q2')} />
            <Option label="Não" selected={false} onClick={() => setPhase('blocked')} />
          </div>
          <button className="btn-ghost" style={{ marginTop: '4px' }} onClick={() => setPhase('intro')}>
            ← Voltar
          </button>
        </div>
      )}

      {/* ── BLOQUEIO (respondeu NÃO na Q1) ─────────────────────────── */}
      {phase === 'blocked' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{
            background: 'rgba(245,158,11,0.07)', border: '1.5px solid rgba(245,158,11,0.25)',
            textAlign: 'center', padding: '2rem 1.5rem',
          }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</p>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.3 }}>
              Você ainda não atingiu seu peso objetivo.
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Neste momento, o foco principal continua sendo a consolidação dos resultados obtidos com o tratamento.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '10px' }}>
              Converse com seu médico antes de considerar estratégias de desmame.
            </p>
          </div>
          <div className="card-warning">
            <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
              ⚕️ Esta ferramenta possui finalidade exclusivamente educativa e informativa. Os resultados não substituem avaliação médica. Qualquer ajuste de dose deve ser realizado com acompanhamento profissional.
            </p>
          </div>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={restart}>
            Refazer avaliação
          </button>
        </div>
      )}

      {/* ── PERGUNTA 2 ───────────────────────────────────────────────── */}
      {phase === 'q2' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '10px', display: 'inline-flex' }}>
              Pergunta 2 de {TOTAL_QUESTIONS}
            </span>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Há quanto tempo seu peso permanece estável?
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {([
              { val: '<30',   label: 'Menos de 30 dias' },
              { val: '30-60', label: 'Entre 30 e 60 dias' },
              { val: '>60',   label: 'Mais de 60 dias' },
            ] as const).map(o => (
              <Option key={o.val} label={o.label} selected={answers.q2 === o.val}
                onClick={() => { answer('q2', o.val); setPhase('q3') }} />
            ))}
          </div>
          <button className="btn-ghost" style={{ marginTop: '4px' }} onClick={() => setPhase('q1')}>
            ← Voltar
          </button>
        </div>
      )}

      {/* ── PERGUNTA 3 ───────────────────────────────────────────────── */}
      {phase === 'q3' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '6px', display: 'inline-flex' }}>
              Pergunta 3 de {TOTAL_QUESTIONS}
            </span>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Como está sua fome atualmente?
            </p>
            <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginTop: '6px' }}>
              ★ Esta é uma das perguntas mais importantes
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {([
              { val: 'very-controlled', label: 'Muito controlada' },
              { val: 'controlled',      label: 'Controlada' },
              { val: 'moderate',        label: 'Moderadamente aumentada' },
              { val: 'strong',          label: 'Voltou forte' },
            ] as const).map(o => (
              <Option key={o.val} label={o.label} selected={answers.q3 === o.val}
                onClick={() => { answer('q3', o.val); setPhase('q4') }} />
            ))}
          </div>
          <button className="btn-ghost" style={{ marginTop: '4px' }} onClick={() => setPhase('q2')}>
            ← Voltar
          </button>
        </div>
      )}

      {/* ── PERGUNTA 4 ───────────────────────────────────────────────── */}
      {phase === 'q4' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '10px', display: 'inline-flex' }}>
              Pergunta 4 de {TOTAL_QUESTIONS}
            </span>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Qual sua dose atual?
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
            {([2.5, 5, 7.5, 10, 12.5, 15] as const).map(dose => (
              <button
                key={dose}
                onClick={() => { answer('q4', dose); setPhase('q5') }}
                style={{
                  padding: '14px 8px', borderRadius: '12px',
                  border: `2px solid ${answers.q4 === dose ? 'var(--primary)' : 'var(--border)'}`,
                  background: answers.q4 === dose
                    ? 'linear-gradient(135deg, var(--primary), #0D9488)'
                    : 'var(--surface-2)',
                  color: answers.q4 === dose ? '#fff' : 'var(--text-primary)',
                  fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: answers.q4 === dose ? 'var(--shadow-green)' : 'none',
                }}
              >
                {dose}mg
              </button>
            ))}
          </div>
          <button className="btn-ghost" style={{ marginTop: '4px' }} onClick={() => setPhase('q3')}>
            ← Voltar
          </button>
        </div>
      )}

      {/* ── PERGUNTA 5 ───────────────────────────────────────────────── */}
      {phase === 'q5' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '10px', display: 'inline-flex' }}>
              Pergunta 5 de {TOTAL_QUESTIONS}
            </span>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Você mantém uma rotina alimentar estruturada?
            </p>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Planejamento alimentar', 'Controle de porções', 'Proteínas adequadas', 'Rotina consistente'].map(ex => (
                <span key={ex} style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '99px',
                  background: 'var(--surface-2)', color: 'var(--text-muted)', fontWeight: 600,
                  border: '1px solid var(--border)',
                }}>{ex}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {([
              { val: 'yes',     label: 'Sim' },
              { val: 'partial', label: 'Parcialmente' },
              { val: 'no',      label: 'Não' },
            ] as const).map(o => (
              <Option key={o.val} label={o.label} selected={answers.q5 === o.val}
                onClick={() => { answer('q5', o.val); setPhase('q6') }} />
            ))}
          </div>
          <button className="btn-ghost" style={{ marginTop: '4px' }} onClick={() => setPhase('q4')}>
            ← Voltar
          </button>
        </div>
      )}

      {/* ── PERGUNTA 6 ───────────────────────────────────────────────── */}
      {phase === 'q6' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '10px', display: 'inline-flex' }}>
              Pergunta 6 de {TOTAL_QUESTIONS}
            </span>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Você pratica atividade física regularmente?
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <Option label="Sim" selected={answers.q6 === 'yes'}
              onClick={() => { answer('q6', 'yes'); setPhase('result') }} />
            <Option label="Não" selected={answers.q6 === 'no'}
              onClick={() => { answer('q6', 'no'); setPhase('result') }} />
          </div>
          <button className="btn-ghost" style={{ marginTop: '4px' }} onClick={() => setPhase('q5')}>
            ← Voltar
          </button>
        </div>
      )}

      {/* ── RESULTADO ───────────────────────────────────────────────── */}
      {phase === 'result' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Card de classificação */}
          <div className="card" style={{
            background: classif.bg, border: `1.5px solid ${classif.border}`,
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '40px' }}>{classif.emoji}</span>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  Sua classificação
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: classif.color, lineHeight: 1.2 }}>
                  {classif.label}
                </p>
              </div>
            </div>

            {classif.bullets ? (
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '10px' }}>
                  Você apresenta características frequentemente associadas a uma fase avançada de manutenção:
                </p>
                {classif.bullets.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ color: classif.color, fontWeight: 700, fontSize: '14px' }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{b}</span>
                  </div>
                ))}
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, marginTop: '10px' }}>
                  Converse com seu médico sobre estratégias graduais de transição.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {classif.message}
              </p>
            )}
          </div>

          {/* Pontuação */}
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Pontuação</p>
              <span className="badge" style={{ background: classif.bg, color: classif.color, border: `1px solid ${classif.border}` }}>
                {score} / 14 pontos
              </span>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <div style={{
                height: '100%', borderRadius: '99px',
                width: `${Math.max(0, (score / 14)) * 100}%`,
                background: `linear-gradient(90deg, ${classif.color}, ${classif.color}99)`,
                transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
          </div>

          {/* Regra 2 — dose mínima + estabilidade + fome controlada */}
          {rule2 && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
              border: '1.5px solid rgba(16,185,129,0.25)',
              padding: '1rem 1.25rem',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                ✨ Observação especial
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                Você já se encontra na menor dose disponível e apresenta sinais favoráveis de estabilidade.
              </p>
            </div>
          )}

          {/* Regra 3 — lembrete sempre visível */}
          <div style={{
            padding: '12px 14px', borderRadius: '12px', textAlign: 'center',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              ⏳ Não force velocidade no processo.
            </p>
          </div>

          {/* Aviso legal */}
          <div className="card-warning">
            <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.6 }}>
              ⚕️ Esta ferramenta possui finalidade exclusivamente educativa e informativa. Os resultados não substituem avaliação médica. Qualquer ajuste de dose deve ser realizado com acompanhamento profissional.
            </p>
          </div>

          <button className="btn-ghost" style={{ width: '100%' }} onClick={restart}>
            🔄 Refazer avaliação
          </button>
        </div>
      )}
    </div>
  )
}
