import { useState } from 'react'
import { UserProfile, WeightEntry } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (profile: UserProfile) => void
}

export default function Progress({ profile, onUpdateProfile }: Props) {
  const [newWeight, setNewWeight] = useState('')
  const [saved, setSaved] = useState(false)

  function addWeight() {
    const w = parseFloat(newWeight)
    if (!w || w < 20 || w > 300) return

    const entry: WeightEntry = {
      date: new Date().toISOString().split('T')[0],
      weight: w,
    }

    const updated = {
      ...profile,
      weightHistory: [...profile.weightHistory, entry],
    }
    onUpdateProfile(updated)
    setNewWeight('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const history = [...profile.weightHistory].reverse().slice(0, 10)
  const firstWeight = profile.startWeight
  const lastWeight = profile.weightHistory.length > 0
    ? profile.weightHistory[profile.weightHistory.length - 1].weight
    : firstWeight

  const maxW = Math.max(firstWeight, ...profile.weightHistory.map(e => e.weight))
  const minW = Math.min(firstWeight, ...profile.weightHistory.map(e => e.weight))
  const range = maxW - minW || 1

  const chartPoints = [
    { date: profile.startDate, weight: firstWeight },
    ...profile.weightHistory,
  ]

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Progresso de Peso
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Registre seu peso semanalmente
        </p>
      </div>

      {/* Gráfico simples */}
      {chartPoints.length > 1 && (
        <div className="card">
          <p className="label-base" style={{ marginBottom: '12px' }}>Evolução</p>
          <div style={{ position: 'relative', height: '100px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            {chartPoints.map((entry, i) => {
              const heightPct = range === 0 ? 50 : ((entry.weight - minW) / range) * 100
              const isLast = i === chartPoints.length - 1
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {entry.weight}
                  </span>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(10, heightPct)}px`,
                    background: isLast
                      ? 'var(--primary)'
                      : 'var(--primary-light)',
                    border: isLast ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.4s ease',
                  }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Início</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Hoje</span>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Início', value: `${firstWeight}kg` },
          { label: 'Atual', value: `${lastWeight}kg` },
          { label: 'Perdido', value: `${(firstWeight - lastWeight).toFixed(1)}kg` },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            <p className="label-base" style={{ marginBottom: '4px', textAlign: 'center' }}>{s.label}</p>
            <p style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Registrar peso */}
      <div className="card space-y-4">
        <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
          Registrar pesagem
        </h3>
        <div>
          <label className="label-base">Seu peso hoje (kg)</label>
          <input
            type="number"
            className="input-field"
            placeholder="Ex: 84.5"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            min={20}
            max={300}
            step={0.1}
          />
        </div>
        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={addWeight}
          disabled={!newWeight}
        >
          {saved ? '✓ Salvo!' : 'Salvar pesagem'}
        </button>
      </div>

      {/* Histórico */}
      {history.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Histórico recente
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((entry, i) => {
              const prev = history[i + 1]
              const diff = prev ? entry.weight - prev.weight : null
              return (
                <div
                  key={entry.date + i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {diff !== null && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: diff < 0 ? 'var(--primary)' : '#EF4444',
                      }}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg
                      </span>
                    )}
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {entry.weight}kg
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
