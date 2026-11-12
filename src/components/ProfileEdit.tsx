import { useState } from 'react'
import { UserProfile, Medication, Sex, MEDICATION_LABELS, DOSE_OPTIONS, WEEK_DAYS_FULL } from '../types'
import { resolveDoseMode } from '../utils/medicationUtils'
import {
  ageBlock, isValidHeight, isValidWeight, startDateBlock, medicationNameOk, customDoseOk,
  doseModeForMedication, resolveDose, resolvePresentation,
} from '../utils/profileForm'
import { removeKey } from '../utils/storage'
import { USER_DATA_KEYS } from '../utils/storageKeys'
import { todayStr } from '../utils/dateUtils'
import { useFlash } from '../hooks/useFlash'
import { SubHeader } from './ProfileShared'

// Edição do perfil (mesmas regras do cadastro inicial) e "Resetar todos os dados".

const MEDS = Object.entries(MEDICATION_LABELS) as [Medication, string][]

const selBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
  background: active ? 'var(--g-cta)' : 'var(--surface-2)',
  color: active ? '#fff' : 'var(--text-primary)', fontWeight: 700, fontSize: '12px',
  transition: 'all 0.15s', fontFamily: 'Inter, -apple-system, sans-serif',
  boxShadow: active ? 'var(--shadow-green)' : 'none',
  outline: active ? 'none' : '1px solid var(--border)',
})

export default function ProfileEdit({ profile, onUpdateProfile, onBack }: {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onBack: () => void
}) {
  const initialDose = resolveDoseMode(profile)
  const [form, setForm] = useState({
    name:            profile.name,
    age:             profile.age?.toString() ?? '',
    sex:             (profile.sex ?? '') as Sex | '',
    medication:      profile.medication,
    medicationName:  profile.medicationName ?? '',
    height:          profile.height.toString(),
    startWeight:     profile.startWeight.toString(),
    goalWeight:      profile.goalWeight.toString(),
    doseMode:        initialDose.mode,
    fixedDose:       initialDose.fixedValue,
    customDose:      initialDose.customValue,
    presentationMg:  profile.presentationMg?.toString() ?? '',
    presentationMl:  profile.presentationMl?.toString() ?? '',
    startDate:       profile.startDate,
    applicationDay:  profile.applicationDay ?? new Date().getDay(),
  })
  const [saved, flashSaved]       = useFlash(2000)
  const [showReset, setShowReset] = useState(false)

  function setF(field: string, value: string | number | boolean) { setForm(f => ({ ...f, [field]: value })) }

  function selectMedication(m: Medication) {
    setForm(f => ({ ...f, medication: m, doseMode: doseModeForMedication(m, f.doseMode) }))
  }

  const canSave = form.name.trim().length >= 2
    && medicationNameOk(form.medication, form.medicationName)
    && customDoseOk(form.doseMode, form.customDose)
    && !ageBlock(form.age)
    && !startDateBlock(form.startDate)
    && isValidHeight(form.height)
    && isValidWeight(form.startWeight)
    && isValidWeight(form.goalWeight)

  function handleSave() {
    if (!canSave) return
    onUpdateProfile({
      ...profile,
      name:           form.name.trim(),
      age:            form.age ? parseInt(form.age) : undefined,
      sex:            (form.sex as Sex) || undefined,
      medication:     form.medication,
      medicationName: form.medication === 'outro' ? form.medicationName.trim() : undefined,
      height:         parseFloat(form.height),
      startWeight:    parseFloat(form.startWeight),
      goalWeight:     parseFloat(form.goalWeight),
      currentDose:    resolveDose(form.doseMode, form.fixedDose, form.customDose),
      ...resolvePresentation(form.presentationMg, form.presentationMl),
      startDate:      form.startDate,
      applicationDay: form.applicationDay,
    })
    flashSaved()
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <SubHeader title="Editar perfil" onBack={onBack} />
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Dados pessoais</p>
        <div>
          <label className="label-base">Nome</label>
          <input type="text" className="input-field" value={form.name} onChange={e => setF('name', e.target.value)} maxLength={40} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="label-base">Idade</label>
            <input type="number" className="input-field" placeholder="--" value={form.age} onChange={e => setF('age', e.target.value)} min={10} max={120} />
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

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Dados corporais</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="label-base">Altura (cm)</label>
            <input type="number" className="input-field" value={form.height} onChange={e => setF('height', e.target.value)} min={100} max={250} />
          </div>
          <div>
            <label className="label-base">Início do protocolo</label>
            <input type="date" className="input-field" value={form.startDate} onChange={e => setF('startDate', e.target.value)} max={todayStr()} style={{ fontSize: '12px' }} />
          </div>
          <div>
            <label className="label-base">Peso inicial (kg)</label>
            <input type="number" className="input-field" value={form.startWeight} onChange={e => setF('startWeight', e.target.value)} min={20} max={300} step={0.1} />
          </div>
          <div>
            <label className="label-base">Meta de peso (kg)</label>
            <input type="number" className="input-field" value={form.goalWeight} onChange={e => setF('goalWeight', e.target.value)} min={20} max={300} step={0.1} />
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Medicamento</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {MEDS.map(([v, l]) => (
            <button key={v} style={{ ...selBtn(form.medication === v), textAlign: 'left', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => selectMedication(v)}>
              <span style={{ flex: 1 }}>{l}</span>
              {v === 'retatrutida' && <span className="badge badge-warm" style={{ fontSize: '9px' }}>investigacional</span>}
            </button>
          ))}
        </div>

        {form.medication === 'outro' && (
          <div>
            <label className="label-base">Nome do medicamento</label>
            <input type="text" className="input-field" placeholder="Digite o nome do medicamento"
              value={form.medicationName} onChange={e => setF('medicationName', e.target.value)} maxLength={60} />
          </div>
        )}

        {form.medication === 'retatrutida' && (
          <div className="card-warning">
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--warn-text)', margin: '0 0 4px' }}>
              Retatrutida — molécula investigacional
            </p>
            <p style={{ fontSize: '12px', color: 'var(--warn-text)', margin: 0, lineHeight: 1.5 }}>
              As informações cadastradas correspondem aos dados informados pelo usuário e não representam validação da apresentação ou procedência do produto.
            </p>
          </div>
        )}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Dose atual</p>
        {form.medication !== 'retatrutida' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
            {DOSE_OPTIONS.map(d => (
              <button key={d} style={selBtn(form.doseMode === 'fixed' && form.fixedDose === d)}
                onClick={() => setForm(f => ({ ...f, doseMode: 'fixed', fixedDose: d }))}>{d}mg</button>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
          <button style={selBtn(form.doseMode === 'custom')} onClick={() => setF('doseMode', 'custom')}>Outra dose</button>
          <button style={selBtn(form.doseMode === 'unknown')} onClick={() => setF('doseMode', 'unknown')}>Não sei informar</button>
        </div>
        {form.doseMode === 'custom' && (
          <div>
            <label className="label-base">Digite a dose utilizada por aplicação (mg)</label>
            <input type="number" className="input-field" placeholder="Ex: 6"
              value={form.customDose} onChange={e => setF('customDose', e.target.value)} min={0.1} step={0.1} />
          </div>
        )}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Apresentação do produto (opcional)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input type="number" className="input-field" placeholder="Concentração (mg)"
            value={form.presentationMg} onChange={e => setF('presentationMg', e.target.value)} min={0.1} step={0.1} />
          <input type="number" className="input-field" placeholder="Volume (mL)"
            value={form.presentationMl} onChange={e => setF('presentationMl', e.target.value)} min={0.01} step={0.01} />
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Dia da aplicação</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {WEEK_DAYS_FULL.map((day, i) => (
            <button key={i} style={{ ...selBtn(form.applicationDay === i), textAlign: 'left', padding: '10px 12px' }} onClick={() => setF('applicationDay', i)}>{day}</button>
          ))}
        </div>
      </div>

      <button className="btn-primary" style={{ width: '100%', opacity: canSave ? 1 : 0.4 }} onClick={handleSave} disabled={!canSave}>
        {saved ? 'Salvo com sucesso!' : 'Salvar alterações'}
      </button>

      {!showReset ? (
        <button onClick={() => setShowReset(true)} style={{
          width: '100%', padding: '12px', borderRadius: '10px',
          border: '1.5px solid var(--red-line)', background: 'transparent',
          color: 'var(--red)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>Resetar todos os dados</button>
      ) : (
        <div className="card" style={{ border: '1.5px solid var(--red-line)' }}>
          <p style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 700, marginBottom: '4px' }}>
            Tem certeza? Todo o histórico será apagado permanentemente.
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Serão removidos: perfil, peso, exames, diário, efeitos colaterais e planos salvos. Seu token de acesso ao app é mantido.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowReset(false)} className="btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={() => {
              USER_DATA_KEYS.forEach(removeKey)
              window.location.reload()
            }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--red)', color: 'var(--surface)', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Sim, resetar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
