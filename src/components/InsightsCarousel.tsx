import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'
import { Syringe, Package, HeartPulse, GlassWater, Scale, Dumbbell, TrendingDown, X, ArrowRight } from 'lucide-react'
import { type Insight, type InsightKind } from '../utils/insightUtils'

interface Props {
  insights: Insight[]
  onOpen: (insight: Insight) => void
  onDismiss: (id: string) => void
}

const KIND_META: Record<InsightKind, { label: string; icon: (color: string) => ReactNode }> = {
  application: { label: 'Aplicação', icon: c => <Syringe size={18} strokeWidth={1.85} color={c} /> },
  stock:       { label: 'Estoque',   icon: c => <Package size={18} strokeWidth={1.85} color={c} /> },
  symptoms:    { label: 'Sintomas',  icon: c => <HeartPulse size={18} strokeWidth={1.85} color={c} /> },
  workout:     { label: 'Treino',    icon: c => <Dumbbell size={18} strokeWidth={1.85} color={c} /> },
  weighIn:     { label: 'Pesagem',   icon: c => <Scale size={18} strokeWidth={1.85} color={c} /> },
  progress:    { label: 'Evolução',  icon: c => <TrendingDown size={18} strokeWidth={1.85} color={c} /> },
  water:       { label: 'Água',      icon: c => <GlassWater size={18} strokeWidth={1.85} color={c} /> },
}

const TONE = {
  info: { chip: 'var(--ice)',      icon: 'var(--cobalt)', label: 'var(--cobalt)' },
  warn: { chip: 'var(--amber-bg)', icon: 'var(--amber)',  label: 'var(--amber)' },
  good: { chip: 'var(--teal-l)',   icon: 'var(--teal-d)', label: 'var(--teal-d)' },
}

const AUTOPLAY_MS = 6000

function scrollToSlide(track: HTMLElement | null, i: number) {
  track?.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
}

// Carrossel de avisos personalizados do Início: um único cartão, com os avisos
// deslizando por dentro dele. Avança sozinho (o ponto ativo mostra o tempo)
// até a pessoa tocar, deslizar ou usar o teclado; depois fica onde ela deixou.
export default function InsightsCarousel({ insights, onOpen, onDismiss }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive]   = useState(0)
  const [touched, setTouched] = useState(false)
  const [reduced] = useState(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  const count    = insights.length
  const current  = Math.min(active, Math.max(0, count - 1))
  const autoplay = !touched && !reduced && count > 1

  useEffect(() => {
    if (!autoplay) return
    const id = window.setTimeout(() => scrollToSlide(trackRef.current, (current + 1) % count), AUTOPLAY_MS)
    return () => window.clearTimeout(id)
  }, [current, count, autoplay])

  if (count === 0) return null

  const stop = () => setTouched(true)
  const goTo = (i: number) => { stop(); scrollToSlide(trackRef.current, i) }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight' && current < count - 1) { e.preventDefault(); goTo(current + 1) }
    if (e.key === 'ArrowLeft' && current > 0)          { e.preventDefault(); goTo(current - 1) }
  }

  return (
    <section aria-roledescription="carrossel" aria-label="Avisos para você">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px', margin: '0 2px 8px' }}>
        <p className="label-base" style={{ margin: 0 }}>Para você</p>
        {count > 1 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {insights.map((ins, i) => {
              const on = i === current
              return (
                <button
                  key={ins.id}
                  onClick={() => goTo(i)}
                  aria-label={`Aviso ${i + 1} de ${count}`}
                  aria-current={on}
                  style={{ background: 'none', border: 'none', padding: '8px 3px', cursor: 'pointer', display: 'flex' }}
                >
                  <span style={{
                    position: 'relative', overflow: 'hidden', display: 'block', height: '4px', borderRadius: '99px',
                    width: on ? '18px' : '4px',
                    background: on && autoplay ? 'var(--line)' : on ? 'var(--cobalt)' : 'var(--line-strong)',
                    transition: 'width 0.35s var(--ease-smooth), background 0.3s ease',
                  }}>
                    {/* Tempo até o próximo aviso */}
                    {on && autoplay && (
                      <span key={current} style={{
                        position: 'absolute', inset: '0 auto 0 0', borderRadius: '99px', background: 'var(--cobalt)',
                        animation: `bar-grow ${AUTOPLAY_MS}ms linear forwards`,
                      }} />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          ref={trackRef}
          className="insight-track"
          tabIndex={count > 1 ? 0 : -1}
          aria-live={autoplay ? 'off' : 'polite'}
          onScroll={e => {
            const t = e.currentTarget
            const i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth))
            if (i !== current) setActive(i)
          }}
          onPointerDown={stop}
          onWheel={stop}
          onKeyDown={onKeyDown}
          style={{ display: 'flex' }}
        >
          {insights.map((ins, i) => {
            const tone = TONE[ins.tone]
            const meta = KIND_META[ins.kind]
            return (
              <article
                key={ins.id}
                aria-roledescription="aviso"
                aria-label={`${i + 1} de ${count}`}
                aria-hidden={i !== current}
                style={{
                  flex: '0 0 100%', minWidth: 0, scrollSnapAlign: 'start', scrollSnapStop: 'always',
                  display: 'flex', gap: '14px', padding: '16px 12px 14px 16px',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                  background: tone.chip, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {meta.icon(tone.icon)}
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em',
                        color: tone.label, margin: '2px 0 4px',
                      }}>
                        {meta.label}
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.25px', lineHeight: 1.25 }}>
                        {ins.title}
                      </p>
                    </div>
                    <button
                      onClick={() => { stop(); onDismiss(ins.id) }}
                      aria-label={`Dispensar aviso: ${ins.title}`}
                      tabIndex={i === current ? 0 : -1}
                      style={{
                        width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, margin: '-4px 0 0',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                      }}
                    >
                      <X size={15} strokeWidth={2} />
                    </button>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '5px 30px 0 0', lineHeight: 1.45 }}>
                    {ins.body}
                  </p>

                  {/* margin-top: auto alinha a ação no rodapé quando o texto do aviso é mais curto que o dos outros */}
                  <button
                    onClick={() => { stop(); onOpen(ins) }}
                    tabIndex={i === current ? 0 : -1}
                    style={{
                      alignSelf: 'flex-start', marginTop: 'auto', paddingTop: '10px',
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: 'none', border: 'none', paddingBottom: '2px', paddingLeft: 0, paddingRight: 0, cursor: 'pointer',
                      fontSize: '12px', fontWeight: 700, color: 'var(--cobalt)', fontFamily: 'inherit',
                    }}
                  >
                    {ins.cta}
                    <ArrowRight size={13} strokeWidth={2.25} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
