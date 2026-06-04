import { UserProfile } from '../types'

interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
}

function daysSince(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function buildAchievements(profile: UserProfile): Achievement[] {
  const days = daysSince(profile.startDate)
  const lastWeight = profile.weightHistory.length > 0
    ? profile.weightHistory[profile.weightHistory.length - 1].weight
    : profile.startWeight
  const lost = profile.startWeight - lastWeight
  const entries = profile.weightHistory.length
  const reachedGoal = lastWeight <= profile.goalWeight

  return [
    {
      id: 'start',
      icon: '🚀',
      title: 'Primeiro passo',
      description: 'Configurou seu perfil',
      unlocked: !!profile.name,
    },
    {
      id: 'week1',
      icon: '📅',
      title: '1ª semana',
      description: '7 dias em protocolo',
      unlocked: days >= 7,
    },
    {
      id: 'month1',
      icon: '🗓️',
      title: '1 mês',
      description: '30 dias em protocolo',
      unlocked: days >= 30,
    },
    {
      id: 'month2',
      icon: '🏅',
      title: '2 meses',
      description: '60 dias em protocolo',
      unlocked: days >= 60,
    },
    {
      id: 'entries3',
      icon: '📊',
      title: 'Comprometido',
      description: '3 registros de peso',
      unlocked: entries >= 3,
    },
    {
      id: 'lost2',
      icon: '⚖️',
      title: '2kg a menos',
      description: 'Perdeu os primeiros 2kg',
      unlocked: lost >= 2,
    },
    {
      id: 'lost5',
      icon: '🔥',
      title: '5kg a menos',
      description: 'Perdeu 5kg no protocolo',
      unlocked: lost >= 5,
    },
    {
      id: 'lost10',
      icon: '💪',
      title: '10kg a menos',
      description: 'Perdeu 10kg no protocolo',
      unlocked: lost >= 10,
    },
    {
      id: 'goal',
      icon: '🎯',
      title: 'Meta atingida!',
      description: 'Chegou ao peso desejado',
      unlocked: reachedGoal && profile.goalWeight < profile.startWeight,
    },
  ]
}

interface Props {
  profile: UserProfile
}

export default function Achievements({ profile }: Props) {
  const achievements = buildAchievements(profile)
  const unlocked = achievements.filter(a => a.unlocked).length

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
          Conquistas
        </p>
        <span style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--primary)',
          background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '99px',
        }}>
          {unlocked}/{achievements.length}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {achievements.map(a => (
          <div
            key={a.id}
            title={a.description}
            style={{
              padding: '12px 6px',
              borderRadius: '12px',
              border: `1.5px solid ${a.unlocked ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              background: a.unlocked ? 'var(--primary-light)' : 'var(--surface-2)',
              textAlign: 'center',
              opacity: a.unlocked ? 1 : 0.45,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px', filter: a.unlocked ? 'none' : 'grayscale(1)' }}>
              {a.icon}
            </div>
            <p style={{
              fontSize: '10px', fontWeight: 700, color: a.unlocked ? 'var(--primary-dark)' : 'var(--text-muted)',
              lineHeight: 1.3,
            }}>
              {a.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
