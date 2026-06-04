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
        borderBottom: '1px solid rgba(16,185,129,0.15)',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 0 rgba(16,185,129,0.1), 0 4px 20px rgba(0,0,0,0.25)',
        transition: 'background 0.3s ease',
      }}
    >
      <div style={{
        width: '38px', height: '38px', flexShrink: 0,
        borderRadius: '10px',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(99,102,241,0.15))',
        border: '1px solid rgba(16,185,129,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px',
      }}>
        📈
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '17px', fontWeight: 800, color: '#FFFFFF',
          letterSpacing: '-0.4px', lineHeight: 1.1,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          TizeTrack
        </div>
        <div style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.4)',
          marginTop: '1px', fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '0.01em',
        }}>
          Acompanhamento de protocolo
        </div>
      </div>

      <DarkModeToggle isDark={isDark} onToggle={onToggle} />
    </header>
  )
}
