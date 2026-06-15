import DarkModeToggle from './DarkModeToggle'
import { UserProfile } from '../types'

interface Props {
  isDark: boolean
  onToggle: () => void
  profile?: UserProfile
  onProfileClick?: () => void
  onLogout?: () => void
}

export default function Header({ isDark, onToggle, profile, onProfileClick, onLogout }: Props) {
  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="app-header">
      {/* Logo */}
      <img
        src="/LogoPng.png"
        alt="Minha Tize"
        style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, objectFit: 'contain' }}
      />

      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: '17px', fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px', lineHeight: 1, margin: 0,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          Minha Tize
        </h1>
      </div>

      {/* Sair */}
      {onLogout && (
        <button
          onClick={onLogout}
          title="Sair"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '10px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '12px', fontWeight: 700,
            fontFamily: 'Inter, -apple-system, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF444440' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      )}

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
