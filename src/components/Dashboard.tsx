import { UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onNavigate: (tab: 'progress' | 'calculator') => void
}

function calcIMC(weight: number, height: number): string {
  if (!height || !weight) return '--'
  const imc = weight / ((height / 100) ** 2)
  return imc.toFixed(1)
}

function imcLabel(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso'
  if (imc < 25) return 'Peso normal'
  if (imc < 30) return 'Sobrepeso'
  if (imc < 35) return 'Obesidade grau I'
  if (imc < 40) return 'Obesidade grau II'
  return 'Obesidade grau III'
}

function weeksSince(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
}

export default function Dashboard({ profile, onNavigate }: Props) {
  const lastWeight = profile.weightHistory.length > 0
    ? profile.weightHistory[profile.weightHistory.length - 1].weight
    : profile.startWeight

  const totalLost = profile.startWeight - lastWeight
  const toGoal = lastWeight - profile.goalWeight
  const progressPct = Math.min(100, Math.max(0,
    ((profile.startWeight - lastWeight) / (profile.startWeight - profile.goalWeight)) * 100
  ))
  const weeks = weeksSince(profile.startDate)
  const imcVal = parseFloat(calcIMC(lastWeight, profile.height))
  const hasGoal = profile.startWeight !== profile.goalWeight

  return (
    <div className="space-y-6 fade-in">
      {/* Saudação */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Olá{profile.name ? `, ${profile.name}` : ''}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          {weeks === 0 ? 'Bem-vindo ao seu protocolo' : `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} em protocolo`}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Peso atual</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
            {lastWeight}<span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>kg</span>
          </p>
        </div>

        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Total perdido</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: totalLost > 0 ? 'var(--primary)' : 'var(--text-muted)', lineHeight: 1 }}>
            {totalLost > 0 ? '-' : ''}{Math.abs(totalLost).toFixed(1)}<span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>kg</span>
          </p>
        </div>

        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>IMC atual</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
            {isNaN(imcVal) ? '--' : imcVal}
          </p>
          {!isNaN(imcVal) && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
              {imcLabel(imcVal)}
            </p>
          )}
        </div>

        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Dose atual</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {profile.currentDose}<span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>mg</span>
          </p>
        </div>
      </div>

      {/* Progresso para a meta */}
      {hasGoal && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              Progresso para a meta
            </p>
            <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>
              {progressPct.toFixed(0)}%
            </p>
          </div>

          <div style={{ background: 'var(--surface-2)', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              borderRadius: '99px',
              transition: 'width 0.6s ease',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Início: {profile.startWeight}kg
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {toGoal > 0 ? `Faltam ${toGoal.toFixed(1)}kg` : 'Meta atingida! 🎉'}
            </p>
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          className="card"
          onClick={() => onNavigate('progress')}
          style={{ textAlign: 'left', cursor: 'pointer', border: '1.5px solid var(--border)', transition: 'border-color 0.2s' }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚖️</div>
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Registrar peso</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Ver evolução</p>
        </button>

        <button
          className="card"
          onClick={() => onNavigate('calculator')}
          style={{ textAlign: 'left', cursor: 'pointer', border: '1.5px solid var(--border)', transition: 'border-color 0.2s' }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💉</div>
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Calcular dose</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Seringa de insulina</p>
        </button>
      </div>

      {/* Aviso se não configurou perfil */}
      {!profile.name && (
        <div className="card-warning">
          <p style={{ fontSize: '13px', color: 'var(--warn-text)', fontWeight: 600 }}>
            💡 Configure seu perfil para ver estatísticas completas e acompanhar sua evolução.
          </p>
        </div>
      )}
    </div>
  )
}
