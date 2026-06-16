export default function Atendimento() {
  function openWhatsApp(message: string) {
    const url = `https://wa.me/5588988583366?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
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
          Atendimento Especializado
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          Fale diretamente com nossa equipe de saúde
        </p>
      </div>

      {/* Card Nutricionista */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.95)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
              <path d="M8 12s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
              Nutricionista
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Plano alimentar personalizado
            </p>
          </div>
        </div>

        <p style={{
          margin: 0, fontSize: '14px', lineHeight: '1.55',
          color: 'var(--text-secondary, var(--text-muted))',
        }}>
          Precisa de um plano alimentar personalizado ou deseja agendar uma consulta? Entre em contato com nossa nutricionista.
        </p>

        <button
          onClick={() => openWhatsApp('Olá! Gostaria de agendar uma consulta com a nutricionista.')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '14px 20px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'opacity 0.15s, transform 0.12s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.99 2C6.476 2 2 6.477 2 11.99c0 1.872.518 3.621 1.418 5.12L2.018 22l5.005-1.388A9.944 9.944 0 0011.99 22C17.523 22 22 17.523 22 11.99 22 6.477 17.523 2 11.99 2zm0 18.18a8.14 8.14 0 01-4.152-1.133l-.297-.177-3.086.856.87-3.018-.193-.31A8.165 8.165 0 013.82 11.99c0-4.51 3.66-8.17 8.17-8.17 4.512 0 8.172 3.66 8.172 8.17 0 4.511-3.66 8.19-8.172 8.19z"/>
          </svg>
          Falar com a Nutricionista
        </button>
      </div>

      {/* Card Educador Físico */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.95)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4v16M18 4v16M8 4h8M8 20h8M8 12h8"/>
              <circle cx="6" cy="4" r="1" fill="rgba(255,255,255,0.95)" stroke="none"/>
              <circle cx="6" cy="20" r="1" fill="rgba(255,255,255,0.95)" stroke="none"/>
              <circle cx="18" cy="4" r="1" fill="rgba(255,255,255,0.95)" stroke="none"/>
              <circle cx="18" cy="20" r="1" fill="rgba(255,255,255,0.95)" stroke="none"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
              Educador Físico
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Ficha de treino personalizada
            </p>
          </div>
        </div>

        <p style={{
          margin: 0, fontSize: '14px', lineHeight: '1.55',
          color: 'var(--text-secondary, var(--text-muted))',
        }}>
          Deseja uma ficha de treino personalizada ou atualizar seu plano atual? Entre em contato com nosso educador físico.
        </p>

        <button
          onClick={() => openWhatsApp('Olá! Gostaria de solicitar uma nova ficha de treino com o educador físico.')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '14px 20px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'opacity 0.15s, transform 0.12s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.99 2C6.476 2 2 6.477 2 11.99c0 1.872.518 3.621 1.418 5.12L2.018 22l5.005-1.388A9.944 9.944 0 0011.99 22C17.523 22 22 17.523 22 11.99 22 6.477 17.523 2 11.99 2zm0 18.18a8.14 8.14 0 01-4.152-1.133l-.297-.177-3.086.856.87-3.018-.193-.31A8.165 8.165 0 013.82 11.99c0-4.51 3.66-8.17 8.17-8.17 4.512 0 8.172 3.66 8.172 8.17 0 4.511-3.66 8.19-8.172 8.19z"/>
          </svg>
          Solicitar nova ficha de treino
        </button>
      </div>

    </div>
  )
}
