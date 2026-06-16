import { useState } from 'react'
import { validateToken, saveToken, extractToken } from '../utils/token'

interface Props {
  onAccessGranted: () => void
  onLegal?: (doc: string) => void
}

export default function LoginScreen({ onAccessGranted, onLegal }: Props) {
  const [value, setValue]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = extractToken(value)
    if (!token || token.length < 8) {
      setError('Cole o link ou token recebido no e-mail.')
      return
    }
    setLoading(true)
    setError('')
    const valid = await validateToken(token)
    setLoading(false)
    if (valid) {
      saveToken(token)
      onAccessGranted()
    } else {
      setError('Token inválido ou expirado. Verifique o e-mail e tente novamente.')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        padding: '36px 28px 32px',
        boxShadow: '0 8px 40px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.04)',
      }}>

        {/* Logo + título */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/LogoPng.png"
            alt="Minha Tize"
            style={{
              width: '68px', height: '68px',
              borderRadius: '20px',
              objectFit: 'contain',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(37,99,235,0.18)',
            }}
          />
          <h1 style={{
            fontSize: '22px', fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
            letterSpacing: '-0.5px',
          }}>
            Minha Tize
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Cole o link de acesso recebido no e-mail
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Input */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <input
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              placeholder="Cole aqui o link ou token..."
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 14px 14px 42px',
                borderRadius: '14px',
                border: `1.5px solid ${error ? 'var(--error)' : 'var(--border)'}`,
                background: 'var(--surface-2)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'Inter, -apple-system, sans-serif',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => {
                if (!error) e.currentTarget.style.borderColor = 'var(--primary)'
              }}
              onBlur={e => {
                if (!error) e.currentTarget.style.borderColor = 'var(--border)'
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{
              fontSize: '13px', color: 'var(--error)',
              margin: 0, display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </p>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !value.trim()}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !value.trim() ? 0.6 : 1,
              fontFamily: 'Inter, -apple-system, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
                Verificando...
              </>
            ) : (
              <>
                Acessar
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <p style={{
          marginTop: '24px', marginBottom: 0,
          fontSize: '12px', color: 'var(--text-muted)',
          textAlign: 'center', lineHeight: 1.6,
        }}>
          Não recebeu o e-mail? Verifique a caixa de spam<br />ou entre em contato com o suporte.
        </p>
      </div>

      {/* Links legais */}
      {onLegal && (
        <div style={{
          marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { id: 'termos', label: 'Termos de Uso' },
            { id: 'privacidade', label: 'Privacidade' },
            { id: 'disclaimer', label: 'Aviso Médico' },
            { id: 'cancelamento', label: 'Cancelamento' },
          ].map(link => (
            <button
              key={link.id}
              onClick={() => onLegal(link.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: '11px', color: 'rgba(255,255,255,0.28)',
                fontFamily: 'Inter, sans-serif',
                textDecoration: 'underline',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
