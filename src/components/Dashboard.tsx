import type { ReactNode } from 'react'
import { Package, AlertTriangle, ChevronRight, Moon, Zap } from 'lucide-react'
import { UserProfile, Tab, MEDICATION_LABELS } from '../types'
import ApplicationCalendar from './ApplicationCalendar'

interface Props {
  profile: UserProfile
  onNavigate: (tab: Tab, section?: string) => void
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
  if (v < 18.5) return { text: 'Abaixo do ideal', color: '#F59E0B' }
  if (v < 25)   return { text: 'Normal',          color: '#10B981' }
  if (v < 30)   return { text: 'Sobrepeso',        color: '#F97316' }
  if (v < 35)   return { text: 'Obeso I',          color: '#EF4444' }
  if (v < 40)   return { text: 'Obeso II',         color: '#DC2626' }
  return         { text: 'Obeso III',              color: '#B91C1C' }
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
  if (reachedGoal)               return { text: 'Meta atingida!', sub: 'Resultado incrível. Continue cuidando dos hábitos.' }
  if (lost >= 10)                return { text: `${lost.toFixed(1)} kg eliminados`, sub: 'Resultado extraordinário. Parabéns pela consistência.' }
  if (toGoal > 0 && toGoal <= 3) return { text: `Faltam apenas ${toGoal.toFixed(1)} kg`, sub: 'Você está na reta final!' }
  if (lost >= 5)                 return { text: `${lost.toFixed(1)} kg a menos`, sub: 'Cada semana de consistência conta.' }
  if (weeks >= 8)                return { text: `${weeks} semanas de protocolo`, sub: 'Consistência é o maior diferencial.' }
  if (lost >= 2)                 return { text: `Já perdeu ${lost.toFixed(1)} kg`, sub: `Faltam ${toGoal.toFixed(1)} kg para a meta.` }
  if (weeks >= 2)                return { text: `${weeks}ª semana em protocolo`, sub: 'A dedicação já está gerando resultados.' }
  if (days <= 3)                 return { text: 'Bem-vindo ao protocolo!', sub: 'Registre seu peso toda semana.' }
  return { text: 'Registre seu peso', sub: 'Acompanhe sua evolução no gráfico.' }
}

// ── Helpers de dieta ─────────────────────────────────────────────────────────

const MEAL_KCAL_SHARE: Record<string, number> = {
  'f-cafe': 0.22, 'f-lanche-m': 0.09, 'f-almoco': 0.32, 'f-lanche-t': 0.09, 'f-jantar': 0.23, 'f-ceia': 0.05,
  'm-cafe': 0.22, 'm-lanche-m': 0.09, 'm-almoco': 0.32, 'm-lanche-t': 0.09, 'm-jantar': 0.23, 'm-ceia': 0.05,
}

function getTodayStr() { return new Date().toISOString().split('T')[0] }

function getCalorieStatus(): { consumed: number; target: number; pct: number } | null {
  try {
    const diet = JSON.parse(localStorage.getItem('tizetrack_diet') || 'null')
    if (!diet?.dailyKcal) return null
    const log  = JSON.parse(localStorage.getItem('tizetrack_food_log') || '{}')
    const day  = log[getTodayStr()] ?? { meals: [], manual: [] }
    const mealKcal   = (day.meals as string[]).reduce((s: number, id: string) => s + Math.round(diet.dailyKcal * (MEAL_KCAL_SHARE[id] ?? 0)), 0)
    const manualKcal = (day.manual as { kcal: number }[]).reduce((s, m) => s + m.kcal, 0)
    const consumed   = mealKcal + manualKcal
    return { consumed, target: diet.dailyKcal, pct: Math.min(100, Math.round((consumed / diet.dailyKcal) * 100)) }
  } catch { return null }
}

// ── Dados de treino ───────────────────────────────────────────────────────────
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

// ── Dados de refeições ────────────────────────────────────────────────────────
interface MealSlot { label: string; color: string; startH: number; endH: number; sub_M: string; sub_F: string }
const MEAL_SLOTS: MealSlot[] = [
  { label: 'Café da manhã',   color: '#D97706', startH: 6,    endH: 9.5,  sub_M: 'Ovos · pão · fruta',                 sub_F: 'Ovos · queijo · fruta' },
  { label: 'Lanche manhã',    color: '#F59E0B', startH: 9.5,  endH: 12,   sub_M: 'Whey ou iogurte proteico',           sub_F: 'Whey ou iogurte proteico' },
  { label: 'Almoço',          color: '#059669', startH: 12,   endH: 14.5, sub_M: 'Arroz · feijão · frango · legumes',  sub_F: 'Arroz · feijão · frango · legumes' },
  { label: 'Lanche tarde',    color: '#0891B2', startH: 14.5, endH: 18,   sub_M: 'Whey + fruta ou sanduíche',          sub_F: 'Whey + fruta ou 2 ovos' },
  { label: 'Jantar',          color: '#7C3AED', startH: 18,   endH: 21,   sub_M: 'Arroz · proteína magra · legumes',   sub_F: 'Arroz · proteína magra · legumes' },
  { label: 'Ceia',            color: '#1E40AF', startH: 21,   endH: 24,   sub_M: 'Whey com água ou leite desnatado',   sub_F: 'Whey ou iogurte grego natural' },
]
function getMealNow(): { slot: MealSlot; isCurrent: boolean } {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  const cur = MEAL_SLOTS.find(s => h >= s.startH && h < s.endH)
  if (cur) return { slot: cur, isCurrent: true }
  return { slot: MEAL_SLOTS.find(s => s.startH > h) ?? MEAL_SLOTS[0], isCurrent: false }
}

// ── Widget de Treino ──────────────────────────────────────────────────────────
function WorkoutWidget({ onNavigate }: { onNavigate: (t: Tab, s?: string) => void }) {
  let wp: { sex: string; days: number; level: string } | null = null
  try { wp = JSON.parse(localStorage.getItem('tizetrack_workout') || 'null') } catch {}

  let wLog: string[] = []
  try { wLog = JSON.parse(localStorage.getItem('tizetrack_workout_log') || '[]') } catch {}

  const key      = wp ? `${wp.days}_${wp.sex}` : ''
  const splits   = SPLIT_INFO[key]
  const today    = new Date()
  const todayDay = today.getDay()
  const todayStr = today.toISOString().split('T')[0]
  const schedule = wp ? (WORKOUT_SCHEDULE[wp.days] ?? []) : []
  const idx      = schedule.indexOf(todayDay)
  const workout  = splits && idx !== -1 ? splits[idx] : null
  const isRest   = !!wp && !!splits && idx === -1
  const noData   = !wp || !splits
  const accent   = workout?.color ?? '#10B981'

  const monday = new Date(today)
  monday.setDate(today.getDate() - ((todayDay + 6) % 7))
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    return { ds, isToday: ds === todayStr, done: wLog.includes(ds) }
  })
  const weekDone = weekDots.filter(d => d.done).length

  if (noData) {
    return (
      <button onClick={() => onNavigate('health', 'exercise')} style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px',
        padding: '16px', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
        background: 'var(--surface)', border: '1.5px dashed var(--border-strong)',
        boxShadow: 'var(--shadow-card)', fontFamily: 'Inter, -apple-system, sans-serif',
        minHeight: '136px', transition: 'transform 0.15s, box-shadow 0.2s',
      }}>
        <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0 }}>Treino Hoje</p>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>Configurar treino</p>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Saúde → Exercícios</p>
        </div>
        <ChevronRight size={14} strokeWidth={2.5} color="var(--text-muted)" />
      </button>
    )
  }

  const bgGradient = isRest
    ? 'linear-gradient(150deg, #1B2530 0%, #111820 100%)'
    : 'linear-gradient(150deg, #0B1F17 0%, #132D20 60%, #0E221A 100%)'

  return (
    <button
      onClick={() => onNavigate('health', 'exercise')}
      style={{
        display: 'flex', flexDirection: 'column', gap: '12px',
        padding: '16px', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
        background: bgGradient, border: 'none',
        boxShadow: '0 8px 28px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.06)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#fff', transition: 'transform 0.15s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
          Treino Hoje
        </p>
        <ChevronRight size={11} strokeWidth={2.5} color="rgba(255,255,255,0.30)" />
      </div>

      {/* Badge + nome */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: isRest ? 'rgba(255,255,255,0.07)' : `${accent}22`,
          border: `1px solid ${isRest ? 'rgba(255,255,255,0.10)' : accent + '40'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isRest
            ? <Moon size={15} strokeWidth={1.5} color="rgba(255,255,255,0.50)" />
            : <span style={{ fontSize: '16px', fontWeight: 900, color: accent, lineHeight: 1 }}>{workout!.label}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {isRest ? 'Descanso' : workout!.name.includes(' + ') ? workout!.name.split(' + ')[0] : workout!.name}
          </p>
          {!isRest && workout!.name.includes(' + ') && (
            <p style={{ fontSize: '10px', fontWeight: 600, color: `${accent}aa`, margin: '0 0 1px', lineHeight: 1.2 }}>
              + {workout!.name.split(' + ').slice(1).join(' + ')}
            </p>
          )}
          <p style={{ fontSize: '9px', opacity: 0.38, margin: 0 }}>
            {isRest ? 'Recuperação ativa' : `${wp!.days}×/sem · ${LEVEL_LABEL[wp!.level] ?? wp!.level}`}
          </p>
        </div>
      </div>

      {/* Barra semanal */}
      <div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {weekDots.map((d, i) => (
            <div key={i} style={{
              flex: 1, height: '3px', borderRadius: '99px',
              background: d.done
                ? (isRest ? 'rgba(255,255,255,0.55)' : accent)
                : d.isToday ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
              outline: d.isToday ? `1.5px solid ${isRest ? 'rgba(255,255,255,0.28)' : accent + '60'}` : 'none',
              outlineOffset: '1.5px',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <p style={{ fontSize: '9px', opacity: 0.38, margin: 0, fontWeight: 600 }}>
          {weekDone}/{wp!.days} treinos esta semana
        </p>
      </div>
    </button>
  )
}

// ── Widget de Refeição ────────────────────────────────────────────────────────
function MealWidget({ profile, onNavigate }: { profile: UserProfile; onNavigate: (t: Tab, s?: string) => void }) {
  let dietProfile: { sex: string; dailyKcal: number } | null = null
  try { dietProfile = JSON.parse(localStorage.getItem('tizetrack_diet') || 'null') } catch {}

  const dietSex             = (dietProfile?.sex ?? (profile.sex === 'female' ? 'F' : 'M')) as 'M' | 'F'
  const dietSet             = !!dietProfile
  const { slot, isCurrent } = getMealNow()
  const kcal                = getCalorieStatus()

  const pct      = kcal?.pct ?? 0
  const consumed = kcal?.consumed ?? 0
  const target   = kcal?.target ?? dietProfile?.dailyKcal ?? 0
  const arcR     = 18
  const arcCirc  = 2 * Math.PI * arcR
  const arcOff   = arcCirc * (1 - pct / 100)
  const arcClr   = pct >= 100 ? '#FBBF24' : 'rgba(255,255,255,0.88)'
  const sub      = (dietSex === 'F' ? slot.sub_F : slot.sub_M).split(' · ')[0].trim()

  if (!dietSet) {
    return (
      <button onClick={() => onNavigate('health', 'food')} style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px',
        padding: '16px', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
        background: 'var(--surface)', border: '1.5px dashed var(--border-strong)',
        boxShadow: 'var(--shadow-card)', fontFamily: 'Inter, -apple-system, sans-serif',
        minHeight: '136px', transition: 'transform 0.15s, box-shadow 0.2s',
      }}>
        <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0 }}>Alimentação</p>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>Configurar plano</p>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Saúde → Alimentação</p>
        </div>
        <ChevronRight size={14} strokeWidth={2.5} color="var(--text-muted)" />
      </button>
    )
  }

  return (
    <button
      onClick={() => onNavigate('health', 'food')}
      style={{
        display: 'flex', flexDirection: 'column', gap: '12px',
        padding: '16px', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
        background: 'linear-gradient(150deg, #0B2B1C 0%, #0F3D27 60%, #0A2C1E 100%)',
        border: 'none',
        boxShadow: '0 8px 28px rgba(10,44,30,0.36), 0 2px 6px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.06)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#fff', transition: 'transform 0.15s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
          {isCurrent ? 'Agora' : 'Próxima refeição'}
        </p>
        <ChevronRight size={11} strokeWidth={2.5} color="rgba(255,255,255,0.30)" />
      </div>

      {/* Refeição + arco */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {slot.label}
          </p>
          <p style={{ fontSize: '10px', opacity: 0.50, margin: 0, fontWeight: 500 }}>{sub}</p>
        </div>
        <div style={{ position: 'relative', flexShrink: 0, width: '44px', height: '44px' }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r={arcR} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="4" />
            <circle cx="22" cy="22" r={arcR} fill="none" stroke={arcClr} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={arcCirc}
              strokeDashoffset={arcOff}
              transform="rotate(-90 22 22)"
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, margin: 0, lineHeight: 1, opacity: 0.92 }}>{pct}%</p>
          </div>
        </div>
      </div>

      {/* Progresso kcal */}
      <div>
        <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: '99px', height: '3px', overflow: 'hidden', marginBottom: '5px' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: pct >= 100 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'rgba(255,255,255,0.78)',
            borderRadius: '99px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
        <p style={{ fontSize: '9px', opacity: 0.38, margin: 0, fontWeight: 600 }}>
          {consumed} / {target} kcal hoje
        </p>
      </div>
    </button>
  )
}

// ── Tile de Stat ──────────────────────────────────────────────────────────────
function StatTile({
  label, value, unit, sub, subColor, icon,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  subColor?: string
  icon?: ReactNode
}) {
  return (
    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {icon && (
        <div style={{ position: 'absolute', top: '14px', right: '14px', opacity: 0.12 }}>
          {icon}
        </div>
      )}
      <p className="label-base" style={{ marginBottom: '8px' }}>{label}</p>
      <p className="num-display" style={{ fontSize: '28px', color: 'var(--text-primary)', margin: 0 }}>
        {value}
        {unit && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px', letterSpacing: '0' }}>{unit}</span>}
      </p>
      {sub && (
        <p style={{ fontSize: '11px', marginTop: '6px', fontWeight: 700, color: subColor ?? 'var(--primary)', margin: '6px 0 0' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Dashboard({ profile, onNavigate, onUpdateProfile }: Props) {
  const lastWeight  = profile.weightHistory.at(-1)?.weight ?? profile.currentWeight ?? profile.startWeight
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
  const daysSinceApp  = lastApp ? daysSince(lastApp) : null
  const daysUntilNext = daysSinceApp != null ? Math.max(0, 7 - daysSinceApp) : null
  const appToday      = daysUntilNext === 0

  const motivation = getMotivation(totalLost, toGoal, weeks, days, reachedGoal)

  const stock    = profile.stock
  const appsLeft = stock && profile.currentDose > 0
    ? Math.floor(stock.amouleMg / profile.currentDose) * stock.ampouleCount
    : null
  const stockLow = appsLeft != null && appsLeft < 4

  // Arco SVG para progresso da meta
  const arcR    = 44
  const arcCirc = 2 * Math.PI * arcR
  const arcOff  = arcCirc * (1 - Math.min(100, pct) / 100)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Saudação ── */}
      <div data-tour="dash-greeting" style={{ paddingTop: '2px', paddingBottom: '0' }}>
        <p style={{
          fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
          marginBottom: '6px', fontFamily: 'Inter, sans-serif',
          textTransform: 'capitalize', letterSpacing: '0.01em',
        }}>
          {getFormattedDate()}
        </p>
        <h1 style={{
          fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-0.7px', lineHeight: 1.12, margin: 0,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {getGreeting()}, {profile.name.split(' ')[0]}
        </h1>
        <p style={{
          fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px',
          fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{motivation.text}</span>
          {' · '}
          {motivation.sub}
        </p>
      </div>

      {/* ── Hero de Peso ── */}
      <button
        data-tour="dash-weight-hero"
        onClick={() => onNavigate('progress')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Ver evolução de peso"
      >
        <div style={{
          background: 'linear-gradient(140deg, #1A40BE 0%, #1D4ED8 40%, #2563EB 75%, #2F77F2 100%)',
          borderRadius: '26px', padding: '22px 22px 20px',
          boxShadow: '0 10px 40px rgba(29,78,216,0.32), 0 2px 8px rgba(29,78,216,0.18)',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decoração de fundo */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', left: '20%',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative' }}>
            {/* Label topo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Peso atual
              </p>
              <p style={{ fontSize: '10px', opacity: 0.45, margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                {weeks === 0 ? 'Início' : `${weeks}ª semana`} · {MEDICATION_LABELS[profile.medication]}
              </p>
            </div>

            {/* Peso + arco */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
              {/* Coluna esquerda — peso e variação */}
              <div>
                <p className="num-display" style={{ fontSize: '56px', color: '#fff', margin: '0 0 4px' }}>
                  {lastWeight}
                  <span style={{ fontSize: '18px', opacity: 0.60, marginLeft: '5px', fontWeight: 600, letterSpacing: '0' }}>kg</span>
                </p>
                {totalLost > 0 ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(0,212,168,0.18)', border: '1px solid rgba(0,212,168,0.30)', borderRadius: '99px', padding: '4px 10px' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M4.5 8L4.5 1M1 4.5L4.5 1L8 4.5" stroke="rgba(0,212,168,0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(0,212,168,0.95)', letterSpacing: '-0.3px' }}>
                      {totalLost.toFixed(1)} kg eliminados
                    </span>
                  </div>
                ) : totalLost < 0 ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(249,115,22,0.16)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: '99px', padding: '4px 10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(251,146,60,0.95)', letterSpacing: '-0.3px' }}>
                      +{Math.abs(totalLost).toFixed(1)} kg
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', opacity: 0.40, fontWeight: 500 }}>Início do protocolo</span>
                )}
              </div>

              {/* Arco de progresso SVG */}
              {hasGoal && (
                <div style={{ position: 'relative', flexShrink: 0, width: '108px', height: '108px' }}>
                  <svg width="108" height="108" viewBox="0 0 108 108">
                    <circle cx="54" cy="54" r={arcR} fill="none"
                      stroke="rgba(255,255,255,0.10)" strokeWidth="7" />
                    <circle cx="54" cy="54" r={arcR} fill="none"
                      stroke={reachedGoal ? 'rgba(0,212,168,0.92)' : 'rgba(255,255,255,0.85)'}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={arcCirc}
                      strokeDashoffset={arcOff}
                      transform="rotate(-90 54 54)"
                      style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
                    <p className="num-display" style={{ fontSize: '20px', color: '#fff', margin: 0 }}>
                      {pct.toFixed(0)}%
                    </p>
                    <p style={{ fontSize: '9px', opacity: 0.45, margin: 0, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                      {reachedGoal ? 'concluído' : 'da meta'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de progresso */}
            {hasGoal && (
              <>
                <div style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '99px', height: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: reachedGoal
                      ? 'linear-gradient(90deg, rgba(0,212,168,0.90), rgba(0,212,168,1))'
                      : '#fff',
                    borderRadius: '99px',
                    transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', opacity: 0.42, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                    {profile.startWeight} kg início
                  </span>
                  <span style={{ fontSize: '10px', opacity: 0.75, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                    {reachedGoal ? '🎯 Meta atingida!' : `Faltam ${toGoal.toFixed(1)} kg`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      {/* ── Widgets diários ── */}
      <div data-tour="dash-widgets" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <WorkoutWidget onNavigate={onNavigate} />
        <MealWidget profile={profile} onNavigate={onNavigate} />
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatTile
          label="IMC"
          value={imc ? imc.toFixed(1) : '—'}
          sub={imcInfo?.text}
          subColor={imcInfo?.color}
          icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
        />

        {/* Tile de Dose */}
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '14px', right: '14px', opacity: 0.10 }}>
            <Zap size={36} strokeWidth={1.5} />
          </div>
          <p className="label-base" style={{ marginBottom: '8px' }}>Dose atual</p>
          <p className="num-display" style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {profile.currentDose}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px', letterSpacing: '0' }}>mg</span>
          </p>
          {daysUntilNext !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: appToday ? 'rgba(16,185,129,0.10)' : 'var(--primary-light)',
              border: `1px solid ${appToday ? 'rgba(16,185,129,0.22)' : 'var(--primary-glow)'}`,
              borderRadius: '99px', padding: '2px 8px', marginBottom: '4px',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: appToday ? '#10B981' : 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: appToday ? '#10B981' : 'var(--primary)' }}>
                {appToday ? 'Aplicar hoje!' : `Próxima em ${daysUntilNext}d`}
              </span>
            </div>
          )}
          {DOSE_PHASE[profile.currentDose] && (
            <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
              {DOSE_PHASE[profile.currentDose]}
            </p>
          )}
        </div>
      </div>

      {/* ── Indicador de estoque ── */}
      <button
        onClick={() => onNavigate('profile', 'stock')}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        aria-label="Gerenciar estoque"
      >
        <div style={{
          borderRadius: '26px', padding: '18px 20px',
          background: stockLow
            ? 'linear-gradient(135deg, #C81E1E 0%, #991B1B 100%)'
            : appsLeft != null
              ? 'linear-gradient(135deg, #A87040 0%, #8B5C30 100%)'
              : 'var(--surface)',
          boxShadow: stockLow
            ? '0 8px 28px rgba(200,30,30,0.28), 0 2px 6px rgba(0,0,0,0.16)'
            : appsLeft != null
              ? '0 8px 28px rgba(168,112,64,0.28), 0 2px 6px rgba(0,0,0,0.16)'
              : 'var(--shadow-card)',
          border: appsLeft == null ? '1.5px dashed var(--border-strong)' : 'none',
          position: 'relative', overflow: 'hidden',
          transition: 'transform 0.15s, box-shadow 0.2s',
        }}>
          {appsLeft != null && (
            <>
              <div style={{ position: 'absolute', top: '-32px', right: '-32px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em',
                margin: 0, marginBottom: '8px',
                color: appsLeft != null ? 'rgba(255,255,255,0.50)' : 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
              }}>
                Estoque de medicamento
              </p>
              {appsLeft != null ? (
                <>
                  <p className="num-display" style={{ fontSize: '40px', color: '#fff', margin: '0 0 4px' }}>
                    {appsLeft}
                    <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.65, marginLeft: '6px', letterSpacing: '0.02em' }}>
                      {appsLeft === 1 ? 'aplicação' : 'aplicações'}
                    </span>
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: 0, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ~{Math.round(appsLeft / 4)} {Math.round(appsLeft / 4) === 1 ? 'mês' : 'meses'} restantes
                    {stockLow && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        · <AlertTriangle size={10} strokeWidth={2.5} style={{ flexShrink: 0 }} />Repor em breve
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
              background: appsLeft != null ? 'rgba(255,255,255,0.14)' : 'var(--surface-2)',
              border: appsLeft != null ? '1px solid rgba(255,255,255,0.16)' : '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: appsLeft != null ? 1 : 0.35,
            }}>
              <Package size={22} strokeWidth={1.8} color={appsLeft != null ? 'rgba(255,255,255,0.90)' : 'var(--text-muted)'} />
            </div>
          </div>
        </div>
      </button>

      {/* ── Calendário de aplicações ── */}
      <div data-tour="dash-calendar" className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Calendário de aplicações
            </p>
          </div>
        </div>
        <ApplicationCalendar profile={profile} onUpdateProfile={onUpdateProfile} compact />
      </div>

    </div>
  )
}
