import type { LegalDoc } from './LegalPage'

interface Props {
  onLegal: (doc: LegalDoc) => void
}

const LINKS: { id: LegalDoc; label: string }[] = [
  { id: 'termos',       label: 'Termos de Uso'     },
  { id: 'privacidade',  label: 'Privacidade'        },
  { id: 'disclaimer',   label: 'Aviso Médico'       },
  { id: 'cancelamento', label: 'Cancelamento'       },
  { id: 'cookies',      label: 'Armazenamento'      },
]

export default function Footer({ onLegal }: Props) {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '20px 20px 28px',
      background: 'var(--bg)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Aviso educativo */}
        <p style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.25)',
          lineHeight: 1.6, marginBottom: '14px', textAlign: 'center',
        }}>
          Plataforma educativa. Não substitui orientação médica, farmacêutica ou nutricional.
          Medicamentos requerem prescrição. Sem garantia de resultados.
        </p>

        {/* Links legais */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px 16px',
          justifyContent: 'center', marginBottom: '12px',
        }}>
          {LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => onLegal(link.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: '11px', color: 'rgba(255,255,255,0.28)',
                fontFamily: 'Inter, sans-serif',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(255,255,255,0.1)',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        <p style={{
          fontSize: '10px', color: 'rgba(255,255,255,0.15)',
          textAlign: 'center', margin: 0,
        }}>
          &copy; {new Date().getFullYear()} MinhaTize &middot; Produto digital &middot; v1.0
        </p>
      </div>
    </footer>
  )
}
