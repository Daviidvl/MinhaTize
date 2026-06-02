import DarkModeToggle from './DarkModeToggle'

interface Props {
  isDark: boolean
  onToggle: () => void
}

export default function Header({ isDark, onToggle }: Props) {
  return (
    <header
      className="header-safe sticky top-0 z-50"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '2.5px solid var(--gold)',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'background 0.3s ease',
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        flexShrink: 0,
        borderRadius: '50%',
        border: '2px solid var(--gold)',
        background: '#fff',
        padding: '3px',
        overflow: 'hidden',
      }}>
        <img
          src="/icon-192.png"
          alt="Minha Tize"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 800,
          color: 'var(--header-text)',
          letterSpacing: '-0.3px',
          lineHeight: 1.1,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: 'color 0.3s ease',
        }}>
          Minha Tize
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--header-sub)',
          marginTop: '2px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: 'color 0.3s ease',
        }}>
          Calculadora de dose com seringa de insulina
        </div>
      </div>

      <DarkModeToggle isDark={isDark} onToggle={onToggle} />
    </header>
  )
}
