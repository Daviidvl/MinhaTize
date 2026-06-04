import { useState } from 'react'
import { UserProfile, WeightEntry } from '../types'
import Diary from './Diary'

interface Props {
  profile: UserProfile
  onUpdateProfile: (profile: UserProfile) => void
}

type InnerTab = 'weight' | 'diary'

export default function Progress({ profile, onUpdateProfile }: Props) {
  const [innerTab, setInnerTab] = useState<InnerTab>('weight')
  const [newWeight, setNewWeight] = useState('')
  const [saved, setSaved] = useState(false)

  function addWeight() {
    const w = parseFloat(newWeight)
    if (!w || w < 20 || w > 300) return
    const entry: WeightEntry = { date: new Date().toISOString().split('T')[0], weight: w }
    onUpdateProfile({ ...profile, weightHistory: [...profile.weightHistory, entry] })
    setNewWeight('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  const history = [...profile.weightHistory].reverse().slice(0, 10)
  const firstWeight = profile.startWeight
  const lastWeight = profile.weightHistory.length > 0
    ? profile.weightHistory[profile.weightHistory.length - 1].weight
    : firstWeight

  const chartPoints = [
    { date: profile.startDate, weight: firstWeight },
    ...profile.weightHistory,
  ]
  const maxW = Math.max(...chartPoints.map(e => e.weight))
  const minW = Math.min(...chartPoints.map(e => e.weight))
  const range = maxW - minW || 1

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Progresso</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Acompanhe seu peso e como você está se sentindo
        </p>
      </div>

      {/* Mini nav interna */}
      <div style={{
        display: 'flex', gap: '6px',
        background: 'var(--surface-2)',
        borderRadius: '12px', padding: '4px',
      }}>
        {([
          { id: 'weight', label: '⚖️ Peso' },
          { id: 'diary',  label: '📓 Diário' },
        ] as { id: InnerTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setInnerTab(t.id)}
            style={{
              flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
              background: innerTab === t.id ? 'var(--primary)' : 'transparent',
              color: innerTab === t.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: innerTab === t.id ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ABA: PESO */}
      {innerTab === 'weight' && (
        <div className="space-y-5 fade-in">

          {/* Gráfico */}
          {chartPoints.length > 1 ? (
            <div className="card">
              <p className="label-base" style={{ marginBottom: '14px' }}>Evolução do peso</p>
              <div style={{ position: 'relative', height: '100px', display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                {chartPoints.map((entry, i) => {
                  const heightPct = ((entry.weight - minW) / range) * 80 + 10
                  const isLast = i === chartPoints.length - 1
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '9px', color: isLast ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700 }}>
                        {entry.weight}
                      </span>
                      <div style={{
                        width: '100%',
                        height: `${heightPct}px`,
                        background: isLast
                          ? 'var(--primary)'
                          : `rgba(16,185,129,${0.2 + (i / chartPoints.length) * 0.4})`,
                        borderRadius: '5px 5px 0 0',
                        transition: 'height 0.4s ease',
                      }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Início</span>
                <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>Atual</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: '36px', marginBottom: '10px' }}>📉</p>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>Nenhum registro ainda</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                Registre sua primeira pesagem abaixo
              </p>
            </div>
          )}

          {/* Resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Início', value: `${firstWeight}kg` },
              { label: 'Atual',  value: `${lastWeight}kg` },
              { label: 'Perdido', value: `${(firstWeight - lastWeight).toFixed(1)}kg`, highlight: firstWeight > lastWeight },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                <p className="label-base" style={{ marginBottom: '4px', textAlign: 'center' }}>{s.label}</p>
                <p style={{ fontWeight: 800, fontSize: '15px', color: s.highlight ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Registrar */}
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
                min={20} max={300} step={0.1}
              />
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', opacity: newWeight ? 1 : 0.5 }}
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
                    <div key={entry.date + i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '10px',
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {diff !== null && (
                          <span style={{
                            fontSize: '11px', fontWeight: 700,
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
      )}

      {/* ABA: DIÁRIO */}
      {innerTab === 'diary' && (
        <Diary profile={profile} onUpdateProfile={onUpdateProfile} />
      )}
    </div>
  )
}
