import { useState } from 'react'
import {
  Award, Calendar, Package, Settings, Zap, BarChart2, Scale, Flame, Dumbbell,
  Target, Lightbulb, AlertTriangle, Check, ChevronLeft, ChevronRight, Shield,
  MessageCircle, Utensils,
} from 'lucide-react'
import { UserProfile, Medication, Sex, MEDICATION_LABELS, WEEK_DAYS_FULL } from '../types'
import StockControl from './StockControl'
import { CONSENT_KEY } from './ConsentGate'
import { readJSON, removeKey } from '../utils/storage'
import { USER_DATA_KEYS } from '../utils/storageKeys'
import { exportAllData } from '../utils/dataExport'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onBack: () => void
  initialSection?: string
}

type ProfileSection = null | 'achievements' | 'stock' | 'edit' | 'equipe' | 'suporte' | 'legal'

const DOSES = [2.5, 5, 7.5, 10, 12.5, 15]
const MEDS  = Object.entries(MEDICATION_LABELS) as [Medication, string][]

interface Achievement {
  id: string; icon: React.ReactNode; title: string; phrase: string; unlocked: boolean
}

function buildAchievements(profile: UserProfile): Achievement[] {
  const days    = Math.floor((Date.now() - new Date(profile.startDate).getTime()) / 864e5)
  const lastW   = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const lost    = profile.startWeight - lastW
  const entries = profile.weightHistory.length
  const reachedGoal = lastW <= profile.goalWeight && profile.goalWeight < profile.startWeight
  return [
    { id: 'start',  icon: <Zap size={26} strokeWidth={1.5} />,      title: 'Primeiro passo', phrase: 'Você deu o primeiro passo — o mais difícil de todos.',  unlocked: !!profile.name },
    { id: 'week1',  icon: <Calendar size={26} strokeWidth={1.5} />,  title: '1ª semana',      phrase: 'Uma semana inteira de comprometimento. Continue!',        unlocked: days >= 7 },
    { id: 'month1', icon: <Calendar size={26} strokeWidth={1.5} />,  title: '1 mês',          phrase: 'Um mês de protocolo. Os resultados estão chegando.',       unlocked: days >= 30 },
    { id: 'month2', icon: <Award size={26} strokeWidth={1.5} />,     title: '2 meses',        phrase: '60 dias. Você já criou um hábito real.',                   unlocked: days >= 60 },
    { id: 'track3', icon: <BarChart2 size={26} strokeWidth={1.5} />, title: 'Comprometido',   phrase: 'Monitorar é o segredo de quem chega lá.',                  unlocked: entries >= 3 },
    { id: 'lost2',  icon: <Scale size={26} strokeWidth={1.5} />,     title: '2kg a menos',    phrase: 'Os primeiros 2kg são os mais significativos.',             unlocked: lost >= 2 },
    { id: 'lost5',  icon: <Flame size={26} strokeWidth={1.5} />,     title: '5kg a menos',    phrase: 'Seu corpo está respondendo. 5kg é transformação.',         unlocked: lost >= 5 },
    { id: 'lost10', icon: <Dumbbell size={26} strokeWidth={1.5} />,  title: '10kg a menos',   phrase: '10kg! Uma conquista que muda a vida.',                     unlocked: lost >= 10 },
    { id: 'goal',   icon: <Target size={26} strokeWidth={1.5} />,    title: 'Meta atingida!', phrase: 'Meta atingida. Você é um exemplo de dedicação.',           unlocked: reachedGoal },
  ]
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
const WA = '5588988583366'
function openWA(msg?: string) {
  const url = msg ? `https://wa.me/${WA}?text=${encodeURIComponent(msg)}` : `https://wa.me/${WA}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M11.99 2C6.476 2 2 6.477 2 11.99c0 1.872.518 3.621 1.418 5.12L2.018 22l5.005-1.388A9.944 9.944 0 0011.99 22C17.523 22 22 17.523 22 11.99 22 6.477 17.523 2 11.99 2zm0 18.18a8.14 8.14 0 01-4.152-1.133l-.297-.177-3.086.856.87-3.018-.193-.31A8.165 8.165 0 013.82 11.99c0-4.51 3.66-8.17 8.17-8.17 4.512 0 8.172 3.66 8.172 8.17 0 4.511-3.66 8.19-8.172 8.19z"/>
    </svg>
  )
}

// ── Shared atoms ──────────────────────────────────────────────────────────────
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px', padding: '0 2px',
    }}>{children}</p>
  )
}

function LGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function LDivider() {
  return <div style={{ height: '1px', background: 'var(--border)', margin: '0 16px 0 62px' }} />
}

function LRow({ iconBg, icon, label, badge, value, onClick }: {
  iconBg: string; icon: React.ReactNode; label: string
  badge?: string; value?: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 14px', background: 'transparent', border: 'none',
      cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left',
    }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--primary)',
          background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '99px',
        }}>{badge}</span>
      )}
      {value && !badge && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{value}</span>
      )}
      <ChevronRight size={15} style={{ color: 'var(--text-faint)', flexShrink: 0, marginLeft: '2px' }} />
    </button>
  )
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={onBack} style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)',
      }}><ChevronLeft size={16} strokeWidth={2.5} /></button>
      <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage({ profile, onUpdateProfile, onBack, initialSection }: Props) {
  const [section, setSection] = useState<ProfileSection>((initialSection as ProfileSection) ?? null)
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

  function setF(field: string, value: string | number) { setForm(f => ({ ...f, [field]: value })) }
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
    color: active ? '#fff' : 'var(--text-primary)', fontWeight: 700, fontSize: '12px',
    transition: 'all 0.15s', fontFamily: 'Inter, -apple-system, sans-serif',
    boxShadow: active ? 'var(--shadow-green)' : 'none',
    outline: active ? 'none' : '1px solid var(--border)',
  })

  const achievements = buildAchievements(profile)
  const unlocked     = achievements.filter(a => a.unlocked).length
  const stock        = profile.stock
  const appsLeft     = stock ? Math.floor(stock.amouleMg / profile.currentDose) * stock.ampouleCount : null
  const stockLow     = appsLeft != null && appsLeft < 4

  // ── Sub-pages ───────────────────────────────────────────────────────────────
  if (section === 'achievements') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Conquistas" onBack={() => setSection(null)} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          {unlocked} de {achievements.length} desbloqueadas
        </p>
        <span className="badge badge-green">{Math.round((unlocked / achievements.length) * 100)}%</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {achievements.map(a => (
          <div key={a.id} style={{
            flexShrink: 0, width: '148px', padding: '16px 12px', borderRadius: '16px',
            border: `1.5px solid ${a.unlocked ? 'rgba(37,99,235,0.2)' : 'var(--border)'}`,
            background: a.unlocked ? 'var(--primary-light)' : 'var(--surface)',
            opacity: a.unlocked ? 1 : 0.5,
            boxShadow: a.unlocked ? '0 4px 16px rgba(37,99,235,0.12)' : 'var(--shadow-card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px',
          }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: a.unlocked ? 'var(--primary-light)' : 'var(--surface-2)',
              border: `1px solid ${a.unlocked ? 'rgba(37,99,235,0.15)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: a.unlocked ? 'var(--primary)' : 'var(--text-muted)', opacity: a.unlocked ? 1 : 0.5,
            }}>{a.icon}</div>
            <p style={{ fontWeight: 800, fontSize: '12px', lineHeight: 1.3, margin: 0, color: a.unlocked ? 'var(--primary)' : 'var(--text-muted)' }}>{a.title}</p>
            <p style={{ fontSize: '10px', lineHeight: 1.4, margin: 0, color: a.unlocked ? 'var(--text-secondary)' : 'var(--text-muted)', fontStyle: a.unlocked ? 'italic' : 'normal' }}>
              {a.unlocked ? `"${a.phrase}"` : 'Continue para desbloquear'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  if (section === 'stock') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Estoque" onBack={() => setSection(null)} />
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
        borderRadius: '18px', padding: '18px 20px', color: '#fff', boxShadow: 'var(--shadow-green)',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Estoque disponível
        </p>
        <p style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1, letterSpacing: '1px', margin: '0 0 2px' }}>
          {appsLeft ?? '--'}
          {appsLeft != null && <span style={{ fontSize: '15px', opacity: 0.8, marginLeft: '6px' }}>{appsLeft === 1 ? 'aplicação' : 'aplicações'}</span>}
        </p>
        {appsLeft != null && (
          <p style={{ fontSize: '12px', opacity: 0.75, margin: '4px 0 14px' }}>
            ≈ {Math.round(appsLeft / 4)} {Math.round(appsLeft / 4) === 1 ? 'mês' : 'meses'} de tratamento
          </p>
        )}
        {appsLeft != null && (
          <>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${Math.min(100, (appsLeft / 12) * 100)}%`, height: '100%', background: '#fff', borderRadius: '99px', transition: 'width 0.9s ease' }} />
            </div>
            <p style={{ fontSize: '12px', opacity: 0.8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
              {stockLow ? <><AlertTriangle size={12} strokeWidth={2} />Estoque baixo — reponha em breve</> : <><Check size={12} strokeWidth={2.5} />Estoque confortável</>}
            </p>
          </>
        )}
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', flex: 1, margin: 0 }}>Informe suas ampolas</p>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '99px' }}>
            Dose: {profile.currentDose}mg
          </span>
        </div>
        <StockControl profile={profile} onUpdateProfile={onUpdateProfile} />
      </div>
      <div className="card-warning">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Lightbulb size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
          <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
            Mantenha ao menos <strong>4 semanas</strong> de estoque. O medicamento pode demorar alguns dias após o pedido.
          </p>
        </div>
      </div>
    </div>
  )

  if (section === 'edit') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <SubHeader title="Editar perfil" onBack={() => setSection(null)} />
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
            <input type="date" className="input-field" value={form.startDate} onChange={e => setF('startDate', e.target.value)} max={new Date().toISOString().split('T')[0]} style={{ fontSize: '12px' }} />
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
            <button key={v} style={{ ...selBtn(form.medication === v), textAlign: 'left', padding: '11px 14px' }} onClick={() => setF('medication', v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Dose atual</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
          {DOSES.map(d => (
            <button key={d} style={selBtn(form.currentDose === d)} onClick={() => setF('currentDose', d)}>{d}mg</button>
          ))}
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

      <button className="btn-primary" style={{ width: '100%', opacity: canSave() ? 1 : 0.4 }} onClick={handleSave} disabled={!canSave()}>
        {saved ? 'Salvo com sucesso!' : 'Salvar alterações'}
      </button>

      {!showReset ? (
        <button onClick={() => setShowReset(true)} style={{
          width: '100%', padding: '12px', borderRadius: '10px',
          border: '1.5px solid rgba(239,68,68,0.3)', background: 'transparent',
          color: '#EF4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>Resetar todos os dados</button>
      ) : (
        <div className="card" style={{ border: '1.5px solid rgba(239,68,68,0.4)' }}>
          <p style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700, marginBottom: '4px' }}>
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
            }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Sim, resetar
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (section === 'equipe') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Minha Equipe" onBack={() => setSection(null)} />
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
        Fale diretamente com nossa equipe de saúde via WhatsApp.
      </p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={20} strokeWidth={2} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Nutricionista</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Plano alimentar personalizado</p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          Precisa de um plano alimentar personalizado ou deseja agendar uma consulta?
        </p>
        <button onClick={() => openWA('Olá! Gostaria de agendar uma consulta com a nutricionista.')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '13px 20px', background: 'linear-gradient(135deg,#10B981,#059669)',
          color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          <WaIcon size={18} /> Falar com a Nutricionista
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={20} strokeWidth={2} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Educador Físico</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Ficha de treino personalizada</p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          Deseja uma ficha de treino personalizada ou atualizar seu plano atual?
        </p>
        <button onClick={() => openWA('Olá! Gostaria de solicitar uma nova ficha de treino com o educador físico.')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '13px 20px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)',
          color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          <WaIcon size={18} /> Solicitar ficha de treino
        </button>
      </div>
    </div>
  )

  if (section === 'suporte') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Suporte" onBack={() => setSection(null)} />
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '32px 20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg,#22C55E,#16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WaIcon size={30} />
        </div>
        <div>
          <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Precisa de ajuda?</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.55 }}>
            Nossa equipe está disponível via WhatsApp para tirar dúvidas sobre o app e o seu protocolo.
          </p>
        </div>
        <button onClick={() => openWA()} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '14px 20px', background: 'linear-gradient(135deg,#22C55E,#16A34A)',
          color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          <WaIcon size={18} /> Abrir WhatsApp
        </button>
      </div>
    </div>
  )

  if (section === 'legal') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <SubHeader title="Legal & Privacidade" onBack={() => setSection(null)} />
      <ConsentInfo />

      <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger-text)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aviso Médico</p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>
          O MinhaTize é <strong style={{ color: 'var(--text-primary)' }}>exclusivamente educativo</strong>. Não realiza diagnósticos, não prescreve medicamentos e não substitui o acompanhamento médico ou nutricional.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <InfoRow label="Versão dos Termos" value="1.0 — Junho/2026" />
        <InfoRow label="Controlador dos dados" value="MinhaTize" />
        <InfoRow label="Contato de privacidade" value="privacidade@minhatize.com.br" />
      </div>

      <div className="card">
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Exportar meus dados</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '14px' }}>Baixe todos os seus dados em formato JSON (portabilidade — Art. 18, V da LGPD).</p>
        <button onClick={() => exportAllData(profile)} style={{
          width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
          background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>Baixar dados (JSON)</button>
      </div>

      <div className="card">
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Seus direitos (Art. 18 LGPD)</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '14px' }}>Você pode solicitar: acesso, correção, exclusão, portabilidade ou revogação do consentimento.</p>
        <a href="mailto:privacidade@minhatize.com.br?subject=Exercício%20de%20direitos%20LGPD" style={{
          display: 'block', textAlign: 'center', padding: '11px',
          background: 'var(--primary-light)', borderRadius: '10px',
          color: 'var(--primary)', fontWeight: 700, fontSize: '13px',
          textDecoration: 'none', border: '1px solid rgba(37,99,235,0.2)',
        }}>Enviar solicitação por e-mail</a>
      </div>

      <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', marginBottom: '6px' }}>Revogar consentimento</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
          Ao revogar, seus dados locais serão apagados e você precisará aceitar os termos novamente.
        </p>
        <button onClick={() => {
          [...USER_DATA_KEYS, CONSENT_KEY].forEach(removeKey)
          window.location.reload()
        }} style={{
          width: '100%', padding: '11px', borderRadius: '10px',
          border: '1.5px solid rgba(239,68,68,0.3)', background: 'transparent',
          color: '#EF4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>Revogar e apagar dados</button>
      </div>
    </div>
  )

  // ── Vista principal (lista estilo iOS Settings) ───────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Topo: back + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)',
        }}><ChevronLeft size={16} strokeWidth={2.5} /></button>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Perfil</h2>
      </div>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        borderRadius: '20px', padding: '20px', color: '#fff',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: 'var(--shadow-blue)',
      }}>
        <div style={{
          width: '58px', height: '58px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 800, letterSpacing: '-1px',
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '18px', margin: 0, letterSpacing: '-0.3px' }}>{profile.name}</p>
          <p style={{ fontSize: '12px', opacity: 0.75, margin: '3px 0 0' }}>
            {MEDICATION_LABELS[profile.medication]} · {profile.currentDose}mg
          </p>
        </div>
        <button onClick={() => setSection('edit')} style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}><Settings size={15} strokeWidth={2} /></button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          { label: 'Perdido', value: totalLost > 0 ? `-${totalLost.toFixed(1)}kg` : '0kg', color: 'var(--green)' },
          { label: 'Semanas', value: String(weeks), color: 'var(--primary)' },
          { label: 'Conquistas', value: `${unlocked}/${achievements.length}`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center', padding: '12px 6px',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
          }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Seção: Acompanhamento */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SLabel>Acompanhamento</SLabel>
        <LGroup>
          <LRow
            iconBg="linear-gradient(135deg,#F59E0B,#D97706)"
            icon={<Award size={18} strokeWidth={2} style={{ color: '#fff' }} />}
            label="Conquistas"
            badge={`${unlocked}/${achievements.length}`}
            onClick={() => setSection('achievements')}
          />
          <LDivider />
          <LRow
            iconBg="linear-gradient(135deg,var(--primary),#0D9488)"
            icon={<Package size={18} strokeWidth={2} style={{ color: '#fff' }} />}
            label="Estoque"
            value={stockLow ? '⚠️ Baixo' : appsLeft != null ? `${appsLeft} aplic.` : undefined}
            onClick={() => setSection('stock')}
          />
        </LGroup>
      </div>

      {/* Seção: Minha Equipe */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SLabel>Minha Equipe</SLabel>
        <LGroup>
          <LRow
            iconBg="linear-gradient(135deg,#10B981,#059669)"
            icon={<Utensils size={18} strokeWidth={2} style={{ color: '#fff' }} />}
            label="Nutricionista"
            value="WhatsApp"
            onClick={() => setSection('equipe')}
          />
          <LDivider />
          <LRow
            iconBg="linear-gradient(135deg,#6366F1,#4F46E5)"
            icon={<Dumbbell size={18} strokeWidth={2} style={{ color: '#fff' }} />}
            label="Educador Físico"
            value="WhatsApp"
            onClick={() => setSection('equipe')}
          />
          <LDivider />
          <LRow
            iconBg="linear-gradient(135deg,#22C55E,#16A34A)"
            icon={<MessageCircle size={18} strokeWidth={2} style={{ color: '#fff' }} />}
            label="Suporte"
            onClick={() => setSection('suporte')}
          />
        </LGroup>
      </div>

      {/* Seção: Legal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SLabel>Legal</SLabel>
        <LGroup>
          <LRow
            iconBg="linear-gradient(135deg,#64748B,#475569)"
            icon={<Shield size={18} strokeWidth={2} style={{ color: '#fff' }} />}
            label="Legal & Privacidade"
            onClick={() => setSection('legal')}
          />
        </LGroup>
      </div>

    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: '10px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function ConsentInfo() {
  let date = 'Não registrado'
  let version = '—'
  const parsed = readJSON<{ date?: string; version?: string } | null>(CONSENT_KEY, null)
  if (parsed) {
    version = parsed.version ?? '—'
    if (parsed.date) {
      date = new Date(parsed.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
  return (
    <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: '12px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Consentimento registrado
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Data:</strong> {date}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Versão:</strong> {version}
        </p>
      </div>
    </div>
  )
}
