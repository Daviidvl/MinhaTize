import { Package, AlertTriangle, Dumbbell, Utensils, ChevronRight, Moon } from 'lucide-react'
import { UserProfile, Tab, MEDICATION_LABELS, WEEK_DAYS_FULL } from '../types'
import ApplicationCalendar from './ApplicationCalendar'

interface Props {
  profile: UserProfile
  onNavigate: (tab: Tab) => void
  onUpdateProfile: (p: UserProfile) => void
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
}

function calcIMC(w: number, h: number) {
  if (!h || !w) return null
  return w / ((h / 100) ** 2)
}

function imcLabel(v: number) {
  if (v < 18.5) return { text: 'Abaixo', color: '#F59E0B' }
  if (v < 25)   return { text: 'Normal',     color: '#10B981' }
  if (v < 30)   return { text: 'Sobrepeso',  color: '#F97316' }
  if (v < 35)   return { text: 'Obeso I',    color: '#EF4444' }
  if (v < 40)   return { text: 'Obeso II',   color: '#DC2626' }
  return         { text: 'Obeso III',        color: '#B91C1C' }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getFormattedDate() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const DOSE_PHASE: Record<number, string> = {
  2.5: 'Fase inicial', 5: 'Adaptação', 7.5: 'Progresso',
  10: 'Consolidação', 12.5: 'Avançado', 15: 'Dose máxima',
}

function getMotivation(lost: number, toGoal: number, weeks: number, days: number, reachedGoal: boolean) {
  if (reachedGoal)                    return { text: 'Meta atingida!',                   sub: 'Resultado incrível. Continue cuidando dos hábitos.' }
  if (lost >= 10)                     return { text: `${lost.toFixed(1)}kg eliminados`,  sub: 'Resultado extraordinário. Parabéns pela consistência.' }
  if (toGoal > 0 && toGoal <= 3)      return { text: `Faltam apenas ${toGoal.toFixed(1)}kg`, sub: 'Você está na reta final!' }
  if (lost >= 5)                      return { text: `${lost.toFixed(1)}kg a menos`,    sub: 'Cada semana de consistência conta muito.' }
  if (weeks >= 8)                     return { text: `${weeks} semanas de protocolo`,   sub: 'Consistência é o maior diferencial.' }
  if (lost >= 2)                      return { text: `Já perdeu ${lost.toFixed(1)}kg`,  sub: `Faltam ${toGoal.toFixed(1)}kg para a meta.` }
  if (weeks >= 2)                     return { text: `${weeks}ª semana em protocolo`,   sub: 'A dedicação já está gerando resultados.' }
  if (days <= 3)                      return { text: 'Bem-vindo ao protocolo!',          sub: 'Registre seu peso toda semana.' }
  return { text: 'Registre seu peso', sub: 'Acompanhe sua evolução no gráfico.' }
}

// ── Workout widget data ──────────────────────────────────────────────────────
const SPLIT_INFO: Record<string, { label: string; name: string; color: string }[]> = {
  '2_M': [{ label: 'A', name: 'Empurrar + Core',         color: '#059669' }, { label: 'B', name: 'Puxar + Posterior',        color: '#7C3AED' }],
  '2_F': [{ label: 'A', name: 'Glúteos + Pernas',        color: '#EC4899' }, { label: 'B', name: 'Superior + Core',          color: '#7C3AED' }],
  '3_M': [{ label: 'A', name: 'Peito + Tríceps',         color: '#059669' }, { label: 'B', name: 'Costas + Bíceps',          color: '#7C3AED' }, { label: 'C', name: 'Pernas + Core',             color: '#0EA5E9' }],
  '3_F': [{ label: 'A', name: 'Glúteos + Isquios',       color: '#EC4899' }, { label: 'B', name: 'Peito + Costas + Ombros', color: '#7C3AED' }, { label: 'C', name: 'Pernas + Core',             color: '#059669' }],
  '4_M': [{ label: 'A', name: 'Peito + Tríceps',         color: '#059669' }, { label: 'B', name: 'Costas + Bíceps',         color: '#7C3AED' }, { label: 'C', name: 'Pernas',                   color: '#0EA5E9' }, { label: 'D', name: 'Ombros + Core',           color: '#F59E0B' }],
  '4_F': [{ label: 'A', name: 'Glúteos',                 color: '#EC4899' }, { label: 'B', name: 'Peito + Tríceps',        color: '#059669' }, { label: 'C', name: 'Pernas + Panturrilha',     color: '#0EA5E9' }, { label: 'D', name: 'Costas + Bíceps',         color: '#7C3AED' }],
  '5_M': [{ label: 'A', name: 'Peito',                   color: '#059669' }, { label: 'B', name: 'Costas',                 color: '#7C3AED' }, { label: 'C', name: 'Pernas',                   color: '#0EA5E9' }, { label: 'D', name: 'Ombros',                 color: '#F59E0B' }, { label: 'E', name: 'Bíceps + Tríceps', color: '#DC2626' }],
  '5_F': [{ label: 'A', name: 'Glúteos',                 color: '#EC4899' }, { label: 'B', name: 'Pernas',                 color: '#0EA5E9' }, { label: 'C', name: 'Peito + Costas',           color: '#7C3AED' }, { label: 'D', name: 'Glúteos 2 + Isquios',    color: '#F97316' }, { label: 'E', name: 'Ombros + Braços + Core', color: '#059669' }],
}
const WORKOUT_SCHEDULE: Record<number, number[]> = { 2: [1,4], 3: [1,3,5], 4: [1,2,4,5], 5: [1,2,3,4,5] }
const LEVEL_LABEL: Record<string, string> = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }

// ── Meal widget data ──────────────────────────────────────────────────────────
interface MealSlot { label: string; color: string; startH: number; endH: number; sub_M: string; sub_F: string }
const MEAL_SLOTS: MealSlot[] = [
  { label: 'Café da manhã',   color: '#D97706', startH: 6,    endH: 9.5,  sub_M: 'Ovos · pão · fruta',                     sub_F: 'Ovos · queijo · fruta' },
  { label: 'Lanche da manhã', color: '#F59E0B', startH: 9.5,  endH: 12,   sub_M: 'Whey ou iogurte proteico',               sub_F: 'Whey ou iogurte proteico' },
  { label: 'Almoço',          color: '#059669', startH: 12,   endH: 14.5, sub_M: 'Arroz · feijão · frango · legumes',      sub_F: 'Arroz · feijão · frango · legumes' },
  { label: 'Lanche da tarde', color: '#0891B2', startH: 14.5, endH: 18,   sub_M: 'Whey + fruta ou sanduíche proteico',     sub_F: 'Whey + fruta ou 2 ovos' },
  { label: 'Jantar',          color: '#7C3AED', startH: 18,   endH: 21,   sub_M: 'Arroz · proteína magra · legumes',       sub_F: 'Arroz · proteína magra · legumes' },
  { label: 'Ceia',            color: '#1E40AF', startH: 21,   endH: 24,   sub_M: 'Whey com água ou leite desnatado',       sub_F: 'Whey ou iogurte grego natural' },
]
function fmtH(h: number) { return `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.round((h%1)*60)).padStart(2,'0')}` }
function getMealNow(): { slot: MealSlot; isCurrent: boolean } {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  const cur = MEAL_SLOTS.find(s => h >= s.startH && h < s.endH)
  if (cur) return { slot: cur, isCurrent: true }
  return { slot: MEAL_SLOTS.find(s => s.startH > h) ?? MEAL_SLOTS[0], isCurrent: false }
}

// ── Workout widget ────────────────────────────────────────────────────────────
function WorkoutWidget({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  let wp: { sex: string; days: number; level: string } | null = null
  try { wp = JSON.parse(localStorage.getItem('tizetrack_workout') || 'null') } catch {}

  const notConfigured = (
    <button onClick={() => onNavigate('health')} className="card"
      style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: '1.5px dashed var(--border-strong)', width: '100%', textAlign: 'left' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Dumbbell size={20} strokeWidth={1.8} color="var(--text-muted)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Configure seu treino</p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Acesse Saúde → Exercícios para personalizar</p>
      </div>
      <ChevronRight size={16} strokeWidth={2} color="var(--text-muted)" />
    </button>
  )

  if (!wp) return notConfigured

  const key   = `${wp.days}_${wp.sex}`
  const splits = SPLIT_INFO[key]
  if (!splits) return notConfigured

  const todayDay = new Date().getDay()
  const schedule = WORKOUT_SCHEDULE[wp.days] ?? []
  const idx      = schedule.indexOf(todayDay)
  const isRest   = idx === -1
  const workout  = isRest ? null : splits[idx]

  if (isRest || !workout) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Moon size={20} strokeWidth={1.8} color="#059669" />
        </div>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Treino de Hoje</p>
          <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Dia de descanso</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Recuperação ativa · {LEVEL_LABEL[wp.level] ?? wp.level}</p>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => onNavigate('health')} className="card"
      style={{ cursor: 'pointer', width: '100%', textAlign: 'left', padding: '14px 16px' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
        Treino de Hoje
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
          background: workout.color + '18',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${workout.color}30`,
        }}>
          <span style={{ fontSize: '16px', fontWeight: 900, color: workout.color, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{workout.label}</span>
          <span style={{ fontSize: '8px', fontWeight: 700, color: workout.color + 'aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>treino</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>{workout.name}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
            {LEVEL_LABEL[wp.level] ?? wp.level} · {wp.days}× por semana
          </p>
        </div>
        <ChevronRight size={16} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </div>
      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
          Ver exercícios completos →
        </p>
      </div>
    </button>
  )
}

// ── Meal widget ───────────────────────────────────────────────────────────────
function MealWidget({ profile, onNavigate }: { profile: UserProfile; onNavigate: (t: Tab) => void }) {
  let dietSex: 'M' | 'F' | null = null
  try { const d = JSON.parse(localStorage.getItem('tizetrack_diet') || 'null'); dietSex = d?.sex ?? null } catch {}
  if (!dietSex) dietSex = profile.sex === 'female' ? 'F' : 'M'

  const notConfigured = (
    <button onClick={() => onNavigate('health')} className="card"
      style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: '1.5px dashed var(--border-strong)', width: '100%', textAlign: 'left' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Utensils size={20} strokeWidth={1.8} color="var(--text-muted)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Configure sua dieta</p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Acesse Saúde → Alimentação para personalizar</p>
      </div>
      <ChevronRight size={16} strokeWidth={2} color="var(--text-muted)" />
    </button>
  )

  const dietSet = !!localStorage.getItem('tizetrack_diet')
  if (!dietSet) return notConfigured

  const { slot, isCurrent } = getMealNow()
  const sub = dietSex === 'F' ? slot.sub_F : slot.sub_M

  return (
    <button onClick={() => onNavigate('health')} className="card"
      style={{ cursor: 'pointer', width: '100%', textAlign: 'left', padding: '14px 16px' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
        {isCurrent ? 'Refeição Agora' : 'Próxima Refeição'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
          background: slot.color + '18',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${slot.color}30`,
        }}>
          <Utensils size={18} strokeWidth={1.8} color={slot.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>{slot.label}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
            {fmtH(slot.startH)} – {fmtH(slot.endH === 24 ? 24 : slot.endH)}
          </p>
        </div>
        <ChevronRight size={16} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </div>
      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{sub}</p>
      </div>
    </button>
  )
}

// ── Quick action card ────────────────────────────────────────────────────────
function QuickCard({
  icon, title, sub, onClick,
}: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '16px 10px', cursor: 'pointer',
        textAlign: 'center', width: '100%',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(15,23,42,0.10)'
        e.currentTarget.style.borderColor = 'var(--border-strong)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', margin: '0 auto 8px',
        background: 'var(--primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--primary)',
      }}>
        {icon}
      </div>
      <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>{title}</p>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>{sub}</p>
    </button>
  )
}

// ── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({
  label, value, unit, sub, subColor,
}: { label: string; value: string | number; unit?: string; sub?: string; subColor?: string }) {
  return (
    <div className="stat-card">
      <p className="label-base" style={{ marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px', color: 'var(--text-primary)', margin: 0 }}>
        {value}
        {unit && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>{unit}</span>}
      </p>
      {sub && (
        <p style={{ fontSize: '11px', marginTop: '4px', fontWeight: 600, color: subColor ?? 'var(--primary)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Dashboard({ profile, onNavigate, onUpdateProfile }: Props) {
  const lastWeight  = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const totalLost   = profile.startWeight - lastWeight
  const toGoal      = lastWeight - profile.goalWeight
  const hasGoal     = profile.startWeight !== profile.goalWeight
  const pct         = hasGoal
    ? Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.goalWeight)) * 100))
    : 0
  const days        = daysSince(profile.startDate)
  const weeks       = Math.floor(days / 7)
  const imc         = calcIMC(lastWeight, profile.height)
  const imcInfo     = imc ? imcLabel(imc) : null
  const reachedGoal = hasGoal && lastWeight <= profile.goalWeight

  const lastApp       = profile.lastApplication
  const appDay        = profile.applicationDay
  const daysSinceApp  = lastApp ? daysSince(lastApp) : null
  const daysUntilNext = daysSinceApp != null ? Math.max(0, 7 - daysSinceApp) : null
  const appPct        = daysSinceApp != null ? Math.min(100, (daysSinceApp / 7) * 100) : 0
  const appToday      = daysUntilNext === 0

  const motivation = getMotivation(totalLost, toGoal, weeks, days, reachedGoal)

  const stock     = profile.stock
  const appsLeft  = stock && profile.currentDose > 0
    ? Math.floor(stock.amouleMg / profile.currentDose) * stock.ampouleCount
    : null
  const stockLow  = appsLeft != null && appsLeft < 4

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Greeting ── */}
      <div style={{ paddingTop: '4px', paddingBottom: '2px' }}>
        <p style={{
          fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)',
          marginBottom: '4px', fontFamily: 'Inter, sans-serif',
          textTransform: 'capitalize',
        }}>
          {getFormattedDate()}
        </p>
        <h1 style={{
          fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-0.6px', lineHeight: 1.15, margin: 0,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {getGreeting()}, {profile.name.split(' ')[0]}
        </h1>
        <p style={{
          fontSize: '13px', color: 'var(--text-muted)', marginTop: '5px',
          fontFamily: 'Inter, sans-serif', fontWeight: 400,
        }}>
          {motivation.text} · {motivation.sub}
        </p>
      </div>

      {/* ── Weight hero ── */}
      <button
        onClick={() => onNavigate('progress')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Ver evolução de peso"
      >
        <div style={{
          background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
          borderRadius: '24px', padding: '22px 22px 20px',
          boxShadow: '0 8px 32px rgba(37,99,235,0.30)',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '130px', height: '130px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '30%',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
              Peso atual · toque para ver evolução
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <p style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, letterSpacing: '-2.5px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  {lastWeight}
                  <span style={{ fontSize: '16px', opacity: 0.75, marginLeft: '4px', fontWeight: 600 }}>kg</span>
                </p>
                <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                  {weeks === 0 ? 'Início do protocolo' : `${weeks}ª semana`}
                  {' · '}{MEDICATION_LABELS[profile.medication]}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  background: totalLost > 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  borderRadius: '14px', padding: '8px 12px',
                }}>
                  <p style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
                    {totalLost > 0 ? '−' : totalLost < 0 ? '+' : ''}{Math.abs(totalLost).toFixed(1)}kg
                  </p>
                  <p style={{ fontSize: '9px', opacity: 0.65, fontWeight: 600, marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                    perdido total
                  </p>
                </div>
              </div>
            </div>

            {hasGoal && (
              <>
                <div style={{ background: 'rgba(255,255,255,0.20)', borderRadius: '99px', height: '5px', overflow: 'hidden', marginBottom: '7px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: '99px', transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', opacity: 0.55, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                    {profile.startWeight}kg início
                  </span>
                  <span style={{ fontSize: '10px', opacity: 0.90, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                    {reachedGoal ? 'Meta atingida!' : `Faltam ${toGoal.toFixed(1)}kg · ${pct.toFixed(0)}%`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <StatTile
          label="IMC"
          value={imc ? imc.toFixed(1) : '--'}
          sub={imcInfo?.text}
          subColor={imcInfo?.color}
        />
        <StatTile
          label="Dose atual"
          value={profile.currentDose}
          unit="mg"
          sub={DOSE_PHASE[profile.currentDose] ?? ''}
        />
      </div>

      {/* ── Daily widgets ── */}
      <WorkoutWidget onNavigate={onNavigate} />
      <MealWidget profile={profile} onNavigate={onNavigate} />

      {/* ── Next application ── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lastApp ? '12px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
              background: appToday ? 'var(--primary)' : 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: appToday ? '0 4px 14px rgba(37,99,235,0.30)' : 'none',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={appToday ? '#fff' : 'var(--primary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Próxima aplicação
              </p>
              <p style={{
                fontSize: '12px', marginTop: '2px', fontWeight: appToday ? 700 : 500,
                color: appToday ? 'var(--primary)' : 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
              }}>
                {lastApp
                  ? appToday
                    ? `Hoje! ${appDay !== undefined ? `(${WEEK_DAYS_FULL[appDay]})` : ''}`
                    : `Em ${daysUntilNext} dia${daysUntilNext !== 1 ? 's' : ''}`
                  : appDay !== undefined
                    ? `Toda ${WEEK_DAYS_FULL[appDay]}`
                    : 'Configure no perfil'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onUpdateProfile({ ...profile, lastApplication: new Date().toISOString().split('T')[0] })}
            style={{
              padding: '8px 16px', borderRadius: '12px', border: 'none',
              background: appToday ? 'var(--primary)' : 'var(--primary-light)',
              color: appToday ? '#fff' : 'var(--primary)',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, -apple-system, sans-serif',
              boxShadow: appToday ? '0 4px 14px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {lastApp ? 'Aplicado' : 'Registrar'}
          </button>
        </div>

        {lastApp && (
          <div className="progress-track" style={{ height: '5px' }}>
            <div className="progress-fill" style={{
              width: `${appPct}%`,
              background: appPct > 85
                ? 'linear-gradient(90deg, var(--primary), #F59E0B)'
                : undefined,
            }} />
          </div>
        )}
      </div>

      {/* ── Calendar ── */}
      {appDay !== undefined && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Calendário de aplicações
            </p>
          </div>
          <ApplicationCalendar profile={profile} onUpdateProfile={onUpdateProfile} compact />
        </div>
      )}

      {/* ── Stock indicator ── */}
      <button
        onClick={() => onNavigate('profile')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Gerenciar estoque"
      >
        <div style={{
          borderRadius: '24px', padding: '18px 20px',
          background: stockLow
            ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
            : appsLeft != null
              ? 'linear-gradient(135deg, #C49060 0%, #A87848 100%)'
              : 'var(--surface-2)',
          boxShadow: stockLow
            ? '0 6px 24px rgba(220,38,38,0.28)'
            : appsLeft != null
              ? '0 6px 24px rgba(196,144,96,0.32)'
              : 'var(--shadow-card)',
          border: appsLeft == null ? '1.5px dashed var(--border-strong)' : 'none',
          position: 'relative', overflow: 'hidden',
        }}>
          {appsLeft != null && (
            <div style={{
              position: 'absolute', top: '-24px', right: '-24px',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
            }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em',
                margin: 0, marginBottom: '7px',
                color: appsLeft != null ? 'rgba(255,255,255,0.60)' : 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
              }}>
                Estoque · toque para gerenciar
              </p>
              {appsLeft != null ? (
                <>
                  <p style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1, letterSpacing: '-1.5px', color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                    {appsLeft}
                    <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.80, marginLeft: '5px', letterSpacing: '1px' }}>
                      {appsLeft === 1 ? 'aplicação' : 'aplicações'}
                    </span>
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.70)', fontWeight: 600, margin: 0, marginTop: '5px', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ~{Math.round(appsLeft / 4)} {Math.round(appsLeft / 4) === 1 ? 'mês' : 'meses'} de tratamento
                    {stockLow && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {' · '}<AlertTriangle size={11} strokeWidth={2} />Repor em breve
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  Configure o controle de estoque
                </p>
              )}
            </div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: appsLeft != null ? 1 : 0.35,
            }}>
              <Package size={22} strokeWidth={2} color={appsLeft != null ? 'rgba(255,255,255,0.92)' : 'var(--text-muted)'} />
            </div>
          </div>
        </div>
      </button>

      {/* ── Quick access ── */}
      <div>
        <p className="label-base" style={{ marginBottom: '12px' }}>Acesso rápido</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <QuickCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6"  y1="20" x2="6"  y2="14"/>
              </svg>
            }
            title="Progresso"
            sub="Ver evolução"
            onClick={() => onNavigate('progress')}
          />
          <QuickCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            }
            title="Saúde"
            sub="Guias e dicas"
            onClick={() => onNavigate('health')}
          />
          <QuickCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            }
            title="Calcular"
            sub="Dose e diluição"
            onClick={() => onNavigate('calculator')}
          />
        </div>
      </div>

    </div>
  )
}
