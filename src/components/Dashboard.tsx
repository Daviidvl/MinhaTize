import { UserProfile, Tab, MEDICATION_LABELS, WEEK_DAYS_FULL } from '../types'
import Achievements from './Achievements'
import ApplicationCalendar from './ApplicationCalendar'

interface Props {
  profile: UserProfile
  onNavigate: (tab: Tab) => void
  onUpdateProfile: (p: UserProfile) => void
}

function calcIMC(w: number, h: number) {
  if (!h || !w) return null
  return w / ((h / 100) ** 2)
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

function weeksSince(d: string) { return Math.floor(daysSince(d) / 7) }

const DOSE_PHASE: Record<number, string> = {
  2.5: 'Fase inicial', 5: 'Adaptação', 7.5: 'Progresso',
  10: 'Consolidação', 12.5: 'Avançado', 15: 'Dose máxima',
}

const FEELING_EMOJI: Record<string, string> = { great: '🤩', good: '😊', okay: '😐', hard: '😔' }
const FEELING_LABEL: Record<string, string> = { great: 'Ótimo', good: 'Bem', okay: 'Regular', hard: 'Difícil' }

function getMotivation(profile: UserProfile, lost: number, toGoal: number, weeks: number, days: number) {
  if (toGoal <= 0 && profile.startWeight !== profile.goalWeight)
    return { text: '🎉 Você atingiu sua meta!', sub: 'Resultado incrível. Continue cuidando dos hábitos.' }
  if (lost >= 10)
    return { text: `${lost.toFixed(1)}kg eliminados!`, sub: 'Resultado extraordinário. Você está transformando sua vida.' }
  if (toGoal > 0 && toGoal <= 3)
    return { text: `Faltam apenas ${toGoal.toFixed(1)}kg!`, sub: 'Você está na reta final. Não para agora.' }
  if (lost >= 5)
    return { text: `${lost.toFixed(1)}kg a menos desde o início.`, sub: 'Cada semana de consistência conta.' }
  if (weeks >= 8)
    return { text: `${weeks} semanas de protocolo.`, sub: 'Consistência é o maior diferencial. Parabéns.' }
  if (lost >= 2)
    return { text: `Você já perdeu ${lost.toFixed(1)}kg.`, sub: `Faltam ${toGoal.toFixed(1)}kg para a meta. Continue!` }
  if (weeks >= 2)
    return { text: `${weeks}ª semana de protocolo.`, sub: 'A dedicação já está trazendo resultados.' }
  if (lost > 0)
    return { text: `Primeiros ${lost.toFixed(1)}kg eliminados!`, sub: 'O começo é o mais difícil. Você passou por ele.' }
  if (days <= 3)
    return { text: 'Bem-vindo ao protocolo!', sub: 'Registre seu peso toda semana para acompanhar a evolução.' }
  return { text: 'Registre seu peso', sub: 'Para começar a ver sua evolução no gráfico.' }
}

export default function Dashboard({ profile, onNavigate, onUpdateProfile }: Props) {
  const lastWeight  = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const totalLost   = profile.startWeight - lastWeight
  const toGoal      = lastWeight - profile.goalWeight
  const hasGoal     = profile.startWeight !== profile.goalWeight
  const pct         = hasGoal ? Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.goalWeight)) * 100)) : 0
  const days        = daysSince(profile.startDate)
  const weeks       = weeksSince(profile.startDate)
  const imc         = calcIMC(lastWeight, profile.height)

  const lastDiary = (profile.diary ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))[0]

  // Janela de aplicação
  const lastApp       = profile.lastApplication
  const appDay        = profile.applicationDay
  const daysSinceApp  = lastApp ? daysSince(lastApp) : null
  const daysUntilNext = daysSinceApp != null ? Math.max(0, 7 - daysSinceApp) : null
  const appPct        = daysSinceApp != null ? Math.min(100, (daysSinceApp / 7) * 100) : 0
  const appToday      = daysUntilNext === 0

  const motivation = getMotivation(profile, totalLost, toGoal, weeks, days)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Saudação + motivação */}
      <div style={{ paddingTop: '4px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
          {weeks === 0 ? 'Início do protocolo' : `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} de protocolo`}
          {profile.medication ? ` · ${MEDICATION_LABELS[profile.medication]}` : ''}
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.15, margin: 0 }}>
          Olá, {profile.name} 👋
        </h1>

        {/* Mensagem motivacional */}
        <div style={{
          marginTop: '12px', padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary-light), transparent)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.3 }}>
            {motivation.text}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {motivation.sub}
          </p>
        </div>
      </div>

      {/* Hero card — peso */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
        borderRadius: '20px', padding: '20px',
        boxShadow: 'var(--shadow-green)', color: '#fff',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
          Peso atual
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
            {lastWeight}
            <span style={{ fontSize: '16px', opacity: 0.8, marginLeft: '3px' }}>kg</span>
          </p>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '20px', fontWeight: 800 }}>
              {totalLost > 0 ? '−' : totalLost < 0 ? '+' : ''}{Math.abs(totalLost).toFixed(1)}kg
            </p>
            <p style={{ fontSize: '11px', opacity: 0.65, fontWeight: 600 }}>perdido total</p>
          </div>
        </div>
        {hasGoal && (
          <>
            <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '99px', height: '5px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{
                width: `${pct}%`, height: '100%', background: '#fff', borderRadius: '99px',
                transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', opacity: 0.65, fontWeight: 600 }}>{profile.startWeight}kg inicial</span>
              <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: 700 }}>
                {toGoal <= 0 ? '🎉 Meta atingida!' : `Faltam ${toGoal.toFixed(1)}kg`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '5px' }}>IMC</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-1px' }}>
            {imc ? imc.toFixed(1) : '--'}
          </p>
          {imc && <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>{imcLabel(imc)}</p>}
        </div>
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '5px' }}>Dose atual</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-1px' }}>
            {profile.currentDose}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '2px' }}>mg</span>
          </p>
          <p style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '3px', fontWeight: 700 }}>
            {DOSE_PHASE[profile.currentDose] ?? ''}
          </p>
        </div>
      </div>

      {/* Janela de aplicação */}
      <div className="card" style={{ padding: '1rem 1.125rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lastApp ? '10px' : '0' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              💉 Próxima aplicação
            </p>
            <p style={{ fontSize: '12px', color: appToday ? 'var(--primary)' : 'var(--text-muted)', marginTop: '2px', fontWeight: appToday ? 700 : 400 }}>
              {lastApp
                ? appToday
                  ? `Hoje! ${appDay !== undefined ? `(${WEEK_DAYS_FULL[appDay]})` : ''}`
                  : `Em ${daysUntilNext} dia${daysUntilNext !== 1 ? 's' : ''}`
                : appDay !== undefined
                  ? `Toda ${WEEK_DAYS_FULL[appDay]}`
                  : 'Registre sua aplicação'}
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
          <div className="progress-track" style={{ height: '5px' }}>
            <div className="progress-fill" style={{
              width: `${appPct}%`,
              background: appPct > 85 ? 'linear-gradient(90deg, var(--primary), #F59E0B)' : undefined,
            }} />
          </div>
        )}
      </div>

      {/* Último diário */}
      {lastDiary && (
        <div className="card" style={{
          padding: '1rem 1.125rem', display: 'flex', alignItems: 'center', gap: '12px',
          background: 'linear-gradient(135deg, var(--primary-light), transparent)',
          border: '1px solid rgba(16,185,129,0.15)',
        }}>
          <span style={{ fontSize: '32px', flexShrink: 0 }}>{FEELING_EMOJI[lastDiary.feeling]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="label-base" style={{ marginBottom: '2px' }}>Última semana</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {lastDiary.dose}mg · {FEELING_LABEL[lastDiary.feeling]}
            </p>
            {lastDiary.notes && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {lastDiary.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Calendário de aplicações */}
      {appDay !== undefined && (
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '14px' }}>
            📅 Calendário de Aplicações
          </p>
          <ApplicationCalendar profile={profile} onUpdateProfile={onUpdateProfile} />
        </div>
      )}

      {/* Ações rápidas */}
      <div>
        <p className="label-base" style={{ marginBottom: '8px' }}>Acesso rápido</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {([
            { icon: '⚖️', title: 'Peso',     sub: 'Registrar',  tab: 'progress'   },
            { icon: '💉', title: 'Calcular', sub: 'Dose',       tab: 'calculator' },
            { icon: '🌿', title: 'Saúde',    sub: 'Guias',      tab: 'health'     },
          ] as const).map(a => (
            <button
              key={a.tab}
              className="card"
              onClick={() => onNavigate(a.tab)}
              style={{ textAlign: 'center', padding: '1rem 0.5rem', cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span style={{ fontSize: '20px', display: 'block', marginBottom: '5px' }}>{a.icon}</span>
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
