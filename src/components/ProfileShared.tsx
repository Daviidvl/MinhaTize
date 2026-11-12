import { ChevronLeft, ChevronRight } from 'lucide-react'

// Peças comuns às telas do Perfil (lista estilo iOS Settings, cabeçalho com
// Voltar e contato por WhatsApp).

// ── WhatsApp da equipe ────────────────────────────────────────────────────────
const WA = '5588988583366'

export function openWA(msg?: string) {
  const url = msg ? `https://wa.me/${WA}?text=${encodeURIComponent(msg)}` : `https://wa.me/${WA}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M11.99 2C6.476 2 2 6.477 2 11.99c0 1.872.518 3.621 1.418 5.12L2.018 22l5.005-1.388A9.944 9.944 0 0011.99 22C17.523 22 22 17.523 22 11.99 22 6.477 17.523 2 11.99 2zm0 18.18a8.14 8.14 0 01-4.152-1.133l-.297-.177-3.086.856.87-3.018-.193-.31A8.165 8.165 0 013.82 11.99c0-4.51 3.66-8.17 8.17-8.17 4.512 0 8.172 3.66 8.172 8.17 0 4.511-3.66 8.19-8.172 8.19z"/>
    </svg>
  )
}

// ── Lista ─────────────────────────────────────────────────────────────────────
export function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px', padding: '0 2px',
    }}>{children}</p>
  )
}

export function LGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

export function LDivider() {
  return <div style={{ height: '1px', background: 'var(--border)', margin: '0 16px 0 62px' }} />
}

export function LRow({ iconBg, icon, label, badge, value, onClick }: {
  iconBg: string; icon: React.ReactNode; label: string
  badge?: string; value?: React.ReactNode; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 14px', background: 'transparent', border: 'none',
      cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left',
    }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--primary)',
          background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '99px',
        }}>{badge}</span>
      )}
      {value && !badge && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{value}</span>
      )}
      <ChevronRight size={15} style={{ color: 'var(--text-faint)', flexShrink: 0, marginLeft: '2px' }} />
    </button>
  )
}

// ── Cabeçalho das subtelas ────────────────────────────────────────────────────
export function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={onBack} style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)',
      }}><ChevronLeft size={16} strokeWidth={1.75} /></button>
      <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
    </div>
  )
}
