import { useState } from 'react'
import { SideEffectEntry, UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

const SYMPTOMS = [
  { id: 'nausea',     label: 'Náusea',            icon: '🤢' },
  { id: 'vomiting',   label: 'Vômito',             icon: '🤮' },
  { id: 'constipation',label: 'Constipação',       icon: '😣' },
  { id: 'diarrhea',   label: 'Diarreia',           icon: '🚽' },
  { id: 'reflux',     label: 'Refluxo/Azia',       icon: '🔥' },
  { id: 'fatigue',    label: 'Fadiga',             icon: '😴' },
  { id: 'dizziness',  label: 'Tontura',            icon: '💫' },
  { id: 'abdominal',  label: 'Dor abdominal',      icon: '🫃' },
  { id: 'headache',   label: 'Dor de cabeça',      icon: '🤕' },
  { id: 'appetite',   label: 'Sem apetite',        icon: '🍽️' },
]

const INTENSITIES: { value: 0 | 1 | 2 | 3; label: string; color: string }[] = [
  { value: 0, label: 'Nenhum',   color: 'var(--text-muted)' },
  { value: 1, label: 'Leve',     color: '#10B981' },
  { value: 2, label: 'Moderado', color: '#F59E0B' },
  { value: 3, label: 'Intenso',  color: '#EF4444' },
]

function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatWeek(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T12:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function intensityColor(v: number) {
  return INTENSITIES.find(i => i.value === v)?.color ?? 'var(--text-muted)'
}

export default function SideEffects({ profile, onUpdateProfile }: Props) {
  const thisWeek = getMondayOf(new Date())
  const existing = profile.sideEffects?.find(e => e.date === thisWeek)

  const initSymptoms = () =>
    SYMPTOMS.map(s => ({
      id: s.id,
      intensity: (existing?.symptoms.find(x => x.id === s.id)?.intensity ?? 0) as 0 | 1 | 2 | 3,
    }))

  const [symptoms, setSymptoms] = useState(initSymptoms)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saved, setSaved] = useState(false)

  function setIntensity(id: string, intensity: 0 | 1 | 2 | 3) {
    setSymptoms(s => s.map(x => x.id === id ? { ...x, intensity } : x))
  }

  function handleSave() {
    const entry: SideEffectEntry = { date: thisWeek, symptoms, notes }
    const filtered = (profile.sideEffects ?? []).filter(e => e.date !== thisWeek)
    onUpdateProfile({ ...profile, sideEffects: [...filtered, entry] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const hasAnySymptom = symptoms.some(s => s.intensity > 0)
  const history = [...(profile.sideEffects ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(1, 6)

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Efeitos Colaterais
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>
          Registre semanalmente para acompanhar sua tolerância ao medicamento.
        </p>
      </div>

      {/* Registro semanal */}
      <div className="card space-y-4">
        <div>
          <p className="label-base">Semana atual</p>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
            {formatWeek(thisWeek)}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {SYMPTOMS.map(symptom => {
            const current = symptoms.find(s => s.id === symptom.id)!
            return (
              <div key={symptom.id} style={{
                padding: '10px 12px', borderRadius: '12px',
                background: current.intensity > 0 ? `${intensityColor(current.intensity)}10` : 'var(--surface-2)',
                border: `1.5px solid ${current.intensity > 0 ? intensityColor(current.intensity) + '30' : 'var(--border)'}`,
                transition: 'all 0.15s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{symptom.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {symptom.label}
                    </span>
                  </div>
                  {current.intensity > 0 && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                      background: intensityColor(current.intensity) + '15',
                      color: intensityColor(current.intensity),
                    }}>
                      {INTENSITIES.find(i => i.value === current.intensity)?.label}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {INTENSITIES.map(int => (
                    <button
                      key={int.value}
                      onClick={() => setIntensity(symptom.id, int.value)}
                      style={{
                        flex: 1, padding: '6px 2px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                        border: `1.5px solid ${current.intensity === int.value ? int.color : 'var(--border)'}`,
                        background: current.intensity === int.value ? int.color + '15' : 'transparent',
                        color: current.intensity === int.value ? int.color : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {int.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <label className="label-base">Observações (opcional)</label>
          <textarea
            className="input-field"
            style={{ resize: 'none', minHeight: '64px', lineHeight: '1.5' }}
            placeholder="Quando os sintomas ocorreram, o que ajudou..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={200}
          />
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={handleSave}
        >
          {saved ? '✓ Registro salvo!' : existing ? 'Atualizar registro' : 'Salvar esta semana'}
        </button>
      </div>

      {/* Resumo da semana atual */}
      {hasAnySymptom && (
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px' }}>
            Resumo da semana
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {symptoms.filter(s => s.intensity > 0).map(s => {
              const sym = SYMPTOMS.find(x => x.id === s.id)!
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: '99px',
                  background: intensityColor(s.intensity) + '12',
                  border: `1px solid ${intensityColor(s.intensity)}25`,
                }}>
                  <span style={{ fontSize: '12px' }}>{sym.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: intensityColor(s.intensity) }}>
                    {sym.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px' }}>
            Semanas anteriores
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map(entry => {
              const active = entry.symptoms.filter(s => s.intensity > 0)
              const worst = Math.max(...entry.symptoms.map(s => s.intensity)) as 0 | 1 | 2 | 3
              return (
                <div key={entry.date} style={{
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {formatWeek(entry.date)}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {active.length === 0 ? 'Nenhum sintoma' : `${active.length} sintoma${active.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {worst > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                      background: intensityColor(worst) + '15', color: intensityColor(worst),
                    }}>
                      {INTENSITIES.find(i => i.value === worst)?.label}
                    </span>
                  )}
                  {worst === 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                      background: 'var(--primary-light)', color: 'var(--primary-dark)',
                    }}>
                      Sem sintomas
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!hasAnySymptom && history.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: '36px', marginBottom: '10px' }}>🩺</p>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>Nenhum registro ainda</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
            Registre como você se sentiu esta semana
          </p>
        </div>
      )}
    </div>
  )
}
