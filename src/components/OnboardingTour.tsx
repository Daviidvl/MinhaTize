import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { Tab } from '../types'

export const TOUR_KEY = 'tizetrack_tour_done'

interface TourStep {
  tab: Tab
  target: string
  title: string
  description: string
}

const STEPS: TourStep[] = [
  {
    tab: 'dashboard',
    target: 'dash-greeting',
    title: 'Bem-vindo ao MinhaTize!',
    description: 'Este é o seu Dashboard — o centro de controle do tratamento, com resumo diário do progresso.',
  },
  {
    tab: 'dashboard',
    target: 'dash-weight-hero',
    title: 'Peso & Progresso',
    description: 'Aqui aparece o seu peso atual, quanto já perdeu e o avanço até a meta. Toque para ver o gráfico completo.',
  },
  {
    tab: 'dashboard',
    target: 'dash-widgets',
    title: 'Treino e Refeição de Hoje',
    description: 'Atalhos rápidos para o treino do dia e a próxima refeição do seu plano alimentar personalizado.',
  },
  {
    tab: 'dashboard',
    target: 'dash-calendar',
    title: 'Calendário de Aplicações',
    description: 'Registre cada aplicação da medicação aqui. O app calcula automaticamente quando é a próxima dose.',
  },
  {
    tab: 'dashboard',
    target: 'tab-progress',
    title: 'Área de Progresso',
    description: 'Agora vamos ver o Progresso, onde você registra o peso toda semana e acompanha a evolução. Toque em Próximo.',
  },
  {
    tab: 'progress',
    target: 'progress-main',
    title: 'Registre seu Peso',
    description: 'Informe seu peso toda semana aqui. O app plota a curva de evolução, calcula o IMC e mostra quanto já perdeu.',
  },
  {
    tab: 'progress',
    target: 'tab-health',
    title: 'Área de Saúde',
    description: 'Próxima parada: Saúde — com plano alimentar personalizado, treinos, efeitos colaterais e muito mais.',
  },
  {
    tab: 'health',
    target: 'health-sections',
    title: 'Saúde: 7 Seções',
    description: 'Efeitos colaterais, plano alimentar, exercícios, desmame da medicação, suplementação, antiplatô e armazenamento.',
  },
  {
    tab: 'health',
    target: 'tab-calculator',
    title: 'Calculadora de Doses',
    description: 'Agora veja a Calculadora — essencial para preparar a medicação com precisão.',
  },
  {
    tab: 'calculator',
    target: 'calc-main',
    title: 'Calculando Doses',
    description: 'Informe a concentração da ampola e a dose prescrita. O app calcula exatamente quantas unidades aspirar na seringa.',
  },
  {
    tab: 'calculator',
    target: 'tab-laboratory',
    title: 'Laboratório',
    description: 'Por último, o Laboratório — onde você registra exames e acompanha os resultados ao longo do tratamento.',
  },
  {
    tab: 'laboratory',
    target: 'lab-main',
    title: 'Exames Laboratoriais',
    description: 'Cadastre glicemia, colesterol, hemograma e outros. O app sinaliza valores fora da referência e mostra a evolução.',
  },
  {
    tab: 'dashboard',
    target: 'tab-dashboard',
    title: 'Tudo pronto!',
    description: 'Use a barra de navegação para acessar qualquer área a qualquer momento. Bom tratamento!',
  },
]

interface Rect { top: number; left: number; width: number; height: number }

interface Props {
  onDone: () => void
  onTabChange: (tab: Tab) => void
}

export default function OnboardingTour({ onDone, onTabChange }: Props) {
  const [step, setStep]       = useState(0)
  const [rect, setRect]       = useState<Rect | null>(null)
  const [settling, setSettling] = useState(false)

  const cur    = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Measure target element; retries until it appears (handles tab transitions)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let attempts = 0

    function measure() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${cur.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        setSettling(false)
      } else if (attempts < 20) {
        attempts++
        timer = setTimeout(measure, 60)
      }
    }

    setRect(null)
    setSettling(true)
    timer = setTimeout(measure, 120)

    function onResize() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${cur.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
    }
    window.addEventListener('resize', onResize)
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize) }
  }, [step, cur.target])

  function finish() {
    localStorage.setItem(TOUR_KEY, '1')
    onDone()
  }

  function goNext() {
    if (isLast) { finish(); return }
    const next = step + 1
    if (STEPS[next].tab !== cur.tab) {
      onTabChange(STEPS[next].tab)
    }
    setStep(next)
  }

  function goPrev() {
    if (step === 0) return
    const prev = step - 1
    if (STEPS[prev].tab !== cur.tab) {
      onTabChange(STEPS[prev].tab)
    }
    setStep(prev)
  }

  // Overlay while finding element
  if (settling || !rect) {
    return (
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          zIndex: 9990,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.15)',
          borderTopColor: 'rgba(255,255,255,0.75)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const PAD = 8
  const GAP = 10
  const ARR = 9

  const spotTop  = rect.top    - PAD
  const spotLeft = rect.left   - PAD
  const spotW    = rect.width  + PAD * 2
  const spotH    = rect.height + PAD * 2

  // Card above or below the spotlight?
  const isBelow  = rect.top > window.innerHeight * 0.55

  const tooltipMaxW   = Math.min(window.innerWidth - 32, 360)
  const tooltipLeftPx = (window.innerWidth - tooltipMaxW) / 2
  const targetCenterX = rect.left + rect.width / 2
  const arrowLeft     = Math.max(18, Math.min(tooltipMaxW - 36, targetCenterX - tooltipLeftPx - 9))

  const arrowStyle: React.CSSProperties = {
    position: 'absolute', left: arrowLeft,
    width: 0, height: 0,
    borderLeft: '9px solid transparent',
    borderRight: '9px solid transparent',
  }
  if (isBelow) {
    arrowStyle.bottom = -ARR
    arrowStyle.borderTop = `${ARR}px solid var(--surface)`
  } else {
    arrowStyle.top = -ARR
    arrowStyle.borderBottom = `${ARR}px solid var(--surface)`
  }

  // Which "section" is this step in? (for section pill label)
  const sectionLabel =
    cur.tab === 'dashboard'  ? 'Dashboard'   :
    cur.tab === 'progress'   ? 'Progresso'   :
    cur.tab === 'health'     ? 'Saúde'       :
    cur.tab === 'calculator' ? 'Calculadora' :
    cur.tab === 'laboratory' ? 'Laboratório' : ''

  return (
    <>
      {/* Dark overlay with spotlight hole */}
      <div
        style={{
          position:  'fixed',
          top:       spotTop,
          left:      spotLeft,
          width:     spotW,
          height:    spotH,
          borderRadius: '14px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.80)',
          border:    '2px solid rgba(255,255,255,0.35)',
          zIndex:    9990,
          pointerEvents: 'none',
          transition: 'top 0.28s ease, left 0.28s ease, width 0.28s ease, height 0.28s ease',
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          position:  'fixed',
          left:      '50%',
          transform: 'translateX(-50%)',
          width:     'calc(100% - 32px)',
          maxWidth:  `${tooltipMaxW}px`,
          ...(isBelow
            ? { bottom: window.innerHeight - spotTop + GAP + ARR }
            : { top: spotTop + spotH + GAP + ARR }
          ),
          background:   'var(--surface)',
          borderRadius: '20px',
          border:       '1px solid var(--border)',
          padding:      '20px 20px 16px',
          zIndex:       9995,
          boxShadow:    '0 24px 64px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.15)',
        }}
      >
        <div style={arrowStyle} />

        {/* Close button */}
        <button
          onClick={finish}
          style={{
            position: 'absolute', top: '14px', right: '14px',
            width: '28px', height: '28px', borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
          aria-label="Fechar tour"
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        {/* Section pill + step counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{
            fontSize: '9px', fontWeight: 800, padding: '3px 9px', borderRadius: '99px',
            background: 'var(--primary-light)', color: 'var(--primary)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {sectionLabel}
          </span>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: i === step ? 2 : 1,
                  height: '4px',
                  borderRadius: '99px',
                  background: i < step
                    ? 'var(--primary)'
                    : i === step
                      ? 'var(--primary)'
                      : 'var(--surface-3)',
                  opacity: i < step ? 0.4 : 1,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {step + 1}/{STEPS.length}
          </span>
        </div>

        <h3 style={{
          fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)',
          margin: '0 0 7px', fontFamily: 'Inter, -apple-system, sans-serif',
          letterSpacing: '-0.3px', lineHeight: 1.2,
        }}>
          {cur.title}
        </h3>

        <p style={{
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
          margin: '0 0 18px', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {cur.description}
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          {step > 0 && (
            <button
              onClick={goPrev}
              style={{
                padding: '11px 14px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'var(--surface-2)',
                cursor: 'pointer', color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={goNext}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
              color: '#fff', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
            }}
          >
            {isLast
              ? <><Check size={14} strokeWidth={2.5} /> Começar!</>
              : <>Próximo <ChevronRight size={14} strokeWidth={2.5} /></>
            }
          </button>
        </div>

        {!isLast && (
          <button
            onClick={finish}
            style={{
              display: 'block', margin: '10px auto 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Pular tour
          </button>
        )}
      </div>
    </>
  )
}
