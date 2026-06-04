import { UserProfile } from '../types'

interface Achievement {
  id: string; icon: string; title: string; description: string; unlocked: boolean
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
}

function build(profile: UserProfile): Achievement[] {
  const days   = daysSince(profile.startDate)
  const lastW  = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const lost   = profile.startWeight - lastW
  const entries = profile.weightHistory.length
  const reachedGoal = lastW <= profile.goalWeight && profile.goalWeight < profile.startWeight

  return [
    { id: 'start',   icon: '🚀', title: 'Primeiro passo',  description: 'Configurou o perfil',      unlocked: !!profile.name },
    { id: 'week1',   icon: '📅', title: '1ª semana',       description: '7 dias em protocolo',      unlocked: days >= 7 },
    { id: 'month1',  icon: '🗓️', title: '1 mês',           description: '30 dias em protocolo',     unlocked: days >= 30 },
    { id: 'month2',  icon: '🏅', title: '2 meses',         description: '60 dias em protocolo',     unlocked: days >= 60 },
    { id: 'track3',  icon: '📊', title: 'Comprometido',    description: '3 registros de peso',      unlocked: entries >= 3 },
    { id: 'lost2',   icon: '⚖️', title: '2kg a menos',     description: 'Primeiros 2kg perdidos',   unlocked: lost >= 2 },
    { id: 'lost5',   icon: '🔥', title: '5kg a menos',     description: '5kg perdidos',             unlocked: lost >= 5 },
    { id: 'lost10',  icon: '💪', title: '10kg a menos',    description: '10kg perdidos',            unlocked: lost >= 10 },
    { id: 'goal',    icon: '🎯', title: 'Meta atingida!',  description: 'Chegou ao peso desejado',  unlocked: reachedGoal },
  ]
}

export default function Achievements({ profile }: { profile: UserProfile }) {
  const list     = build(profile)
  const unlocked = list.filter(a => a.unlocked).length

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Conquistas</p>
        <span className="badge badge-green">{unlocked}/{list.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {list.map(a => (
          <div
            key={a.id}
            title={a.description}
            style={{
              padding: '12px 6px 10px',
              borderRadius: '12px',
              textAlign: 'center',
              border: `1.5px solid ${a.unlocked ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              background: a.unlocked
                ? 'linear-gradient(135deg, var(--primary-light), var(--accent-light))'
                : 'var(--surface-2)',
              opacity: a.unlocked ? 1 : 0.4,
              transition: 'all 0.2s',
              boxShadow: a.unlocked ? '0 0 12px var(--primary-glow)' : 'none',
            }}
          >
            <div style={{
              fontSize: '26px', marginBottom: '5px',
              filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.5)',
              transition: 'filter 0.3s',
            }}>
              {a.icon}
            </div>
            <p style={{
              fontSize: '10px', fontWeight: 700, lineHeight: 1.3,
              color: a.unlocked ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {a.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
