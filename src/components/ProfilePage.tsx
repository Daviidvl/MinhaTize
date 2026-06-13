import { useState } from 'react'
import { Award, Calendar, Package, Settings, Zap, BarChart2, Scale, Flame, Dumbbell, Target, Lightbulb, AlertTriangle, Check, ChevronLeft } from 'lucide-react'
import { UserProfile, Medication, Sex, MEDICATION_LABELS, WEEK_DAYS_FULL } from '../types'
import StockControl from './StockControl'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onBack: () => void
  initialSection?: string
}

type ProfileTab = 'achievements' | 'history' | 'stock' | 'edit'

const PROFILE_TABS: { id: ProfileTab; icon: React.ReactNode; label: string }[] = [
  { id: 'achievements', icon: <Award size={14} strokeWidth={2} />,    label: 'Conquistas' },
  { id: 'stock',        icon: <Package size={14} strokeWidth={2} />,  label: 'Estoque'    },
  { id: 'edit',         icon: <Settings size={14} strokeWidth={2} />, label: 'Editar'     },
]

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]
const MEDS  = Object.entries(MEDICATION_LABELS) as [Medication, string][]

interface Achievement {
  id: string; icon: React.ReactNode; title: string; phrase: string; unlocked: boolean
}

function buildAchievements(profile: UserProfile): Achievement[] {
  const days   = Math.floor((Date.now() - new Date(profile.startDate).getTime()) / 864e5)
  const lastW  = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const lost   = profile.startWeight - lastW
  const entries = profile.weightHistory.length
  const reachedGoal = lastW <= profile.goalWeight && profile.goalWeight < profile.startWeight

  return [
    {
      id: 'start', icon: <Zap size={28} strokeWidth={1.5} />, title: 'Primeiro passo',
      phrase: 'Você deu o primeiro passo — o mais difícil de todos.',
      unlocked: !!profile.name,
    },
    {
      id: 'week1', icon: <Calendar size={28} strokeWidth={1.5} />, title: '1ª semana',
      phrase: 'Uma semana inteira de comprometimento. Continue!',
      unlocked: days >= 7,
    },
    {
      id: 'month1', icon: <Calendar size={28} strokeWidth={1.5} />, title: '1 mês',
      phrase: 'Um mês de protocolo. Os resultados estão chegando.',
      unlocked: days >= 30,
    },
    {
      id: 'month2', icon: <Award size={28} strokeWidth={1.5} />, title: '2 meses',
      phrase: '60 dias. Você já criou um hábito real.',
      unlocked: days >= 60,
    },
    {
      id: 'track3', icon: <BarChart2 size={28} strokeWidth={1.5} />, title: 'Comprometido',
      phrase: 'Monitorar é o segredo de quem chega lá.',
      unlocked: entries >= 3,
    },
    {
      id: 'lost2', icon: <Scale size={28} strokeWidth={1.5} />, title: '2kg a menos',
      phrase: 'Os primeiros 2kg são os mais significativos.',
      unlocked: lost >= 2,
    },
    {
      id: 'lost5', icon: <Flame size={28} strokeWidth={1.5} />, title: '5kg a menos',
      phrase: 'Seu corpo está respondendo. 5kg é transformação.',
      unlocked: lost >= 5,
    },
    {
      id: 'lost10', icon: <Dumbbell size={28} strokeWidth={1.5} />, title: '10kg a menos',
      phrase: '10kg! Uma conquista que muda a vida.',
      unlocked: lost >= 10,
    },
    {
      id: 'goal', icon: <Target size={28} strokeWidth={1.5} />, title: 'Meta atingida!',
      phrase: 'Meta atingida. Você é um exemplo de dedicação.',
      unlocked: reachedGoal,
    },
  ]
}

export default function ProfilePage({ profile, onUpdateProfile, onBack, initialSection }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    (initialSection as ProfileTab) ?? 'achievements'
  )

  const [form, setForm] = useState({
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
  const [saved, setSaved]         = useState(false)
  const [showReset, setShowReset] = useState(false)

  const initials   = profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const days       = Math.floor((Date.now() - new Date(profile.startDate).getTime()) / 864e5)
  const weeks      = Math.floor(days / 7)
  const lastWeight = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const totalLost  = profile.startWeight - lastWeight

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
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    background: active ? 'linear-gradient(135deg, var(--primary), #0D9488)' : 'var(--surface-2)',
    color: active ? '#fff' : 'var(--text-primary)',
    fontWeight: 700, fontSize: '12px', transition: 'all 0.15s',
    fontFamily: 'Inter, -apple-system, sans-serif',
    boxShadow: active ? 'var(--shadow-green)' : 'none',
    outline: active ? 'none' : '1px solid var(--border)',
  })

  const achievements = buildAchievements(profile)
  const unlocked     = achievements.filter(a => a.unlocked).length

  // Estoque
  const stock    = profile.stock
  const appsLeft = stock ? Math.floor(stock.amouleMg / profile.currentDose) * stock.ampouleCount : null
  const stockLow = appsLeft != null && appsLeft < 4
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary)',
          }}
        ><ChevronLeft size={18} strokeWidth={2} /></button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Perfil</h2>
        </div>
      </div>

      {/* Card de resumo */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        borderRadius: '18px', padding: '18px 20px', color: '#fff',
        display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: 'var(--shadow-green)',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 800, letterSpacing: '-1px',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '18px', margin: 0, letterSpacing: '-0.3px' }}>{profile.name}</p>
          <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
            {MEDICATION_LABELS[profile.medication]} · {profile.currentDose}mg
          </p>
          <p style={{ fontSize: '11px', opacity: 0.65, marginTop: '2px' }}>
            {weeks} semanas · {unlocked}/{achievements.length} conquistas
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '22px', fontWeight: 800, margin: 0, lineHeight: 1 }}>
            {totalLost > 0 ? `-${totalLost.toFixed(1)}` : `${totalLost.toFixed(1)}`}kg
          </p>
          <p style={{ fontSize: '10px', opacity: 0.65, marginTop: '2px' }}>perdido</p>
        </div>
      </div>

      {/* Inner tab bar */}
      <div style={{
        display: 'flex', gap: '5px',
        background: 'var(--surface-2)', borderRadius: '14px', padding: '4px',
      }}>
        {PROFILE_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '9px 3px', borderRadius: '10px', border: 'none',
              background: activeTab === t.id ? 'var(--primary)' : 'transparent',
              color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '10px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, -apple-system, sans-serif',
              boxShadow: activeTab === t.id ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            }}
          >
            <span style={{ display: 'flex' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={activeTab} className="fade-in">

        {/* ── CONQUISTAS ── */}
        {activeTab === 'achievements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                {unlocked} de {achievements.length} desbloqueadas
              </p>
              <span className="badge badge-green">{Math.round((unlocked / achievements.length) * 100)}%</span>
            </div>

            {/* Scroll horizontal */}
            <div style={{
              display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}>
              {achievements.map(a => (
                <div
                  key={a.id}
                  style={{
                    flexShrink: 0, width: '150px',
                    padding: '16px 12px', borderRadius: '16px',
                    border: `1.5px solid ${a.unlocked ? 'rgba(37,99,235,0.2)' : 'var(--border)'}`,
                    background: a.unlocked ? 'var(--primary-light)' : 'var(--surface)',
                    opacity: a.unlocked ? 1 : 0.5,
                    boxShadow: a.unlocked ? '0 4px 16px rgba(37,99,235,0.12)' : 'var(--shadow-card)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px',
                  }}
                >
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: a.unlocked ? 'var(--primary-light)' : 'var(--surface-2)',
                    border: `1px solid ${a.unlocked ? 'rgba(37,99,235,0.15)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: a.unlocked ? 'var(--primary)' : 'var(--text-muted)',
                    opacity: a.unlocked ? 1 : 0.5,
                  }}>
                    {a.icon}
                  </div>
                  <p style={{
                    fontWeight: 800, fontSize: '12px', lineHeight: 1.3, margin: 0,
                    color: a.unlocked ? 'var(--primary)' : 'var(--text-muted)',
                  }}>
                    {a.title}
                  </p>
                  <p style={{
                    fontSize: '10px', lineHeight: 1.4, margin: 0,
                    color: a.unlocked ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontStyle: a.unlocked ? 'italic' : 'normal',
                  }}>
                    {a.unlocked ? `"${a.phrase}"` : 'Continue para desbloquear'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ESTOQUE ── */}
        {activeTab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Gauge hero */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
              borderRadius: '18px', padding: '18px 20px', color: '#fff',
              boxShadow: 'var(--shadow-green)',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                Estoque disponível
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1, letterSpacing: '1px' }}>
                    {appsLeft ?? '--'}
                    {appsLeft != null && (
                      <span style={{ fontSize: '15px', opacity: 0.8, marginLeft: '6px' }}>
                        {appsLeft === 1 ? 'aplicação' : 'aplicações'}
                      </span>
                    )}
                  </p>
                  {appsLeft != null && (
                    <p style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>
                      ≈ {Math.round(appsLeft / 4)} {Math.round(appsLeft / 4) === 1 ? 'mês' : 'meses'} de tratamento
                    </p>
                  )}
                </div>
              </div>
              {appsLeft != null && (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{
                      width: `${Math.min(100, (appsLeft / 12) * 100)}%`,
                      height: '100%', background: '#fff', borderRadius: '99px', transition: 'width 0.9s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: '12px', opacity: 0.8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {stockLow
                      ? <><AlertTriangle size={12} strokeWidth={2} />Estoque baixo — reponha em breve</>
                      : <><Check size={12} strokeWidth={2.5} />Estoque confortável</>
                    }
                  </p>
                </>
              )}
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', flex: 1, margin: 0 }}>
                  Informe suas ampolas
                </p>
                <span style={{
                  fontSize: '11px', color: 'var(--primary)', fontWeight: 700,
                  background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '99px',
                }}>
                  Dose: {profile.currentDose}mg
                </span>
              </div>
              <StockControl profile={profile} onUpdateProfile={onUpdateProfile} />
            </div>

            <div className="card-warning">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Lightbulb size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
                <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
                  Mantenha ao menos <strong>4 semanas </strong> de estoque. O medicamento pode demorar alguns dias após o pedido.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── EDITAR ── */}
        {activeTab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Dados pessoais */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Dados pessoais
              </p>
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

            {/* Dados corporais */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Dados corporais
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-base">Altura (cm)</label>
                  <input type="number" className="input-field" value={form.height}
                    onChange={e => setF('height', e.target.value)} min={100} max={250} />
                </div>
                <div>
                  <label className="label-base">Início do protocolo</label>
                  <input type="date" className="input-field" value={form.startDate}
                    onChange={e => setF('startDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ fontSize: '12px' }} />
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
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Medicamento
              </p>
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
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Dose atual
              </p>
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
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Dia da aplicação
              </p>
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

            {/* Salvar */}
            <button
              className="btn-primary" style={{ width: '100%', opacity: canSave() ? 1 : 0.4 }}
              onClick={handleSave} disabled={!canSave()}
            >
              {saved ? 'Salvo com sucesso!' : 'Salvar alterações'}
            </button>

            {/* Reset */}
            {!showReset ? (
              <button onClick={() => setShowReset(true)} style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1.5px solid rgba(239,68,68,0.3)', background: 'transparent',
                color: '#EF4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                fontFamily: 'Inter, -apple-system, sans-serif',
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
                  <button onClick={() => { localStorage.removeItem('tizetrack_profile'); window.location.reload() }} style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}>Sim, resetar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
