import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'

export const TOUR_KEY = 'tizetrack_tour_done'

interface Step { target: string; title: string; description: string }

const STEPS: Step[] = [
  {
    target: 'tab-dashboard',
    title: 'Início',
    description: 'Central de controle. Peso atual, progresso na meta, próxima aplicação e alertas — tudo em um só lugar.',
  },
  {
    target: 'tab-progress',
    title: 'Progresso',
    description: 'Registre seu peso semanalmente e visualize a curva de evolução, IMC e quanto falta para a meta.',
  },
  {
    target: 'tab-health',
    title: 'Saúde',
    description: 'Efeitos colaterais com dicas, plano alimentar de 30 dias personalizado e treinos adaptados para quem usa GLP-1.',
  },
  {
    target: 'tab-calculator',
    title: 'Calculadora',
    description: 'Calcule doses e diluições com precisão para cada semana do protocolo.',
  },
  {
    target: 'tab-laboratory',
    title: 'Laboratório',
    description: 'Registre exames e acompanhe a evolução dos resultados ao longo do tratamento.',
  },
]

interface Rect { top: number; left: number; width: number; height: number }

export default function OnboardingTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  const cur    = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    function measure() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${cur.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
    }
    const t = setTimeout(measure, 40)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [step, cur.target])

  function finish() {
    localStorage.setItem(TOUR_KEY, '1')
    onDone()
  }

  if (!rect) return null

  const PAD = 8
  const GAP = 10
  const ARR = 9

  const spotTop  = rect.top  - PAD
  const spotLeft = rect.left - PAD
  const spotW    = rect.width  + PAD * 2
  const spotH    = rect.height + PAD * 2

  // Nav is at the bottom → card appears above
  const isBelow = rect.top > window.innerHeight * 0.5

  // Arrow horizontal position within card, aligned to target center
  const tooltipMaxW   = Math.min(window.innerWidth - 32, 360)
  const tooltipLeftPx = (window.innerWidth - tooltipMaxW) / 2
  const targetCenterX = rect.left + rect.width / 2
  const arrowLeft     = Math.max(18, Math.min(tooltipMaxW - 36, targetCenterX - tooltipLeftPx - 9))

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    left:     arrowLeft,
    width:    0,
    height:   0,
    borderLeft:  '9px solid transparent',
    borderRight: '9px solid transparent',
  }
  if (isBelow) {
    arrowStyle.bottom    = -ARR
    arrowStyle.borderTop = `${ARR}px solid var(--surface)`
  } else {
    arrowStyle.top          = -ARR
    arrowStyle.borderBottom = `${ARR}px solid var(--surface)`
  }

  return (
    <>
      {/* Spotlight "hole" — box-shadow darkens everything outside the target rect */}
      <div
        style={{
          position:  'fixed',
          top:       spotTop,
          left:      spotLeft,
          width:     spotW,
          height:    spotH,
          borderRadius: '14px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
          border:    '2px solid rgba(255,255,255,0.30)',
          zIndex:    9990,
          pointerEvents: 'none',
          transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
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
            : { top:    spotTop + spotH + GAP + ARR }
          ),
          background:   'var(--surface)',
          borderRadius: '20px',
          border:       '1px solid var(--border)',
          padding:      '20px 20px 16px',
          zIndex:       9995,
          boxShadow:    '0 24px 64px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.15)',
          transition:   'bottom 0.25s ease, top 0.25s ease',
        }}
      >
        {/* Arrow pointing toward target */}
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
          aria-label="Fechar"
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '16px' }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width:  i === step ? '22px' : '6px',
                height: '6px',
                borderRadius: '99px',
                border:     'none',
                padding:    0,
                background: i === step ? 'var(--primary)' : 'var(--surface-3)',
                cursor:     'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <p style={{
          fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          margin: '0 0 4px', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {step + 1} de {STEPS.length}
        </p>

        <h3 style={{
          fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)',
          margin: '0 0 8px', fontFamily: 'Inter, -apple-system, sans-serif',
          letterSpacing: '-0.3px',
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
              onClick={() => setStep(s => s - 1)}
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
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
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
