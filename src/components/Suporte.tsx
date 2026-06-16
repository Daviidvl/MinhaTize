export default function Suporte() {
  function openWhatsApp() {
    window.open('https://wa.me/5588988583366', '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

      <div style={{ marginBottom: '4px' }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.3px',
        }}>
          Central de Suporte
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          Estamos aqui para ajudar você
        </p>
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.99 2C6.476 2 2 6.477 2 11.99c0 1.872.518 3.621 1.418 5.12L2.018 22l5.005-1.388A9.944 9.944 0 0011.99 22C17.523 22 22 17.523 22 11.99 22 6.477 17.523 2 11.99 2zm0 18.18a8.14 8.14 0 01-4.152-1.133l-.297-.177-3.086.856.87-3.018-.193-.31A8.165 8.165 0 013.82 11.99c0-4.51 3.66-8.17 8.17-8.17 4.512 0 8.172 3.66 8.172 8.17 0 4.511-3.66 8.19-8.172 8.19z"/>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{
            margin: 0, fontSize: '16px', fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.2px',
          }}>
            Precisa de ajuda?
          </p>
          <p style={{
            margin: 0, fontSize: '14px', lineHeight: '1.55',
            color: 'var(--text-muted)', maxWidth: '280px',
          }}>
            Está com alguma dúvida ou precisa de ajuda? Entre em contato com nossa equipe.
          </p>
        </div>

        <button
          onClick={openWhatsApp}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '15px 20px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: '#fff', border: 'none', borderRadius: '14px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'opacity 0.15s, transform 0.12s',
            boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.99 2C6.476 2 2 6.477 2 11.99c0 1.872.518 3.621 1.418 5.12L2.018 22l5.005-1.388A9.944 9.944 0 0011.99 22C17.523 22 22 17.523 22 11.99 22 6.477 17.523 2 11.99 2zm0 18.18a8.14 8.14 0 01-4.152-1.133l-.297-.177-3.086.856.87-3.018-.193-.31A8.165 8.165 0 013.82 11.99c0-4.51 3.66-8.17 8.17-8.17 4.512 0 8.172 3.66 8.172 8.17 0 4.511-3.66 8.19-8.172 8.19z"/>
          </svg>
          Falar com o suporte
        </button>
      </div>

    </div>
  )
}
