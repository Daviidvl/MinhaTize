import { UserProfile, Tab, MEDICATION_LABELS, WEEK_DAYS_FULL } from '../types'
import ApplicationCalendar from './ApplicationCalendar'

interface Props {
  profile: UserProfile
  onNavigate: (tab: Tab) => void
  onUpdateProfile: (p: UserProfile) => void
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
}

function calcIMC(w: number, h: number) {
  if (!h || !w) return null
  return w / ((h / 100) ** 2)
}

function imcLabel(v: number) {
  if (v < 18.5) return 'Abaixo'
  if (v < 25)   return 'Normal'
  if (v < 30)   return 'Sobrepeso'
  if (v < 35)   return 'Obeso I'
  if (v < 40)   return 'Obeso II'
  return 'Obeso III'
}

const DOSE_PHASE: Record<number, string> = {
  2.5: 'Fase inicial', 5: 'Adaptação', 7.5: 'Progresso',
  10: 'Consolidação', 12.5: 'Avançado', 15: 'Dose máxima',
}

function getMotivation(lost: number, toGoal: number, weeks: number, days: number, reachedGoal: boolean) {
  if (reachedGoal)          return { text: '🎉 Meta atingida!', sub: 'Resultado incrível. Continue cuidando dos hábitos.' }
  if (lost >= 10)           return { text: `${lost.toFixed(1)}kg eliminados 🔥`, sub: 'Resultado extraordinário.' }
  if (toGoal > 0 && toGoal <= 3) return { text: `Faltam apenas ${toGoal.toFixed(1)}kg!`, sub: 'Você está na reta final.' }
  if (lost >= 5)            return { text: `${lost.toFixed(1)}kg a menos 💪`, sub: 'Cada semana de consistência conta.' }
  if (weeks >= 8)           return { text: `${weeks} semanas de protocolo`, sub: 'Consistência é o maior diferencial.' }
  if (lost >= 2)            return { text: `Já perdeu ${lost.toFixed(1)}kg`, sub: `Faltam ${toGoal.toFixed(1)}kg para a meta.` }
  if (weeks >= 2)           return { text: `${weeks}ª semana em protocolo`, sub: 'A dedicação já está gerando resultados.' }
  if (days <= 3)            return { text: 'Bem-vindo ao protocolo!', sub: 'Registre seu peso toda semana.' }
  return { text: 'Registre seu peso', sub: 'Acompanhe sua evolução no gráfico.' }
}

export default function Dashboard({ profile, onNavigate, onUpdateProfile }: Props) {
  const lastWeight  = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const totalLost   = profile.startWeight - lastWeight
  const toGoal      = lastWeight - profile.goalWeight
  const hasGoal     = profile.startWeight !== profile.goalWeight
  const pct         = hasGoal
    ? Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.goalWeight)) * 100))
    : 0
  const days        = daysSince(profile.startDate)
  const weeks       = Math.floor(days / 7)
  const imc         = calcIMC(lastWeight, profile.height)
  const reachedGoal = hasGoal && lastWeight <= profile.goalWeight

  const lastApp       = profile.lastApplication
  const appDay        = profile.applicationDay
  const daysSinceApp  = lastApp ? daysSince(lastApp) : null
  const daysUntilNext = daysSinceApp != null ? Math.max(0, 7 - daysSinceApp) : null
  const appPct        = daysSinceApp != null ? Math.min(100, (daysSinceApp / 7) * 100) : 0
  const appToday      = daysUntilNext === 0

  const motivation = getMotivation(totalLost, toGoal, weeks, days, reachedGoal)

  // Estoque: calcular aplicações restantes
  const stock     = profile.stock
  const appsLeft  = stock
    ? Math.floor(stock.amouleMg / profile.currentDose) * stock.ampouleCount
    : null
  const stockLow  = appsLeft != null && appsLeft < 4

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Saudação */}
      <div style={{ paddingTop: '2px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
          {weeks === 0 ? 'Início do protocolo' : `${weeks}ª semana`}
          {' · '}{MEDICATION_LABELS[profile.medication]}
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1.2, margin: 0 }}>
          Olá, {profile.name.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Mensagem motivacional */}
      <div style={{
        padding: '11px 14px', borderRadius: '13px',
        background: 'linear-gradient(135deg, var(--primary-light), transparent)',
        border: '1px solid rgba(16,185,129,0.2)',
      }}>
        <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.3, margin: 0 }}>
          {motivation.text}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {motivation.sub}
        </p>
      </div>

      {/* Hero — Peso */}
      <button
        onClick={() => onNavigate('progress')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
          borderRadius: '20px', padding: '18px 20px',
          boxShadow: 'var(--shadow-green)', color: '#fff',
        }}>
          <p style={{ fontSize: '10px', fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Peso atual · toque para ver evolução
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
              {lastWeight}
              <span style={{ fontSize: '15px', opacity: 0.8, marginLeft: '3px' }}>kg</span>
            </p>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '19px', fontWeight: 800 }}>
                {totalLost > 0 ? '−' : totalLost < 0 ? '+' : ''}{Math.abs(totalLost).toFixed(1)}kg
              </p>
              <p style={{ fontSize: '10px', opacity: 0.65, fontWeight: 600 }}>perdido total</p>
            </div>
          </div>
          {hasGoal && (
            <>
              <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: '99px', height: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: '99px', transition: 'width 0.9s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 600 }}>{profile.startWeight}kg início</span>
                <span style={{ fontSize: '10px', opacity: 0.9, fontWeight: 700 }}>
                  {reachedGoal ? '🎉 Meta atingida!' : `Faltam ${toGoal.toFixed(1)}kg`}
                </span>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Próxima aplicação */}
      <div className="card" style={{ padding: '1rem 1.125rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lastApp ? '8px' : 0 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
              💉 Próxima aplicação
            </p>
            <p style={{
              fontSize: '12px', marginTop: '2px', fontWeight: appToday ? 700 : 400,
              color: appToday ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {lastApp
                ? appToday
                  ? `Hoje! ${appDay !== undefined ? `(${WEEK_DAYS_FULL[appDay]})` : ''}`
                  : `Em ${daysUntilNext} dia${daysUntilNext !== 1 ? 's' : ''}`
                : appDay !== undefined
                  ? `Toda ${WEEK_DAYS_FULL[appDay]}`
                  : 'Configure no perfil'}
            </p>
          </div>
          <button
            onClick={() => onUpdateProfile({ ...profile, lastApplication: new Date().toISOString().split('T')[0] })}
            style={{
              padding: '8px 14px', borderRadius: '9px', border: 'none',
              background: appToday ? 'var(--primary)' : 'var(--primary-light)',
              color: appToday ? '#fff' : 'var(--primary)',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: appToday ? 'var(--shadow-green)' : 'none',
            }}
          >
            {lastApp ? '✓ Aplicado' : 'Registrar'}
          </button>
        </div>
        {lastApp && (
          <div className="progress-track" style={{ height: '4px' }}>
            <div className="progress-fill" style={{
              width: `${appPct}%`,
              background: appPct > 85 ? 'linear-gradient(90deg, var(--primary), #F59E0B)' : undefined,
            }} />
          </div>
        )}
      </div>

      {/* Calendário compacto */}
      {appDay !== undefined && (
        <div className="card" style={{ padding: '1rem 1.125rem' }}>
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>
            📅 Calendário de aplicações
          </p>
          <ApplicationCalendar profile={profile} onUpdateProfile={onUpdateProfile} compact />
        </div>
      )}

      {/* Stats compactas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '4px' }}>IMC</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-1px' }}>
            {imc ? imc.toFixed(1) : '--'}
          </p>
          {imc && <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>{imcLabel(imc)}</p>}
        </div>
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '4px' }}>Dose atual</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-1px' }}>
            {profile.currentDose}
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '2px' }}>mg</span>
          </p>
          <p style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '3px', fontWeight: 700 }}>
            {DOSE_PHASE[profile.currentDose] ?? ''}
          </p>
        </div>
      </div>

      {/* Acesso rápido */}
      <div>
        <p className="label-base" style={{ marginBottom: '10px' }}>Acesso rápido</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {([
            { icon: '📊', title: 'Progresso', sub: 'Ver evolução', tab: 'progress'   },
            { icon: '🌿', title: 'Saúde',     sub: 'Guias',       tab: 'health'     },
            { icon: '💉', title: 'Calcular',  sub: 'Dose',        tab: 'calculator' },
          ] as const).map(a => (
            <button
              key={a.tab}
              onClick={() => onNavigate(a.tab)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '14px 8px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.15s',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-green)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-card)'
              }}
            >
              <span style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}>{a.icon}</span>
              <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', margin: 0 }}>{a.title}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{a.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Indicador de estoque — aplicações restantes */}
      <button
        onClick={() => onNavigate('profile')}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 14px', borderRadius: '12px',
          background: stockLow ? 'rgba(239,68,68,0.06)' : 'var(--surface-2)',
          border: stockLow
            ? '1px solid rgba(239,68,68,0.25)'
            : appsLeft != null ? '1px solid var(--border)' : '1.5px dashed var(--border-strong)',
        }}>
          <span style={{ fontSize: '16px' }}>📦</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {appsLeft != null ? (
              <>
                <p style={{ fontSize: '12px', fontWeight: 700, color: stockLow ? '#EF4444' : 'var(--text-primary)', margin: 0 }}>
                  {stockLow ? '⚠️ ' : ''}{appsLeft} {appsLeft === 1 ? 'aplicação restante' : 'aplicações restantes'}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  ~{Math.round(appsLeft / 4)} {Math.round(appsLeft / 4) === 1 ? 'mês' : 'meses'} de tratamento
                </p>
              </>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
                Configure o controle de estoque
              </p>
            )}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>›</span>
        </div>
      </button>

    </div>
  )
}
