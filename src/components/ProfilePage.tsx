import { useState } from 'react'
import {
  UserProfile, Medication, Sex, WeightEntry,
  MEDICATION_LABELS, WEEK_DAYS_FULL,
} from '../types'
import Achievements from './Achievements'
import ApplicationCalendar from './ApplicationCalendar'
import Diary from './Diary'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

type InnerTab = 'evolution' | 'diary' | 'achievements' | 'calendar'

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]
const MEDS = Object.entries(MEDICATION_LABELS) as [Medication, string][]

const INNER_TABS: { id: InnerTab; icon: string; label: string }[] = [
  { id: 'evolution',    icon: '📊', label: 'Evolução'   },
  { id: 'diary',        icon: '📓', label: 'Diário'     },
  { id: 'achievements', icon: '🏅', label: 'Conquistas' },
  { id: 'calendar',     icon: '📅', label: 'Calendário' },
]

export default function ProfilePage({ profile, onUpdateProfile }: Props) {
  const [editing, setEditing]     = useState(false)
  const [innerTab, setInnerTab]   = useState<InnerTab>('evolution')
  const [showReset, setShowReset] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [weightSaved, setWeightSaved] = useState(false)
  const [formSaved, setFormSaved]     = useState(false)

  const makeForm = () => ({
    name:           profile.name,
    age:            profile.age?.toString() ?? '',
    sex:            (profile.sex ?? '') as Sex | '',
    medication:     profile.medication,
    height:         profile.height.toString(),
    startWeight:    profile.startWeight.toString(),
    goalWeight:     profile.goalWeight.toString(),
    currentDose:    profile.currentDose,
    startDate:      profile.startDate,
    applicationDay: profile.applicationDay ?? new Date().getDay(),
  })
  const [form, setForm] = useState(makeForm)

  const initials = profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const days  = Math.floor((Date.now() - new Date(profile.startDate).getTime()) / 864e5)
  const weeks = Math.floor(days / 7)

  const firstWeight  = profile.startWeight
  const lastWeight   = profile.weightHistory.at(-1)?.weight ?? firstWeight
  const totalLost    = firstWeight - lastWeight
  const chartPoints  = [{ date: profile.startDate, weight: firstWeight }, ...profile.weightHistory]
  const maxW         = Math.max(...chartPoints.map(e => e.weight))
  const minW         = Math.min(...chartPoints.map(e => e.weight))
  const range        = maxW - minW || 1
  const history      = [...profile.weightHistory].reverse().slice(0, 10)

  function setF(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function canSave() {
    return form.name.trim().length >= 2
      && parseFloat(form.height) > 0
      && parseFloat(form.startWeight) > 0
      && parseFloat(form.goalWeight) > 0
  }

  function handleSave() {
    if (!canSave()) return
    onUpdateProfile({
      ...profile,
      name:           form.name.trim(),
      age:            form.age ? parseInt(form.age) : undefined,
      sex:            (form.sex as Sex) || undefined,
      medication:     form.medication,
      height:         parseFloat(form.height),
      startWeight:    parseFloat(form.startWeight),
      goalWeight:     parseFloat(form.goalWeight),
      currentDose:    form.currentDose,
      startDate:      form.startDate,
      applicationDay: form.applicationDay,
    })
    setFormSaved(true)
    setTimeout(() => { setFormSaved(false); setEditing(false) }, 1500)
  }

  function addWeight() {
    const w = parseFloat(newWeight)
    if (!w || w < 20 || w > 300) return
    const entry: WeightEntry = { date: new Date().toISOString().split('T')[0], weight: w }
    onUpdateProfile({ ...profile, weightHistory: [...profile.weightHistory, entry] })
    setNewWeight('')
    setWeightSaved(true)
    setTimeout(() => setWeightSaved(false), 2000)
  }

  function handleReset() {
    localStorage.removeItem('tizetrack_profile')
    window.location.reload()
  }

  const selBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 6px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    background: active ? 'linear-gradient(135deg, var(--primary), #0D9488)' : 'var(--surface-2)',
    color: active ? '#fff' : 'var(--text-primary)',
    fontWeight: 700, fontSize: '12px', transition: 'all 0.15s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxShadow: active ? 'var(--shadow-green)' : 'none',
    outline: active ? 'none' : '1px solid var(--border)',
  })

  /* ── EDIT MODE ───────────────────────────────────────────────────── */
  if (editing) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { setEditing(false); setForm(makeForm()) }}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >←</button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Editar perfil</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Atualize suas informações</p>
          </div>
        </div>

        {/* Pessoal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Dados pessoais</p>
          <div>
            <label className="label-base">Nome</label>
            <input type="text" className="input-field" value={form.name}
              onChange={e => setF('name', e.target.value)} maxLength={40} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-base">Idade</label>
              <input type="number" className="input-field" placeholder="--"
                value={form.age} onChange={e => setF('age', e.target.value)} min={10} max={120} />
            </div>
            <div>
              <label className="label-base">Sexo</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                {([['female','F'],['male','M'],['other','O']] as const).map(([v, l]) => (
                  <button key={v} style={selBtn(form.sex === v)} onClick={() => setF('sex', v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Corporal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Dados corporais</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-base">Altura (cm)</label>
              <input type="number" className="input-field" value={form.height}
                onChange={e => setF('height', e.target.value)} min={100} max={250} />
            </div>
            <div>
              <label className="label-base">Início</label>
              <input type="date" className="input-field" value={form.startDate}
                onChange={e => setF('startDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label-base">Peso inicial (kg)</label>
              <input type="number" className="input-field" value={form.startWeight}
                onChange={e => setF('startWeight', e.target.value)} min={20} max={300} step={0.1} />
            </div>
            <div>
              <label className="label-base">Meta de peso (kg)</label>
              <input type="number" className="input-field" value={form.goalWeight}
                onChange={e => setF('goalWeight', e.target.value)} min={20} max={300} step={0.1} />
            </div>
          </div>
        </div>

        {/* Medicamento */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Medicamento</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {MEDS.map(([v, l]) => (
              <button key={v}
                style={{ ...selBtn(form.medication === v), textAlign: 'left', padding: '11px 14px' }}
                onClick={() => setF('medication', v)}>
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
              <button key={d} style={selBtn(form.currentDose === d)} onClick={() => setF('currentDose', d)}>
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
              <button key={i}
                style={{ ...selBtn(form.applicationDay === i), textAlign: 'left', padding: '10px 12px' }}
                onClick={() => setF('applicationDay', i)}>
                {day}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', opacity: canSave() ? 1 : 0.4 }}
          onClick={handleSave}
          disabled={!canSave()}
        >
          {formSaved ? '✓ Salvo com sucesso!' : 'Salvar alterações'}
        </button>

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

  /* ── VIEW MODE ───────────────────────────────────────────────────── */
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Avatar header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '4px 0' }}>
        <button
          onClick={() => setEditing(true)}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          aria-label="Editar perfil"
        >
          <div style={{
            width: '68px', height: '68px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-1px',
            boxShadow: '0 4px 20px var(--primary-glow)',
          }}>
            {initials}
          </div>
          <div style={{
            position: 'absolute', bottom: '1px', right: '1px',
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px',
          }}>✏️</div>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
            {profile.name}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {MEDICATION_LABELS[profile.medication]} · {profile.currentDose}mg
          </p>
          <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
            {weeks} {weeks === 1 ? 'semana' : 'semanas'} em protocolo
          </p>
        </div>

        <button
          onClick={() => setEditing(true)}
          style={{
            padding: '8px 14px', borderRadius: '10px',
            border: '1.5px solid var(--border-strong)',
            background: 'var(--surface-2)', color: 'var(--text-secondary)',
            fontWeight: 600, fontSize: '12px', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0,
          }}
        >
          Editar
        </button>
      </div>

      {/* Stats resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { label: 'Início',  value: `${firstWeight}kg` },
          { label: 'Atual',   value: `${lastWeight}kg` },
          { label: 'Perdido', value: `${totalLost > 0 ? '-' : totalLost < 0 ? '+' : ''}${Math.abs(totalLost).toFixed(1)}kg`, highlight: totalLost > 0 },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            <p className="label-base" style={{ marginBottom: '4px', textAlign: 'center' }}>{s.label}</p>
            <p style={{ fontWeight: 800, fontSize: '15px', color: s.highlight ? 'var(--primary)' : 'var(--text-primary)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Inner tabs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px',
        background: 'var(--surface-2)', borderRadius: '14px', padding: '4px',
      }}>
        {INNER_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setInnerTab(t.id)}
            style={{
              padding: '8px 4px', borderRadius: '10px', border: 'none',
              background: innerTab === t.id ? 'var(--primary)' : 'transparent',
              color: innerTab === t.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '10px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: innerTab === t.id ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            <span style={{ display: 'block', fontSize: '15px', marginBottom: '2px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={innerTab} className="fade-in">

        {/* ── EVOLUÇÃO ── */}
        {innerTab === 'evolution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                          width: '100%', height: `${heightPct}px`,
                          background: isLast
                            ? 'var(--primary)'
                            : `rgba(16,185,129,${0.2 + (i / chartPoints.length) * 0.4})`,
                          borderRadius: '5px 5px 0 0', transition: 'height 0.4s ease',
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

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Registrar pesagem</h3>
              <div>
                <label className="label-base">Seu peso hoje (kg)</label>
                <input
                  type="number" className="input-field" placeholder="Ex: 84.5"
                  value={newWeight} onChange={e => setNewWeight(e.target.value)}
                  min={20} max={300} step={0.1}
                />
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', opacity: newWeight ? 1 : 0.5 }}
                onClick={addWeight}
                disabled={!newWeight}
              >
                {weightSaved ? '✓ Salvo!' : 'Salvar pesagem'}
              </button>
            </div>

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
                        padding: '10px 12px', borderRadius: '10px', background: 'var(--surface-2)',
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {diff !== null && (
                            <span style={{
                              fontSize: '11px', fontWeight: 700,
                              color: diff < 0 ? 'var(--primary)' : diff > 0 ? '#EF4444' : 'var(--text-muted)',
                            }}>
                              {diff < 0 ? '▼' : diff > 0 ? '▲' : '='} {Math.abs(diff).toFixed(1)}kg
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

        {/* ── DIÁRIO ── */}
        {innerTab === 'diary' && (
          <Diary profile={profile} onUpdateProfile={onUpdateProfile} />
        )}

        {/* ── CONQUISTAS ── */}
        {innerTab === 'achievements' && (
          <Achievements profile={profile} />
        )}

        {/* ── CALENDÁRIO ── */}
        {innerTab === 'calendar' && (
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '14px' }}>
              📅 Calendário de Aplicações
            </p>
            <ApplicationCalendar profile={profile} onUpdateProfile={onUpdateProfile} />
          </div>
        )}
      </div>
    </div>
  )
}
