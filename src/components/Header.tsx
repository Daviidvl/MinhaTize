import DarkModeToggle from './DarkModeToggle'
import { UserProfile } from '../types'

interface Props {
  isDark: boolean
  onToggle: () => void
  profile?: UserProfile
  onProfileClick?: () => void
}

export default function Header({ isDark, onToggle, profile, onProfileClick }: Props) {
  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="app-header">
      {/* Logo */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(124,58,237,0.2) 100%)',
        border: '1px solid rgba(16,185,129,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '17px',
        boxShadow: '0 2px 12px rgba(16,185,129,0.2)',
      }}>
        📈
      </div>

      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: '17px', fontWeight: 800, color: '#FFFFFF',
          letterSpacing: '-0.5px', lineHeight: 1, margin: 0,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          TizeTrack
        </h1>
        <p style={{
          fontSize: '10px', color: 'rgba(255,255,255,0.35)',
          marginTop: '2px', fontWeight: 500,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Acompanhamento de protocolo
        </p>
      </div>

      {/* Dark mode toggle */}
      <DarkModeToggle isDark={isDark} onToggle={onToggle} />

      {/* Avatar do usuário */}
      {profile && onProfileClick && (
        <button
          onClick={onProfileClick}
          aria-label="Perfil"
          style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #059669, #7C3AED)',
            border: '2px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 800, color: '#fff',
            cursor: 'pointer', letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: '0 2px 8px rgba(5,150,105,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        >
          {initials}
        </button>
      )}
    </header>
  )
}
