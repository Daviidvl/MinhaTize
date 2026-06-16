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
        style={{
          width: '48px', height: '48px', borderRadius: '13px',
          flexShrink: 0, objectFit: 'contain',
        }}
      />

      {/* Marca */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: '16px', fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.4px', lineHeight: 1, margin: 0,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          Minha Tize
        </h1>
      </div>

      {/* Dark mode toggle */}
      <DarkModeToggle isDark={isDark} onToggle={onToggle} />

      {/* Botão Sair */}
      {onLogout && (
        <button
          onClick={onLogout}
          title="Sair"
          aria-label="Sair"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 11px', borderRadius: '10px',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-2)',
            cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '11px', fontWeight: 700,
            fontFamily: 'Inter, -apple-system, sans-serif',
            transition: 'all 0.18s ease',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#EF4444'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'
            e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'var(--border-strong)'
            e.currentTarget.style.background = 'var(--surface-2)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      )}

      {/* Avatar do usuário */}
      {profile && onProfileClick && (
        <button
          onClick={onProfileClick}
          aria-label="Perfil"
          style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            border: '2px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 800, color: '#fff',
            cursor: 'pointer', letterSpacing: '-0.3px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            boxShadow: '0 2px 10px rgba(37,99,235,0.28)',
            transition: 'transform 0.15s var(--ease-spring), box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.10)'
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(37,99,235,0.45)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.28)'
          }}
        >
          {initials}
        </button>
      )}
    </header>
  )
}
