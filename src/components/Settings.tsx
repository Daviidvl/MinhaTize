import { useState } from 'react'
import { UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (profile: UserProfile) => void
}

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]

export default function Settings({ profile, onUpdateProfile }: Props) {
  const [form, setForm] = useState({
    name: profile.name,
    height: profile.height.toString(),
    startWeight: profile.startWeight.toString(),
    goalWeight: profile.goalWeight.toString(),
    currentDose: profile.currentDose,
    startDate: profile.startDate,
  })
  const [saved, setSaved] = useState(false)
  const [showReset, setShowReset] = useState(false)

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function canSave() {
    return (
      form.name.trim().length >= 2 &&
      parseFloat(form.height) > 0 &&
      parseFloat(form.startWeight) > 0 &&
      parseFloat(form.goalWeight) > 0
    )
  }

  function handleSave() {
    if (!canSave()) return
    onUpdateProfile({
      ...profile,
      name: form.name.trim(),
      height: parseFloat(form.height),
      startWeight: parseFloat(form.startWeight),
      goalWeight: parseFloat(form.goalWeight),
      currentDose: form.currentDose,
      startDate: form.startDate,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    localStorage.removeItem('tizetrack_profile')
    window.location.reload()
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Configurações
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Edite seus dados a qualquer momento
        </p>
      </div>

      {/* Dados pessoais */}
      <div className="card space-y-4">
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Dados pessoais
        </h3>

        <div>
          <label className="label-base">Nome</label>
          <input
            type="text"
            className="input-field"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            maxLength={40}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="label-base">Altura (cm)</label>
            <input
              type="number"
              className="input-field"
              value={form.height}
              onChange={e => set('height', e.target.value)}
              min={100} max={250}
            />
          </div>
          <div>
            <label className="label-base">Início do protocolo</label>
            <input
              type="date"
              className="input-field"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      {/* Pesos */}
      <div className="card space-y-4">
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Pesos
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="label-base">Peso inicial (kg)</label>
            <input
              type="number"
              className="input-field"
              value={form.startWeight}
              onChange={e => set('startWeight', e.target.value)}
              min={20} max={300} step={0.1}
            />
          </div>
          <div>
            <label className="label-base">Meta de peso (kg)</label>
            <input
              type="number"
              className="input-field"
              value={form.goalWeight}
              onChange={e => set('goalWeight', e.target.value)}
              min={20} max={300} step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Dose */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Dose atual
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {DOSES.map(dose => (
            <button
              key={dose}
              onClick={() => set('currentDose', dose)}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                border: `2px solid ${form.currentDose === dose ? 'var(--primary)' : 'var(--border)'}`,
                background: form.currentDose === dose ? 'var(--primary-light)' : 'var(--surface)',
                color: form.currentDose === dose ? 'var(--primary-dark)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {dose}mg
            </button>
          ))}
        </div>
      </div>

      {/* Botão salvar */}
      <button
        className="btn-primary"
        style={{ width: '100%', opacity: canSave() ? 1 : 0.4, cursor: canSave() ? 'pointer' : 'not-allowed' }}
        onClick={handleSave}
        disabled={!canSave()}
      >
        {saved ? '✓ Salvo com sucesso!' : 'Salvar alterações'}
      </button>

      {/* Zona de perigo */}
      <div style={{ marginTop: '8px' }}>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              border: '1.5px solid rgba(239,68,68,0.3)', background: 'transparent',
              color: '#EF4444', fontWeight: 600, fontSize: '13px',
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Resetar todos os dados
          </button>
        ) : (
          <div className="card" style={{ border: '1.5px solid rgba(239,68,68,0.4)' }}>
            <p style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700, marginBottom: '12px' }}>
              Tem certeza? Isso apagará todo o histórico e não pode ser desfeito.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowReset(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1.5px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: 'none', background: '#EF4444',
                  color: '#fff', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Sim, resetar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
