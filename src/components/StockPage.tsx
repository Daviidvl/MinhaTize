import { useState } from 'react'
import { StockInfo, UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

export default function StockPage({ profile, onUpdateProfile }: Props) {
  const stock = profile.stock
  const dose  = profile.currentDose

  const [form, setForm] = useState({
    amouleMg:     stock?.amouleMg.toString()     ?? '',
    ampouleML:    stock?.ampouleML.toString()    ?? '',
    ampouleCount: stock?.ampouleCount.toString() ?? '',
  })
  const [saved, setSaved] = useState(false)

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave() {
    const s: StockInfo = {
      amouleMg:     parseFloat(form.amouleMg),
      ampouleML:    parseFloat(form.ampouleML),
      ampouleCount: parseFloat(form.ampouleCount),
    }
    if (!s.amouleMg || !s.ampouleML || !s.ampouleCount) return
    onUpdateProfile({ ...profile, stock: s })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const amouleMg     = parseFloat(form.amouleMg)     || 0
  const ampouleCount = parseFloat(form.ampouleCount)  || 0

  const dosesPerAmpoule = amouleMg > 0 && dose > 0 ? Math.floor(amouleMg / dose) : 0
  const totalDoses      = dosesPerAmpoule * ampouleCount
  const weeksRemaining  = totalDoses
  const daysRemaining   = weeksRemaining * 7

  const endDate = daysRemaining > 0
    ? new Date(Date.now() + daysRemaining * 864e5).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const stockOk  = totalDoses >= 4
  const stockLow = totalDoses > 0 && totalDoses < 4

  // Gauge (max = 12 weeks)
  const gaugePct = Math.min(100, (weeksRemaining / 12) * 100)
  const gaugeColor = weeksRemaining === 0
    ? 'rgba(255,255,255,0.25)'
    : weeksRemaining >= 8
      ? '#fff'
      : weeksRemaining >= 4
        ? '#FCD34D'
        : '#FCA5A5'

  const statusMsg = weeksRemaining === 0
    ? 'Configure abaixo para ver seu estoque'
    : weeksRemaining >= 8
      ? 'Estoque confortável'
      : weeksRemaining >= 4
        ? 'Fique de olho — reposição em breve'
        : 'Estoque baixo! Providencie reposição'

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Estoque</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Controle suas ampolas e nunca fique sem medicamento
        </p>
      </div>

      {/* Gauge hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 50%, var(--accent) 100%)',
        borderRadius: '20px', padding: '20px',
        boxShadow: 'var(--shadow-green)', color: '#fff',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Semanas de tratamento
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '16px' }}>
          <p style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
            {weeksRemaining || '--'}
          </p>
          {weeksRemaining > 0 && (
            <p style={{ fontSize: '16px', opacity: 0.8, paddingBottom: '10px' }}>semanas</p>
          )}
        </div>

        {/* Gauge bar */}
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{
            width: `${gaugePct}%`, height: '100%',
            background: gaugeColor, borderRadius: '99px',
            transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '12px', opacity: 0.8 }}>{statusMsg}</p>
          {weeksRemaining > 0 && (
            <span style={{
              padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
              background: stockOk ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.3)',
            }}>
              {stockOk ? 'OK' : 'Baixo'}
            </span>
          )}
        </div>
      </div>

      {/* Dose info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
        borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid rgba(16,185,129,0.2)',
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4-14 14H4v-4L18 2z"/></svg>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Calculando para dose atual de{' '}
          <strong style={{ color: 'var(--primary)' }}>{profile.currentDose}mg</strong>.
          {' '}Altere a dose no seu perfil se necessário.
        </p>
      </div>

      {/* Form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Informe suas ampolas</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="label-base">Concentração (mg)</label>
            <input type="number" className="input-field" placeholder="Ex: 30"
              value={form.amouleMg} onChange={e => setF('amouleMg', e.target.value)} min={1} step={0.5} />
          </div>
          <div>
            <label className="label-base">Volume (mL)</label>
            <input type="number" className="input-field" placeholder="Ex: 1"
              value={form.ampouleML} onChange={e => setF('ampouleML', e.target.value)} min={0.1} step={0.1} />
          </div>
        </div>

        <div>
          <label className="label-base">Quantidade de ampolas</label>
          <input type="number" className="input-field" placeholder="Ex: 3"
            value={form.ampouleCount} onChange={e => setF('ampouleCount', e.target.value)} min={1} step={1} />
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave}>
          {saved ? 'Estoque atualizado!' : 'Calcular e salvar'}
        </button>
      </div>

      {/* Resultados */}
      {dosesPerAmpoule > 0 && ampouleCount > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Resumo do estoque
          </p>
          {[
            { label: 'Doses por ampola',          value: `${dosesPerAmpoule} aplicações`, color: 'var(--text-primary)' },
            { label: 'Total de doses disponíveis', value: `${totalDoses} aplicações`,      color: 'var(--primary)'      },
            { label: 'Semanas de tratamento',      value: `${weeksRemaining} semanas`,     color: 'var(--accent)'       },
            { label: 'Previsão de término',        value: endDate ?? '--',                 color: stockOk ? 'var(--text-primary)' : '#EF4444' },
          ].map(r => (
            <div key={r.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', borderRadius: '11px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{r.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: r.color }}>{r.value}</span>
            </div>
          ))}

          {stockLow && (
            <div className="card-warning" style={{ marginTop: '4px' }}>
              <p style={{ fontSize: '12px', color: 'var(--warn-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Menos de 4 semanas de tratamento. Providencie a reposição o quanto antes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dica */}
      <div className="card-warning">
        <p style={{ fontSize: '13px', color: 'var(--warn-text)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Dica importante
        </p>
        <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.6 }}>
          Mantenha pelo menos <strong>4 semanas</strong> de estoque em casa.
          O medicamento pode demorar alguns dias para chegar após o pedido.
        </p>
      </div>
    </div>
  )
}
