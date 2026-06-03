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
        borderBottom: '1px solid rgba(16,185,129,0.2)',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'background 0.3s ease',
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        flexShrink: 0,
        borderRadius: '10px',
        background: 'rgba(16,185,129,0.15)',
        border: '1.5px solid rgba(16,185,129,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}>
        📈
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.3px',
          lineHeight: 1.1,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          TizeTrack
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.45)',
          marginTop: '2px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '0.02em',
        }}>
          Acompanhamento de protocolo
        </div>
      </div>

      <DarkModeToggle isDark={isDark} onToggle={onToggle} />
    </header>
  )
}
