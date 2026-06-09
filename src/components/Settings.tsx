import { useState } from 'react'
import { Medication, Sex, UserProfile, MEDICATION_LABELS, WEEK_DAYS_FULL } from '../types'
import StockControl from './StockControl'

interface Props {
  profile: UserProfile
  onUpdateProfile: (profile: UserProfile) => void
}

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]
const MEDICATIONS = Object.entries(MEDICATION_LABELS) as [Medication, string][]

export default function Settings({ profile, onUpdateProfile }: Props) {
  const [form, setForm] = useState({
    name:           profile.name,
    age:            profile.age?.toString() ?? '',
    sex:            profile.sex ?? '' as Sex | '',
    medication:     profile.medication ?? 'tirzepatida' as Medication,
    height:         profile.height.toString(),
    startWeight:    profile.startWeight.toString(),
    goalWeight:     profile.goalWeight.toString(),
    currentDose:    profile.currentDose,
    startDate:      profile.startDate,
    applicationDay: profile.applicationDay ?? new Date().getDay(),
  })
  const [saved, setSaved] = useState(false)
  const [showReset, setShowReset] = useState(false)

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function canSave() {
    return form.name.trim().length >= 2 && parseFloat(form.height) > 0
      && parseFloat(form.startWeight) > 0 && parseFloat(form.goalWeight) > 0
  }

  function handleSave() {
    if (!canSave()) return
    onUpdateProfile({
      ...profile,
      name:           form.name.trim(),
      age:            form.age ? parseInt(form.age) : undefined,
      sex:            form.sex || undefined,
      medication:     form.medication,
      height:         parseFloat(form.height),
      startWeight:    parseFloat(form.startWeight),
      goalWeight:     parseFloat(form.goalWeight),
      currentDose:    form.currentDose,
      startDate:      form.startDate,
      applicationDay: form.applicationDay,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    localStorage.removeItem('tizetrack_profile')
    window.location.reload()
  }

  const selBtn = (active: boolean) => ({
    padding: '10px 6px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    background: active ? 'linear-gradient(135deg, var(--primary), #0D9488)' : 'var(--surface-2)',
    color: active ? '#fff' : 'var(--text-primary)',
    fontWeight: 700, fontSize: '12px', transition: 'all 0.15s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxShadow: active ? 'var(--shadow-green)' : 'none',
    outline: active ? 'none' : '1px solid var(--border)',
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Perfil</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Edite suas informações a qualquer momento</p>
      </div>

      {/* Dados pessoais */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Dados pessoais</p>

        <div>
          <label className="label-base">Nome</label>
          <input type="text" className="input-field" value={form.name} onChange={e => set('name', e.target.value)} maxLength={40} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="label-base">Idade</label>
            <input type="number" className="input-field" placeholder="--"
              value={form.age} onChange={e => set('age', e.target.value)} min={10} max={120} />
          </div>
          <div>
            <label className="label-base">Sexo</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
              {([['female','F'],['male','M'],['other','O']] as const).map(([v, l]) => (
                <button key={v} style={selBtn(form.sex === v)} onClick={() => set('sex', v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Dados corporais</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="label-base">Altura (cm)</label>
            <input type="number" className="input-field" value={form.height} onChange={e => set('height', e.target.value)} min={100} max={250} />
          </div>
          <div>
            <label className="label-base">Início (data)</label>
            <input type="date" className="input-field" value={form.startDate} onChange={e => set('startDate', e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="label-base">Peso inicial (kg)</label>
            <input type="number" className="input-field" value={form.startWeight} onChange={e => set('startWeight', e.target.value)} min={20} max={300} step={0.1} />
          </div>
          <div>
            <label className="label-base">Meta de peso (kg)</label>
            <input type="number" className="input-field" value={form.goalWeight} onChange={e => set('goalWeight', e.target.value)} min={20} max={300} step={0.1} />
          </div>
        </div>
      </div>

      {/* Medicamento */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Medicamento</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {MEDICATIONS.map(([v, l]) => (
            <button key={v} style={{ ...selBtn(form.medication === v), textAlign: 'left', padding: '11px 14px' }}
              onClick={() => set('medication', v)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Dose */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Dose atual</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
          {DOSES.map(d => (
            <button key={d} style={selBtn(form.currentDose === d)} onClick={() => set('currentDose', d)}>
              {d}mg
            </button>
          ))}
        </div>
      </div>

      {/* Dia da aplicação */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Dia da aplicação</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {WEEK_DAYS_FULL.map((day, i) => (
            <button key={i} style={{ ...selBtn(form.applicationDay === i), textAlign: 'left', padding: '10px 12px' }}
              onClick={() => set('applicationDay', i)}>
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Controle de estoque */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          Controle de Estoque
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Informe as ampolas disponíveis e calcule quantas semanas de tratamento você tem.
        </p>
        <StockControl profile={profile} onUpdateProfile={onUpdateProfile} />
      </div>

      {/* Salvar */}
      <button className="btn-primary" style={{ width: '100%', opacity: canSave() ? 1 : 0.4 }}
        onClick={handleSave} disabled={!canSave()}>
        {saved ? 'Salvo com sucesso!' : 'Salvar alterações'}
      </button>

      {/* Reset */}
      {!showReset ? (
        <button onClick={() => setShowReset(true)} style={{
          width: '100%', padding: '12px', borderRadius: '10px',
          border: '1.5px solid rgba(239,68,68,0.3)', background: 'transparent',
          color: '#EF4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Resetar todos os dados
        </button>
      ) : (
        <div className="card" style={{ border: '1.5px solid rgba(239,68,68,0.4)' }}>
          <p style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700, marginBottom: '12px' }}>
            Tem certeza? Todo o histórico será apagado permanentemente.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowReset(false)} className="btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={handleReset} style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>Sim, resetar</button>
          </div>
        </div>
      )}
    </div>
  )
}
