import { useState } from 'react'
import { StockInfo, UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

export default function StockControl({ profile, onUpdateProfile }: Props) {
  const stock = profile.stock
  const [form, setForm] = useState({
    amouleMg:    stock?.amouleMg.toString()    ?? '',
    ampouleML:   stock?.ampouleML.toString()   ?? '',
    ampouleCount:stock?.ampouleCount.toString() ?? '',
  })
  const [saved, setSaved] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function save() {
    const s: StockInfo = {
      amouleMg:    parseFloat(form.amouleMg),
      ampouleML:   parseFloat(form.ampouleML),
      ampouleCount:parseFloat(form.ampouleCount),
    }
    if (!s.amouleMg || !s.ampouleML || !s.ampouleCount) return
    onUpdateProfile({ ...profile, stock: s })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Cálculos
  const amouleMg    = parseFloat(form.amouleMg)   || 0
  const ampouleCount= parseFloat(form.ampouleCount)|| 0
  const dose        = profile.currentDose

  const dosesPerAmpoule = amouleMg > 0 && dose > 0 ? Math.floor(amouleMg / dose) : 0
  const totalDoses      = dosesPerAmpoule * ampouleCount
  const weeksRemaining  = totalDoses
  const daysRemaining   = weeksRemaining * 7

  const endDate = daysRemaining > 0
    ? new Date(Date.now() + daysRemaining * 864e5).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const stockOk = totalDoses > 4

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="label-base">Concentração (mg)</label>
            <input type="number" className="input-field" placeholder="Ex: 30"
              value={form.amouleMg} onChange={e => set('amouleMg', e.target.value)} min={1} step={0.5} />
          </div>
          <div>
            <label className="label-base">Volume (mL)</label>
            <input type="number" className="input-field" placeholder="Ex: 1"
              value={form.ampouleML} onChange={e => set('ampouleML', e.target.value)} min={0.1} step={0.1} />
          </div>
        </div>
        <div>
          <label className="label-base">Quantidade de ampolas disponíveis</label>
          <input type="number" className="input-field" placeholder="Ex: 3"
            value={form.ampouleCount} onChange={e => set('ampouleCount', e.target.value)} min={1} step={1} />
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={save}>
          {saved ? '✓ Estoque atualizado!' : 'Calcular estoque'}
        </button>
      </div>

      {/* Resultado */}
      {dosesPerAmpoule > 0 && ampouleCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Doses por ampola',         value: `${dosesPerAmpoule} aplicações`, color: 'var(--text-primary)' },
            { label: 'Total de doses no estoque', value: `${totalDoses} aplicações`,     color: 'var(--primary)' },
            { label: 'Semanas de tratamento',     value: `${weeksRemaining} semanas`,    color: 'var(--accent)' },
            { label: 'Previsão de término',       value: endDate ?? '--',                color: stockOk ? 'var(--text-primary)' : '#EF4444' },
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

          {!stockOk && totalDoses > 0 && (
            <div className="card-warning">
              <p style={{ fontSize: '12px', color: 'var(--warn-text)', fontWeight: 600 }}>
                ⚠️ Estoque baixo — menos de 4 semanas de tratamento. Providencie a reposição.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
