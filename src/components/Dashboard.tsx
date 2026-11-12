import { Package, AlertTriangle, ChevronRight, Zap, Search, ShoppingBag, Cross, Target } from 'lucide-react'
import { UserProfile, Tab } from '../types'
import ApplicationCalendar from './ApplicationCalendar'
import { WorkoutWidget, MealWidget, WaterWidget, StatTile } from './DashboardWidgets'
import InsightsCarousel from './InsightsCarousel'
import PushPrompt, { PUSH_PROMPT_ID } from './PushPrompt'
import { LibraryWidget } from './Library'
import { calcIMC, imcLabel } from '../utils/bmiUtils'
import { alpha } from '../utils/color'
import { getAppsLeft, getDoseValue, getMedicationLabel, isLowStock, stockMonths } from '../utils/medicationUtils'
import { getPlateauStatus, getPlateauStatusMeta } from '../utils/plateauUtils'
import { getGreeting, getFormattedDate, DOSE_PHASE, getMotivation } from '../utils/dashboardUtils'
import { getWeightProgress, protocolDays } from '../utils/profileUtils'
import { lastApplicationDate } from '../utils/applicationCalendarUtils'
import { diffDays, todayStr } from '../utils/dateUtils'
import { type Insight, getInsights, readInsightContext, MAX_INSIGHTS } from '../utils/insightUtils'

interface Props {
  profile: UserProfile
  onNavigate: (tab: Tab, section?: string) => void
  onUpdateProfile: (p: UserProfile) => void
  // Avisos e o pedido de notificações dispensados (estado de useReminders)
  isDismissed?: (id: string) => boolean
  onDismissReminder?: (id: string) => void
  pushPromptDismissed?: boolean
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Dashboard({ profile, onNavigate, onUpdateProfile, isDismissed = () => false, onDismissReminder = () => {}, pushPromptDismissed = true }: Props) {
  const { current: lastWeight, lost: totalLost, toGoal, hasGoal, pct, reachedGoal } = getWeightProgress(profile)
  const days        = protocolDays(profile)
  const weeks       = Math.floor(days / 7)
  const imc         = calcIMC(lastWeight, profile.height)
  const imcInfo     = imc ? imcLabel(imc) : null
  const dose        = getDoseValue(profile)

  // Próxima aplicação: 7 dias depois da última registrada
  const lastApp       = lastApplicationDate(profile)
  const daysUntilNext = lastApp ? Math.max(0, 7 - diffDays(todayStr(), lastApp)) : null
  const appToday      = daysUntilNext === 0

  const motivation = getMotivation(totalLost, toGoal, weeks, days, reachedGoal)

  const appsLeft = getAppsLeft(profile)
  const stockLow = isLowStock(appsLeft)

  const plateauStatus = getPlateauStatus(profile)
  const showPlateauBanner = ['possivel_estagnacao', 'em_acompanhamento_14dias', 'estagnacao_persistente'].includes(plateauStatus)
  const plateauMeta = getPlateauStatusMeta(plateauStatus)

  // Recalculado a cada render: treino e água vêm do localStorage, e o App
  // re-renderiza a cada minuto e a cada registro (useReminders)
  const insights = getInsights(readInsightContext(profile)).filter(i => !isDismissed(i.id)).slice(0, MAX_INSIGHTS)

  function openInsight(i: Insight) {
    // A aplicação se registra no calendário desta própria tela
    if (i.tab === 'dashboard') {
      document.querySelector('[data-tour="dash-calendar"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      onNavigate(i.tab, i.section)
    }
  }

  // Arco SVG para progresso da meta
  const arcR    = 44
  const arcCirc = 2 * Math.PI * arcR
  const arcOff  = arcCirc * (1 - Math.min(100, pct) / 100)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Saudação ── */}
      <div data-tour="dash-greeting" style={{ paddingTop: '2px', paddingBottom: '0' }}>
        <p className="cap-first" style={{
          fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
          marginBottom: '6px', fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.01em',
        }}>
          {getFormattedDate()}
        </p>
        <h1 style={{
          fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-0.7px', lineHeight: 1.12, margin: 0,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {getGreeting()}, {profile.name.split(' ')[0]}
        </h1>
        <p style={{
          fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px',
          fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{motivation.text}</span>
          {' · '}
          {motivation.sub}
        </p>
      </div>

      {/* ── Hero de Peso ── */}
      <button
        data-tour="dash-weight-hero"
        onClick={() => onNavigate('progress')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Ver evolução de peso"
      >
        <div style={{
          background: 'var(--g-hero)',
          borderRadius: '26px', padding: '22px 22px 20px',
          boxShadow: '0 10px 40px rgba(var(--shadow-rgb),0.28), 0 2px 8px rgba(var(--shadow-rgb),0.18)',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decoração de fundo */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', left: '20%',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative' }}>
            {/* Label topo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Peso atual
              </p>
              <p style={{ fontSize: '10px', opacity: 0.45, margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                {weeks === 0 ? 'Início' : `${weeks}ª semana`} · {getMedicationLabel(profile)}
              </p>
            </div>

            {/* Peso + arco */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
              {/* Coluna esquerda — peso e variação */}
              <div>
                <p className="num-display" style={{ fontSize: '56px', color: '#fff', margin: '0 0 4px' }}>
                  {lastWeight}
                  <span style={{ fontSize: '18px', opacity: 0.60, marginLeft: '5px', fontWeight: 600, letterSpacing: '0' }}>kg</span>
                </p>
                {totalLost > 0 ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '99px', padding: '4px 10px' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M4.5 8L4.5 1M1 4.5L4.5 1L8 4.5" stroke="var(--aqua)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                      {totalLost.toFixed(1)} kg eliminados
                    </span>
                  </div>
                ) : totalLost < 0 ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--amber-bg)', border: '1px solid var(--amber-line)', borderRadius: '99px', padding: '4px 10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--amber)', letterSpacing: '-0.3px' }}>
                      +{Math.abs(totalLost).toFixed(1)} kg
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', opacity: 0.40, fontWeight: 500 }}>Início do protocolo</span>
                )}
              </div>

              {/* Arco de progresso SVG */}
              {hasGoal && (
                <div style={{ position: 'relative', flexShrink: 0, width: '108px', height: '108px' }}>
                  <svg width="108" height="108" viewBox="0 0 108 108">
                    <defs>
                      <linearGradient id="ring-peso" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--sky)" />
                        <stop offset="100%" stopColor="var(--aqua)" />
                      </linearGradient>
                    </defs>
                    <circle cx="54" cy="54" r={arcR} fill="none"
                      stroke="var(--track-on-dark)" strokeWidth="7" />
                    <circle cx="54" cy="54" r={arcR} fill="none"
                      stroke="url(#ring-peso)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={arcCirc}
                      strokeDashoffset={arcOff}
                      transform="rotate(-90 54 54)"
                      style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
                    <p className="num-display" style={{ fontSize: '20px', color: '#fff', margin: 0 }}>
                      {pct.toFixed(0)}%
                    </p>
                    <p style={{ fontSize: '9px', opacity: 0.45, margin: 0, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                      {reachedGoal ? 'concluído' : 'da meta'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de progresso */}
            {hasGoal && (
              <>
                <div style={{ background: 'var(--track-on-dark)', borderRadius: '99px', height: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'var(--g-ring)',
                    borderRadius: '99px',
                    transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', opacity: 0.42, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                    {profile.startWeight} kg início
                  </span>
                  <span style={{ fontSize: '10px', opacity: 0.75, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                    {reachedGoal
                      ? <><Target size={11} strokeWidth={2.5} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Meta atingida!</>
                      : `Faltam ${toGoal.toFixed(1)} kg`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      {/* ── Indicador de platô ── */}
      {showPlateauBanner && (
        <button
          onClick={() => onNavigate('health', 'antiplato')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
          aria-label="Ver avaliação de platô"
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 16px', borderRadius: '16px',
            background: alpha(plateauMeta.color, 6), border: `1.5px solid ${alpha(plateauMeta.color, 19)}`,
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
              background: alpha(plateauMeta.color, 9), display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: plateauMeta.color,
            }}>
              <Search size={15} strokeWidth={2} />
            </div>
            <p style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: plateauMeta.color, margin: 0 }}>
              {plateauMeta.label}
            </p>
            <ChevronRight size={14} strokeWidth={2} color={plateauMeta.color} />
          </div>
        </button>
      )}

      {/* ── Avisos para você ── */}
      <PushPrompt dismissed={pushPromptDismissed} onDismiss={() => onDismissReminder(PUSH_PROMPT_ID)} />
      <InsightsCarousel insights={insights} onOpen={openInsight} onDismiss={onDismissReminder} />

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 3fr', gap: '10px' }}>
        <StatTile
          label="IMC"
          value={imc ? imc.toFixed(1) : '—'}
          sub={imcInfo?.label}
          subColor={imcInfo?.color}
          icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
        />

        {/* Tile de Dose — 4/3 mantém a altura da linha de quando o tile era quadrado em 1/3 da largura */}
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3' }}>
          <div style={{ position: 'absolute', top: '14px', right: '14px', opacity: 0.10 }}>
            <Zap size={36} strokeWidth={1.5} />
          </div>
          {/* nowrap: em telas de 360px o rótulo quebrava em duas linhas e empurrava a legenda para fora do cartão */}
          <p className="label-base" style={{ marginBottom: '8px', whiteSpace: 'nowrap' }}>Dose atual</p>
          <p className="num-display" style={{ fontSize: dose != null ? '28px' : '16px', color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {dose != null ? (
              <>
                {dose}
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px', letterSpacing: '0' }}>mg</span>
              </>
            ) : 'Não informada'}
          </p>
          {daysUntilNext !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: appToday ? 'var(--teal-l)' : 'var(--ice)',
              border: `1px solid ${appToday ? 'var(--teal)' : 'var(--sky)'}`,
              borderRadius: '99px', padding: '2px 8px', marginBottom: '4px',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: appToday ? 'var(--teal)' : 'var(--cobalt)', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: appToday ? 'var(--teal-d)' : 'var(--cobalt)' }}>
                {appToday ? 'Aplicar hoje!' : `Próxima em ${daysUntilNext}d`}
              </span>
            </div>
          )}
          {dose != null && DOSE_PHASE[dose] && (
            <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--cobalt)', margin: 0 }}>
              {DOSE_PHASE[dose]}
            </p>
          )}
        </div>
      </div>

      <WaterWidget weight={lastWeight} onNavigate={onNavigate} />

      {/* ── Widgets diários ── */}
      <div data-tour="dash-widgets" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <WorkoutWidget onNavigate={onNavigate} />
        <MealWidget profile={profile} onNavigate={onNavigate} />
      </div>

      {/* ── Farmácias parceiras ── */}
      <button
        onClick={() => onNavigate('profile', 'farmacias')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Farmácias parceiras"
      >
        <div style={{
          borderRadius: '26px', padding: '18px 20px',
          background: 'var(--teal-l)',
          boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--teal) 30%, var(--teal-l)), 0 8px 22px rgba(var(--shadow-rgb),0.10), 0 2px 6px rgba(var(--shadow-rgb),0.08)',
          position: 'relative', overflow: 'hidden',
          transition: 'transform 0.15s, box-shadow 0.2s',
        }}>
          <div style={{ position: 'absolute', top: '-32px', right: '-32px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em',
                margin: '0 0 8px', color: 'var(--teal-d)', fontFamily: 'Inter, sans-serif',
              }}>
                Farmácias
              </p>
              <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                Farmácias parceiras
              </p>
              <p style={{ fontSize: '11px', color: 'var(--ink-2)', fontWeight: 600, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Fale direto com farmácias indicadas
              </p>
            </div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(255,255,255,0.65)', border: '1px solid color-mix(in srgb, var(--teal) 30%, var(--teal-l))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cross size={22} strokeWidth={1.75} color="var(--teal-d)" />
            </div>
          </div>
        </div>
      </button>

      {/* ── Calendário de aplicações ── */}
      <div data-tour="dash-calendar" className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Calendário de aplicações
            </p>
          </div>
        </div>
        <ApplicationCalendar profile={profile} onUpdateProfile={onUpdateProfile} compact />
      </div>

      {/* ── Loja de parceiros ── */}
      <button
        onClick={() => onNavigate('profile', 'loja')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Loja de produtos recomendados"
      >
        <div style={{
          borderRadius: '26px', padding: '18px 20px',
          background: 'var(--g-midnight)',
          boxShadow: '0 8px 28px rgba(var(--shadow-rgb),0.28), 0 2px 6px rgba(var(--shadow-rgb),0.16)',
          position: 'relative', overflow: 'hidden',
          transition: 'transform 0.15s, box-shadow 0.2s',
        }}>
          <div style={{ position: 'absolute', top: '-32px', right: '-32px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em',
                margin: '0 0 8px', color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif',
              }}>
                Loja
              </p>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                Produtos recomendados
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Selecionados para o seu tratamento
              </p>
            </div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShoppingBag size={22} strokeWidth={1.75} color="rgba(255,255,255,0.90)" />
            </div>
          </div>
        </div>
      </button>

      {/* ── Biblioteca ── */}
      <LibraryWidget onOpen={() => onNavigate('library')} />

      {/* ── Indicador de estoque ── */}
      <button
        onClick={() => onNavigate('profile', 'stock')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Gerenciar estoque"
      >
        <div style={{
          borderRadius: '26px', padding: '18px 20px',
          background: stockLow ? 'var(--amber-bg)' : 'var(--surface)',
          boxShadow: stockLow
            ? 'inset 0 0 0 1px var(--amber-line), var(--shadow-card)'
            : appsLeft != null
              ? 'inset 0 0 0 1px var(--line), var(--shadow-card)'
              : 'var(--shadow-card)',
          border: appsLeft == null ? '1.5px dashed var(--border-strong)' : 'none',
          position: 'relative', overflow: 'hidden',
          transition: 'transform 0.15s, box-shadow 0.2s',
        }}>
          {appsLeft != null && (
            <>
              <div style={{ position: 'absolute', top: '-32px', right: '-32px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em',
                margin: 0, marginBottom: '8px',
                color: 'var(--ink-2)',
                fontFamily: 'Inter, sans-serif',
              }}>
                Estoque de medicamento
              </p>
              {appsLeft != null ? (
                <>
                  <p className="num-display" style={{ fontSize: '40px', color: 'var(--ink)', margin: '0 0 4px' }}>
                    {appsLeft}
                    <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.65, marginLeft: '6px', letterSpacing: '0.02em' }}>
                      {appsLeft === 1 ? 'aplicação' : 'aplicações'}
                    </span>
                  </p>
                  <p style={{ fontSize: '11px', color: stockLow ? 'var(--amber)' : 'var(--ink-2)', fontWeight: 600, margin: 0, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ~{stockMonths(appsLeft)} {stockMonths(appsLeft) === 1 ? 'mês' : 'meses'} restantes
                    {stockLow && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        · <AlertTriangle size={10} strokeWidth={2.5} style={{ flexShrink: 0 }} />Repor em breve
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  Configure o controle de estoque
                </p>
              )}
            </div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: appsLeft == null ? 'var(--surface-2)' : stockLow ? 'var(--surface)' : 'var(--ice)',
              border: appsLeft != null ? '1px solid rgba(255,255,255,0.16)' : '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: appsLeft != null ? 1 : 0.35,
            }}>
              <Package size={22} strokeWidth={1.75} color={appsLeft == null ? 'var(--text-muted)' : stockLow ? 'var(--amber)' : 'var(--cobalt)'} />
            </div>
          </div>
        </div>
      </button>

    </div>
  )
}
