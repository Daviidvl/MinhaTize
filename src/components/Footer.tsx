import type { LegalDoc } from './LegalPage'

interface Props {
  onLegal: (doc: LegalDoc) => void
}

const LINKS: { id: LegalDoc; label: string }[] = [
  { id: 'termos',       label: 'Termos de Uso'  },
  { id: 'privacidade',  label: 'Privacidade'     },
  { id: 'disclaimer',   label: 'Aviso Médico'    },
  { id: 'cancelamento', label: 'Cancelamento'    },
  { id: 'cookies',      label: 'Armazenamento'   },
]

export default function Footer({ onLegal }: Props) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '16px 0 12px',
      background: 'var(--bg)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <p style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.6, marginBottom: '10px', textAlign: 'center' }}>
        Plataforma educativa. Não substitui orientação médica ou nutricional.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', justifyContent: 'center', marginBottom: '10px' }}>
        {LINKS.map(link => (
          <button
            key={link.id}
            onClick={() => onLegal(link.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: '11px', color: 'var(--text-faint)',
              fontFamily: 'Inter, sans-serif',
              textDecoration: 'underline',
              textDecorationColor: 'var(--border)',
            }}
          >{link.label}</button>
        ))}
      </div>

      <p style={{ fontSize: '10px', color: 'var(--text-faint)', textAlign: 'center', margin: 0 }}>
        &copy; {new Date().getFullYear()} MinhaTize &middot; v1.0
      </p>
    </footer>
  )
}
