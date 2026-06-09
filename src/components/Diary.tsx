import { useState } from 'react'
import { Zap, Smile, Meh, Frown, BookOpen } from 'lucide-react'
import { DiaryEntry, UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]

const FEELINGS: { value: DiaryEntry['feeling']; icon: React.ReactNode; label: string; color: string }[] = [
  { value: 'great', icon: <Zap   size={22} strokeWidth={2} />, label: 'Ótimo',   color: '#10B981' },
  { value: 'good',  icon: <Smile size={22} strokeWidth={2} />, label: 'Bem',     color: '#6366F1' },
  { value: 'okay',  icon: <Meh   size={22} strokeWidth={2} />, label: 'Regular', color: '#F59E0B' },
  { value: 'hard',  icon: <Frown size={22} strokeWidth={2} />, label: 'Difícil', color: '#EF4444' },
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

export default function Diary({ profile, onUpdateProfile }: Props) {
  const thisWeek = getMondayOf(new Date())
  const existingEntry = profile.diary?.find(e => e.date === thisWeek)

  const [dose, setDose] = useState<number>(existingEntry?.dose ?? profile.currentDose)
  const [feeling, setFeeling] = useState<DiaryEntry['feeling']>(existingEntry?.feeling ?? 'good')
  const [notes, setNotes] = useState(existingEntry?.notes ?? '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const entry: DiaryEntry = { date: thisWeek, dose, feeling, notes }
    const filtered = (profile.diary ?? []).filter(e => e.date !== thisWeek)
    onUpdateProfile({ ...profile, diary: [...filtered, entry] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const history = [...(profile.diary ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)

  const feelingOf = (f: DiaryEntry['feeling']) => FEELINGS.find(x => x.value === f)!

  return (
    <div className="space-y-6 fade-in">
      {/* Registro da semana */}
      <div className="card space-y-5">
        <div>
          <p className="label-base">Semana atual</p>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
            {formatWeek(thisWeek)}
          </p>
        </div>

        {/* Dose aplicada */}
        <div>
          <label className="label-base">Dose aplicada esta semana</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
            {DOSES.map(d => (
              <button
                key={d}
                onClick={() => setDose(d)}
                style={{
                  padding: '11px 6px',
                  borderRadius: '10px',
                  border: `2px solid ${dose === d ? 'var(--primary)' : 'var(--border)'}`,
                  background: dose === d ? 'var(--primary-light)' : 'var(--surface-2)',
                  color: dose === d ? 'var(--primary-dark)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                {d}mg
              </button>
            ))}
          </div>
        </div>

        {/* Como se sentiu */}
        <div>
          <label className="label-base">Como você se sentiu</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '4px' }}>
            {FEELINGS.map(f => (
              <button
                key={f.value}
                onClick={() => setFeeling(f.value)}
                style={{
                  padding: '12px 4px',
                  borderRadius: '10px',
                  border: `2px solid ${feeling === f.value ? f.color : 'var(--border)'}`,
                  background: feeling === f.value ? `${f.color}18` : 'var(--surface-2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{
                  display: 'flex',
                  color: feeling === f.value ? f.color : 'var(--text-muted)',
                }}>{f.icon}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  color: feeling === f.value ? f.color : 'var(--text-muted)',
                }}>
                  {f.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Anotações */}
        <div>
          <label className="label-base">Anotações (opcional)</label>
          <textarea
            className="input-field"
            style={{ resize: 'none', minHeight: '80px', lineHeight: '1.5' }}
            placeholder="Efeitos, observações, como foi a semana..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={300}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
            {notes.length}/300
          </p>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={handleSave}
        >
          {saved ? 'Semana registrada!' : existingEntry ? 'Atualizar registro' : 'Registrar semana'}
        </button>
      </div>

      {/* Histórico */}
      {history.length > 0 && (
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Histórico
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map(entry => {
              const f = feelingOf(entry.feeling)
              const isThis = entry.date === thisWeek
              return (
                <div
                  key={entry.date}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isThis ? 'var(--primary-light)' : 'var(--surface-2)',
                    border: `1.5px solid ${isThis ? 'rgba(37,99,235,0.2)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: `${f.color}18`, border: `1px solid ${f.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color,
                  }}>{f.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {formatWeek(entry.date)}
                      </p>
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: 'var(--primary)', background: 'var(--primary-light)',
                        padding: '2px 8px', borderRadius: '99px',
                      }}>
                        {entry.dose}mg
                      </span>
                    </div>
                    {entry.notes && (
                      <p style={{
                        fontSize: '12px', color: 'var(--text-muted)',
                        marginTop: '3px', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', color: 'var(--primary)',
          }}>
            <BookOpen size={24} strokeWidth={2} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>Nenhum registro ainda</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Registre sua primeira semana acima
          </p>
        </div>
      )}
    </div>
  )
}
