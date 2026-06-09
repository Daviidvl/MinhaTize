import { useState } from 'react'
import {
  Home, TrendingUp, Activity, Utensils, Dumbbell,
  Calculator, ChevronLeft, ChevronRight, Check, X,
} from 'lucide-react'

export const TOUR_KEY = 'tizetrack_tour_done'

interface Step {
  icon: React.ReactNode
  color: string
  gradient: string
  title: string
  description: string
  tip?: string
}

const STEPS: Step[] = [
  {
    icon: <Home size={34} strokeWidth={1.5} />,
    color: '#2563EB',
    gradient: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
    title: 'Dashboard',
    description: 'Sua central de controle. Veja o peso atual, progresso em relação à meta, status da próxima aplicação e alertas de estoque — tudo em um só lugar.',
    tip: 'Toque no peso para ir direto ao gráfico de evolução.',
  },
  {
    icon: <Activity size={34} strokeWidth={1.5} />,
    color: '#0891B2',
    gradient: 'linear-gradient(135deg, #0E7490 0%, #0891B2 100%)',
    title: 'Aplicações',
    description: 'Registre cada aplicação semanal no calendário. O TizeTrack acompanha automaticamente os dias e calcula quando será a próxima dose.',
    tip: 'Toque no dia de hoje quando aplicar para registrar.',
  },
  {
    icon: <TrendingUp size={34} strokeWidth={1.5} />,
    color: '#059669',
    gradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    title: 'Progresso',
    description: 'Registre seu peso semanalmente e acompanhe a curva de evolução. Visualize IMC, total perdido e quanto falta para atingir a meta.',
    tip: 'Registre toda semana no mesmo horário para maior precisão.',
  },
  {
    icon: <Activity size={34} strokeWidth={1.5} />,
    color: '#1E4D6B',
    gradient: 'linear-gradient(135deg, #1E4D6B 0%, #0F3347 100%)',
    title: 'Sintomas',
    description: 'Registre efeitos colaterais semanais como náusea, constipação e refluxo. O app gera dicas personalizadas para cada sintoma que você reportar.',
    tip: 'Na aba Saúde → Sintomas.',
  },
  {
    icon: <Utensils size={34} strokeWidth={1.5} />,
    color: '#16653A',
    gradient: 'linear-gradient(135deg, #16653A 0%, #0E4A29 100%)',
    title: 'Alimentação',
    description: 'Plano alimentar de 30 dias personalizado por sexo, elaborado por nutricionista especialmente para quem usa GLP-1. Inclui cardápio e módulo para semanas de pouca fome.',
    tip: 'Na aba Saúde → Alimentação.',
  },
  {
    icon: <Dumbbell size={34} strokeWidth={1.5} />,
    color: '#1D4ED8',
    gradient: 'linear-gradient(135deg, #1D4ED8 0%, #1338A6 100%)',
    title: 'Exercícios',
    description: 'Treino personalizado por sexo, nível de experiência e local — academia ou em casa. Adaptado às necessidades de quem está em protocolo GLP-1.',
    tip: 'Na aba Saúde → Exercícios.',
  },
  {
    icon: <Calculator size={34} strokeWidth={1.5} />,
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
    title: 'Calculadora & Lab',
    description: 'Calcule doses e diluições com precisão. Acompanhe seus exames laboratoriais ao longo do tratamento e veja a evolução dos resultados.',
    tip: 'Nas abas Calcular e Lab.',
  },
]

interface Props {
  onDone: () => void
}

export default function OnboardingTour({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const cur    = STEPS[step]
  const isLast = step === STEPS.length - 1

  function finish() {
    localStorage.setItem(TOUR_KEY, '1')
    onDone()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) finish() }}
    >
      <div
        className="fade-in"
        style={{
          background: 'var(--surface)',
          borderRadius: '28px',
          padding: '28px 24px 24px',
          maxWidth: '400px', width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={finish}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '32px', height: '32px', borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', transition: 'all 0.15s',
          }}
          aria-label="Fechar"
        >
          <X size={13} strokeWidth={2.5} />
        </button>

        {/* Icon */}
        <div style={{
          width: '76px', height: '76px', borderRadius: '24px',
          background: cur.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', marginBottom: '22px',
          boxShadow: `0 10px 28px ${cur.color}40`,
        }}>
          {cur.icon}
        </div>

        {/* Counter */}
        <p style={{
          fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px',
        }}>
          {step + 1} / {STEPS.length}
        </p>

        {/* Title */}
        <h2 style={{
          fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-0.4px', marginBottom: '10px',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {cur.title}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65,
          marginBottom: cur.tip ? '12px' : '24px',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {cur.description}
        </p>

        {/* Tip */}
        {cur.tip && (
          <div style={{
            padding: '9px 12px', borderRadius: '10px',
            background: cur.color + '10',
            border: `1px solid ${cur.color}22`,
            marginBottom: '20px',
          }}>
            <p style={{ fontSize: '11px', color: cur.color, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              {cur.tip}
            </p>
          </div>
        )}

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '18px' }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? '20px' : '6px', height: '6px',
                borderRadius: '99px', border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.3s ease',
                background: i === step ? cur.color : 'var(--surface-3)',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: '12px 14px', borderRadius: '13px',
                border: '1px solid var(--border)', background: 'var(--surface-2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
            style={{
              flex: 1, padding: '13px', borderRadius: '13px', border: 'none',
              background: cur.gradient, color: '#fff', cursor: 'pointer',
              fontFamily: 'Inter, -apple-system, sans-serif',
              fontSize: '14px', fontWeight: 800,
              boxShadow: `0 6px 18px ${cur.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              transition: 'opacity 0.15s',
            }}
          >
            {isLast
              ? <><Check size={15} strokeWidth={2.5} />Começar a usar</>
              : <>Próximo <ChevronRight size={15} strokeWidth={2.5} /></>
            }
          </button>
        </div>

        {!isLast && (
          <button
            onClick={finish}
            style={{
              display: 'block', margin: '12px auto 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Pular tutorial
          </button>
        )}
      </div>
    </div>
  )
}
