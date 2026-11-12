import { UserProfile } from '../types'
import { readConsent, revokeConsent } from '../utils/consent'
import { exportAllData } from '../utils/dataExport'
import { SubHeader } from './ProfileShared'

// Legal & Privacidade: consentimento registrado, aviso médico e os direitos da
// LGPD (exportar dados, solicitar por e-mail e revogar o consentimento).

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: '10px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function ConsentInfo() {
  const consent = readConsent()
  const version = consent?.version ?? '—'
  const date = consent?.date
    ? new Date(consent.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Não registrado'
  return (
    <div style={{ padding: '14px 16px', background: 'var(--teal-l)', border: '1px solid var(--teal)', borderRadius: '12px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Consentimento registrado
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Data:</strong> {date}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Versão:</strong> {version}
        </p>
      </div>
    </div>
  )
}

export default function ProfileLegal({ profile, onBack }: { profile: UserProfile; onBack: () => void }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <SubHeader title="Legal & Privacidade" onBack={onBack} />
      <ConsentInfo />

      <div style={{ padding: '14px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-line)', borderRadius: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger-text)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aviso Médico</p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>
          O MinhaTize é <strong style={{ color: 'var(--text-primary)' }}>exclusivamente educativo</strong>. Não realiza diagnósticos, não prescreve medicamentos e não substitui o acompanhamento médico ou nutricional.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <InfoRow label="Versão dos Termos" value="1.0 — Junho/2026" />
        <InfoRow label="Controlador dos dados" value="MinhaTize" />
        <InfoRow label="Contato de privacidade" value="privacidade@minhatize.com.br" />
      </div>

      <div className="card">
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Exportar meus dados</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '14px' }}>Baixe todos os seus dados em formato JSON (portabilidade — Art. 18, V da LGPD).</p>
        <button onClick={() => exportAllData(profile)} style={{
          width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
          background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>Baixar dados (JSON)</button>
      </div>

      <div className="card">
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Seus direitos (Art. 18 LGPD)</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '14px' }}>Você pode solicitar: acesso, correção, exclusão, portabilidade ou revogação do consentimento.</p>
        <a href="mailto:privacidade@minhatize.com.br?subject=Exercício%20de%20direitos%20LGPD" style={{
          display: 'block', textAlign: 'center', padding: '11px',
          background: 'var(--primary-light)', borderRadius: '10px',
          color: 'var(--primary)', fontWeight: 700, fontSize: '13px',
          textDecoration: 'none', border: '1px solid var(--sky)',
        }}>Enviar solicitação por e-mail</a>
      </div>

      <div className="card" style={{ border: '1px solid var(--red-line)' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)', marginBottom: '6px' }}>Revogar consentimento</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
          Ao revogar, seus dados locais serão apagados e você precisará aceitar os termos novamente.
        </p>
        <button onClick={() => {
          revokeConsent()
          window.location.reload()
        }} style={{
          width: '100%', padding: '11px', borderRadius: '10px',
          border: '1.5px solid var(--red-line)', background: 'transparent',
          color: 'var(--red)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>Revogar e apagar dados</button>
      </div>
    </div>
  )
}
