import { Info } from 'lucide-react'

export default function Footer() {
  return (
    <footer
      className="mt-16"
      style={{ borderTop: '1px solid var(--border)', transition: 'border-color 0.3s ease' }}
    >
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="card-warning">
          <h3
            className="font-700 text-sm mb-2"
            style={{ color: 'var(--warn-text)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, -apple-system, sans-serif' }}
          >
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
            Aviso Legal Importante
          </h3>
          <p
            className="text-xs font-jakarta leading-relaxed"
            style={{ color: 'var(--warn-text)' }}
          >
            Esta ferramenta possui finalidade exclusivamente educativa e informativa. Os
            resultados apresentados são estimativas matemáticas baseadas nos dados
            informados pelo usuário. Qualquer ajuste de dose deve ser realizado com
            acompanhamento médico. TizeTrack não substitui orientação médica,
            farmacêutica ou nutricional.
          </p>
        </div>

        <div
          className="flex items-center justify-between text-[11px] font-jakarta"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>© 2026 TizeTrack. Todos os direitos reservados.</span>
          <span>v2.0.0 · Junho 2026</span>
        </div>
      </div>
    </footer>
  )
}
