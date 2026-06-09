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
      {/* Logo mark */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(37,99,235,0.30)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      </div>

      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: '17px', fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px', lineHeight: 1, margin: 0,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          TizeTrack
        </h1>
        <p style={{
          fontSize: '10px', color: 'var(--text-muted)',
          marginTop: '2px', fontWeight: 500,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          Acompanhamento de protocolo
        </p>
      </div>

      {/* Dark mode toggle */}
      <DarkModeToggle isDark={isDark} onToggle={onToggle} />

      {/* User avatar */}
      {profile && onProfileClick && (
        <button
          onClick={onProfileClick}
          aria-label="Perfil"
          style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 800, color: '#fff',
            cursor: 'pointer', letterSpacing: '-0.3px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            boxShadow: '0 2px 10px rgba(37,99,235,0.30)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.45)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.30)'
          }}
        >
          {initials}
        </button>
      )}
    </header>
  )
}
