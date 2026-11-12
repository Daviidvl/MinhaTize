import { Check } from 'lucide-react'

// Peças de formulário comuns à avaliação de platô e ao assistente de hábitos.

export function RadioBtn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
      borderRadius: '12px', border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-strong)'}`,
      background: selected ? 'var(--primary-light)' : 'var(--surface)',
      color: selected ? 'var(--primary)' : 'var(--text-secondary)',
      fontWeight: selected ? 700 : 500, fontSize: '14px',
      fontFamily: "Inter, -apple-system, sans-serif",
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-strong)'}`,
        background: selected ? 'var(--primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
      </span>
      {label}
    </button>
  )
}

export function CheckBtn({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width: '100%', padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
      borderRadius: '12px', border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
      background: checked ? 'var(--primary-light)' : 'var(--surface)',
      color: checked ? 'var(--primary)' : 'var(--text-secondary)',
      fontWeight: checked ? 700 : 500, fontSize: '13px',
      fontFamily: "Inter, -apple-system, sans-serif",
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{
        width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
        border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-strong)'}`,
        background: checked ? 'var(--primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
      }}>
        {checked && <Check size={10} strokeWidth={2.5} />}
      </span>
      {label}
    </button>
  )
}

export function StepHeader({ title, subtitle, stepNum, totalSteps }: {
  title: string; subtitle?: string; stepNum?: number; totalSteps?: number
}) {
  return (
    <div>
      {stepNum != null && totalSteps != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1, height: '4px', borderRadius: '99px', background: 'var(--mist)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px', background: 'var(--g-progress)',
              width: `${(stepNum / totalSteps) * 100}%`, transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {stepNum} de {totalSteps}
          </span>
        </div>
      )}
      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>{subtitle}</p>}
    </div>
  )
}

export function NextBtn({ onClick, disabled = false, label = 'Continuar →' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary" style={{ width: '100%', marginTop: '4px' }}>
      {label}
    </button>
  )
}
