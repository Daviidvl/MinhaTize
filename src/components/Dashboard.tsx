import { UserProfile } from '../types'
import Achievements from './Achievements'
import { Tab } from '../types'

interface Props {
  profile: UserProfile
  onNavigate: (tab: Tab) => void
  onUpdateProfile: (p: UserProfile) => void
}

function calcIMC(w: number, h: number) {
  if (!h || !w) return null
  return (w / ((h / 100) ** 2))
}

function imcLabel(v: number) {
  if (v < 18.5) return 'Abaixo do peso'
  if (v < 25)   return 'Peso normal'
  if (v < 30)   return 'Sobrepeso'
  if (v < 35)   return 'Obesidade I'
  if (v < 40)   return 'Obesidade II'
  return 'Obesidade III'
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
}

function weeksSince(d: string) {
  return Math.floor(daysSince(d) / 7)
}

const DOSE_PHASE: Record<number, string> = {
  2.5: 'Fase inicial', 5: 'Adaptação', 7.5: 'Progresso',
  10: 'Consolidação', 12.5: 'Avançado', 15: 'Dose máxima',
}

const FEELING_EMOJI: Record<string, string> = { great: '🤩', good: '😊', okay: '😐', hard: '😔' }
const FEELING_LABEL: Record<string, string> = { great: 'Ótimo', good: 'Bem', okay: 'Regular', hard: 'Difícil' }

export default function Dashboard({ profile, onNavigate, onUpdateProfile }: Props) {
  const lastWeight = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const totalLost  = profile.startWeight - lastWeight
  const toGoal     = lastWeight - profile.goalWeight
  const hasGoal    = profile.startWeight !== profile.goalWeight
  const pct        = hasGoal
    ? Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.goalWeight)) * 100))
    : 0
  const days   = daysSince(profile.startDate)
  const weeks  = weeksSince(profile.startDate)
  const imc    = calcIMC(lastWeight, profile.height)

  const lastDiary = (profile.diary ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))[0]

  const lastApp       = profile.lastApplication
  const daysSinceApp  = lastApp ? daysSince(lastApp) : null
  const daysUntilNext = daysSinceApp != null ? Math.max(0, 7 - daysSinceApp) : null
  const appPct        = daysSinceApp != null ? Math.min(100, (daysSinceApp / 7) * 100) : 0
  const appToday      = daysUntilNext === 0

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Hero greeting */}
      <div style={{ paddingTop: '4px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
          {days === 0 ? 'Primeiro dia!' : `${weeks > 0 ? `${weeks} sem.` : `${days} dias`} em protocolo`}
        </p>
        <h1 style={{
          fontSize: '26px', fontWeight: 800, margin: 0,
          color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.15,
        }}>
          Olá, {profile.name} 👋
        </h1>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

        {/* Peso atual — destaque */}
        <div className="stat-card" style={{
          gridColumn: '1 / -1',
          background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
          border: 'none', color: '#fff', padding: '1.25rem 1.375rem',
          boxShadow: 'var(--shadow-green)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Peso atual
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
              {lastWeight}
              <span style={{ fontSize: '18px', fontWeight: 600, opacity: 0.8, marginLeft: '4px' }}>kg</span>
            </p>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: totalLost > 0 ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {totalLost > 0 ? '−' : totalLost < 0 ? '+' : ''}{Math.abs(totalLost).toFixed(1)}kg
              </p>
              <p style={{ fontSize: '11px', opacity: 0.7, fontWeight: 600, marginTop: '1px' }}>total perdido</p>
            </div>
          </div>
          {hasGoal && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px', opacity: 0.7, fontWeight: 600 }}>Meta: {profile.goalWeight}kg</span>
                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.95 }}>
                  {toGoal <= 0 ? '🎉 Meta atingida!' : `Faltam ${toGoal.toFixed(1)}kg`}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', background: '#fff', borderRadius: '99px',
                  transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* IMC */}
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>IMC atual</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-1px' }}>
            {imc ? imc.toFixed(1) : '--'}
          </p>
          {imc && <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{imcLabel(imc)}</p>}
        </div>

        {/* Dose */}
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Dose atual</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-1px' }}>
            {profile.currentDose}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '2px' }}>mg</span>
          </p>
          <p style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '4px', fontWeight: 700 }}>
            {DOSE_PHASE[profile.currentDose] ?? ''}
          </p>
        </div>
      </div>

      {/* Janela de aplicação */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lastApp ? '12px' : '0' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              💉 Próxima aplicação
            </p>
            <p style={{ fontSize: '12px', color: appToday ? 'var(--primary)' : 'var(--text-muted)', marginTop: '2px', fontWeight: appToday ? 700 : 500 }}>
              {lastApp
                ? appToday ? 'Hoje é o dia! ✓' : `Em ${daysUntilNext} dia${daysUntilNext !== 1 ? 's' : ''}`
                : 'Registre sua última aplicação'}
            </p>
          </div>
          <button
            onClick={() => onUpdateProfile({ ...profile, lastApplication: new Date().toISOString().split('T')[0] })}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              background: appToday ? 'var(--primary)' : 'var(--primary-light)',
              color: appToday ? '#fff' : 'var(--primary)',
              fontWeight: 700, fontSize: '12px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: appToday ? 'var(--shadow-green)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {lastApp ? 'Aplicado ✓' : 'Registrar'}
          </button>
        </div>
        {lastApp && (
          <div className="progress-track" style={{ height: '6px' }}>
            <div className="progress-fill" style={{
              width: `${appPct}%`,
              background: appPct > 85
                ? 'linear-gradient(90deg, var(--primary), #F59E0B)'
                : 'linear-gradient(90deg, var(--primary), var(--accent))',
            }} />
          </div>
        )}
      </div>

      {/* Último diário */}
      {lastDiary && (
        <div className="card" style={{
          padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '14px',
          border: '1px solid var(--primary-light)',
          background: 'linear-gradient(135deg, var(--primary-light), transparent)',
        }}>
          <span style={{ fontSize: '36px', flexShrink: 0 }}>{FEELING_EMOJI[lastDiary.feeling]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="label-base" style={{ marginBottom: '3px' }}>Última semana</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {lastDiary.dose}mg · {FEELING_LABEL[lastDiary.feeling]}
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
      <div>
        <p className="label-base" style={{ marginBottom: '10px' }}>Acesso rápido</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {([
            { icon: '⚖️', title: 'Peso',     sub: 'Registrar',    tab: 'progress'   },
            { icon: '💉', title: 'Calcular', sub: 'Dose',         tab: 'calculator' },
            { icon: '🌿', title: 'Saúde',    sub: 'Guias',        tab: 'health'     },
          ] as const).map(a => (
            <button
              key={a.tab}
              className="card"
              onClick={() => onNavigate(a.tab)}
              style={{
                textAlign: 'center', padding: '1rem 0.5rem', cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}>{a.icon}</span>
              <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{a.title}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{a.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Conquistas */}
      <Achievements profile={profile} />
    </div>
  )
}
