import { UserProfile } from '../types'
import Achievements from './Achievements'

interface Props {
  profile: UserProfile
  onNavigate: (tab: 'progress' | 'calculator' | 'health') => void
  onUpdateProfile: (p: UserProfile) => void
}

function calcIMC(weight: number, height: number): string {
  if (!height || !weight) return '--'
  return (weight / ((height / 100) ** 2)).toFixed(1)
}

function imcLabel(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso'
  if (imc < 25)   return 'Peso normal'
  if (imc < 30)   return 'Sobrepeso'
  if (imc < 35)   return 'Obesidade I'
  if (imc < 40)   return 'Obesidade II'
  return 'Obesidade III'
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function weeksSince(dateStr: string): number {
  return Math.floor(daysSince(dateStr) / 7)
}

const DOSE_PHASES = [
  { dose: 2.5,  month: '1–2',  label: 'Fase inicial' },
  { dose: 5,    month: '3–4',  label: 'Adaptação' },
  { dose: 7.5,  month: '5–6',  label: 'Progresso' },
  { dose: 10,   month: '7–8',  label: 'Consolidação' },
  { dose: 12.5, month: '9–10', label: 'Avançado' },
  { dose: 15,   month: '11+',  label: 'Dose máxima' },
]

export default function Dashboard({ profile, onNavigate, onUpdateProfile }: Props) {
  const lastWeight = profile.weightHistory.length > 0
    ? profile.weightHistory[profile.weightHistory.length - 1].weight
    : profile.startWeight

  const totalLost   = profile.startWeight - lastWeight
  const toGoal      = lastWeight - profile.goalWeight
  const hasProgress = profile.startWeight !== profile.goalWeight
  const progressPct = hasProgress
    ? Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.goalWeight)) * 100))
    : 0
  const weeks   = weeksSince(profile.startDate)
  const days    = daysSince(profile.startDate)
  const imcVal  = parseFloat(calcIMC(lastWeight, profile.height))

  const lastDiary = (profile.diary ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))[0]
  const feelingEmoji: Record<string, string> = { great: '🤩', good: '😊', okay: '😐', hard: '😔' }
  const feelingLabel: Record<string, string> = { great: 'Ótimo', good: 'Bem', okay: 'Regular', hard: 'Difícil' }

  // Janela de aplicação
  const lastApp = profile.lastApplication
  const daysSinceApp = lastApp ? daysSince(lastApp) : null
  const daysUntilNext = daysSinceApp !== null ? Math.max(0, 7 - daysSinceApp) : null
  const appPct = daysSinceApp !== null ? Math.min(100, (daysSinceApp / 7) * 100) : 0

  function registerApplication() {
    onUpdateProfile({ ...profile, lastApplication: new Date().toISOString().split('T')[0] })
  }

  // Fase do protocolo
  const currentPhase = DOSE_PHASES.find(p => p.dose === profile.currentDose)

  return (
    <div className="space-y-5 fade-in">

      {/* Saudação */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Olá, {profile.name}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          {days === 0
            ? 'Primeiro dia de protocolo — bem-vindo!'
            : `${weeks > 0 ? `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}` : `${days} dias`} em protocolo`}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Peso atual</p>
          <p style={{ fontSize: '27px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
            {lastWeight}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>kg</span>
          </p>
          {profile.weightHistory.length === 0 && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Peso inicial</p>
          )}
        </div>

        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Total perdido</p>
          <p style={{
            fontSize: '27px', fontWeight: 800, lineHeight: 1,
            color: totalLost > 0 ? 'var(--primary)' : 'var(--text-muted)',
          }}>
            {totalLost !== 0 && (totalLost > 0 ? '−' : '+')}
            {Math.abs(totalLost).toFixed(1)}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>kg</span>
          </p>
          {totalLost === 0 && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Registre seu peso</p>
          )}
        </div>

        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>IMC atual</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
            {isNaN(imcVal) ? '--' : imcVal}
          </p>
          {!isNaN(imcVal) && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
              {imcLabel(imcVal)}
            </p>
          )}
        </div>

        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Dose atual</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {profile.currentDose}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>mg</span>
          </p>
          {currentPhase && (
            <p style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '4px', fontWeight: 700 }}>
              {currentPhase.label}
            </p>
          )}
        </div>
      </div>

      {/* Barra de progresso para meta */}
      {hasProgress && (
        <div className="card" style={{ padding: '1.1rem 1.375rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              Progresso para a meta
            </p>
            <span style={{
              fontWeight: 800, fontSize: '13px', color: 'var(--primary)',
              background: 'var(--primary-light)', padding: '2px 10px', borderRadius: '99px',
            }}>
              {progressPct.toFixed(0)}%
            </span>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              borderRadius: '99px', transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
              minWidth: progressPct > 0 ? '8px' : '0',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{profile.startWeight}kg</p>
            <p style={{ fontSize: '11px', color: toGoal <= 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700 }}>
              {toGoal <= 0 ? '🎉 Meta atingida!' : `Faltam ${toGoal.toFixed(1)}kg`}
            </p>
          </div>
        </div>
      )}

      {/* Janela de aplicação */}
      <div className="card" style={{ padding: '1.1rem 1.375rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>💉 Próxima aplicação</p>
            {lastApp ? (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {daysUntilNext === 0
                  ? 'Hoje é o dia da aplicação!'
                  : `Em ${daysUntilNext} dia${daysUntilNext !== 1 ? 's' : ''}`}
              </p>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Registre sua última aplicação
              </p>
            )}
          </div>
          <button
            onClick={registerApplication}
            style={{
              padding: '7px 14px', borderRadius: '9px', border: 'none',
              background: daysUntilNext === 0 ? 'var(--primary)' : 'var(--primary-light)',
              color: daysUntilNext === 0 ? '#fff' : 'var(--primary-dark)',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.15s ease',
            }}
          >
            {lastApp ? 'Aplicado hoje' : 'Registrar'}
          </button>
        </div>
        {lastApp && (
          <div style={{ background: 'var(--surface-2)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${appPct}%`, height: '100%', borderRadius: '99px',
              background: daysUntilNext === 0
                ? 'var(--primary)'
                : `linear-gradient(90deg, var(--primary), ${appPct > 70 ? '#F59E0B' : 'var(--accent)'})`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        )}
      </div>

      {/* Último humor do diário */}
      {lastDiary && (
        <div className="card" style={{
          padding: '1rem 1.375rem',
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'linear-gradient(135deg, var(--primary-light), transparent)',
        }}>
          <span style={{ fontSize: '32px' }}>{feelingEmoji[lastDiary.feeling]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Última semana
            </p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {lastDiary.dose}mg · {feelingLabel[lastDiary.feeling]}
            </p>
            {lastDiary.notes && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {lastDiary.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { icon: '⚖️', title: 'Peso',        sub: 'Registrar',     tab: 'progress'   as const },
          { icon: '💉', title: 'Calcular',    sub: 'Dose',          tab: 'calculator' as const },
          { icon: '🌿', title: 'Saúde',       sub: 'Guias',         tab: 'health'     as const },
        ].map(action => (
          <button
            key={action.tab}
            className="card"
            onClick={() => onNavigate(action.tab)}
            style={{
              textAlign: 'center', cursor: 'pointer', padding: '1rem 0.5rem',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>{action.icon}</div>
            <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{action.title}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{action.sub}</p>
          </button>
        ))}
      </div>

      {/* Conquistas */}
      <Achievements profile={profile} />
    </div>
  )
}
