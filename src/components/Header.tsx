import DarkModeToggle from './DarkModeToggle'

interface Props {
  isDark: boolean
  onToggle: () => void
}

export default function Header({ isDark, onToggle }: Props) {
  return (
    <header className="app-header">
      {/* Logo */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(124,58,237,0.2) 100%)',
        border: '1px solid rgba(16,185,129,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '19px',
        boxShadow: '0 2px 12px rgba(16,185,129,0.2)',
      }}>
        📈
      </div>

      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: '18px', fontWeight: 800, color: '#FFFFFF',
          letterSpacing: '-0.5px', lineHeight: 1, margin: 0,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          TizeTrack
        </h1>
        <p style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.38)',
          marginTop: '2px', fontWeight: 500,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Acompanhamento de protocolo
        </p>
      </div>

      <DarkModeToggle isDark={isDark} onToggle={onToggle} />
    </header>
  )
}
