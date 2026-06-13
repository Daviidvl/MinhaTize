import { Package, AlertTriangle, ChevronRight, Moon } from 'lucide-react'
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

// ── Shared helpers ───────────────────────────────────────────────────────────

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
function getMealNow(): { slot: MealSlot; isCurrent: boolean } {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  const cur = MEAL_SLOTS.find(s => h >= s.startH && h < s.endH)
  if (cur) return { slot: cur, isCurrent: true }
  return { slot: MEAL_SLOTS.find(s => s.startH > h) ?? MEAL_SLOTS[0], isCurrent: false }
}

// ── Workout widget ────────────────────────────────────────────────────────────
function WorkoutWidget({ onNavigate }: { onNavigate: (t: Tab, s?: string) => void }) {
  let wp: { sex: string; days: number; level: string } | null = null
  try { wp = JSON.parse(localStorage.getItem('tizetrack_workout') || 'null') } catch {}

  let wLog: string[] = []
  try { wLog = JSON.parse(localStorage.getItem('tizetrack_workout_log') || '[]') } catch {}

  const key       = wp ? `${wp.days}_${wp.sex}` : ''
  const splits    = SPLIT_INFO[key]
  const today     = new Date()
  const todayDay  = today.getDay()
  const todayStr  = today.toISOString().split('T')[0]
  const schedule  = wp ? (WORKOUT_SCHEDULE[wp.days] ?? []) : []
  const idx       = schedule.indexOf(todayDay)
  const workout   = splits && idx !== -1 ? splits[idx] : null
  const isRest    = !!wp && !!splits && idx === -1
  const noData    = !wp || !splits
  const accent    = workout?.color ?? '#10B981'

  // Mon–Sun dots for current week
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
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '14px', borderRadius: '18px', textAlign: 'left', cursor: 'pointer',
        background: 'var(--surface)', border: '1.5px dashed var(--border-strong)',
        boxShadow: 'var(--shadow-card)', fontFamily: 'Inter, -apple-system, sans-serif', minHeight: '130px',
      }}>
        <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0 }}>Treino Hoje</p>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>Configurar treino</p>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Saúde → Exercícios</p>
        </div>
        <ChevronRight size={14} strokeWidth={2.5} color="var(--text-muted)" />
      </button>
    )
  }

  return (
    <button
      onClick={() => onNavigate('health', 'exercise')}
      style={{
        display: 'flex', flexDirection: 'column', gap: '11px',
        padding: '14px', borderRadius: '18px', textAlign: 'left', cursor: 'pointer',
        background: isRest
          ? 'linear-gradient(155deg, #1A2420 0%, #101A16 100%)'
          : 'linear-gradient(155deg, #0C1F18 0%, #132D22 60%, #0F2219 100%)',
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#fff', transition: 'transform 0.15s ease',
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.50, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
          Treino Hoje
        </p>
        <ChevronRight size={11} strokeWidth={2.5} color="rgba(255,255,255,0.35)" />
      </div>

      {/* Badge + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
          background: isRest ? 'rgba(255,255,255,0.07)' : `${accent}28`,
          border: `1.5px solid ${isRest ? 'rgba(255,255,255,0.10)' : accent + '45'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isRest
            ? <Moon size={16} strokeWidth={1.5} color="rgba(255,255,255,0.55)" />
            : <span style={{ fontSize: '17px', fontWeight: 900, color: accent, lineHeight: 1 }}>{workout!.label}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: '0 0 1px', letterSpacing: '-0.3px', lineHeight: 1.25 }}>
            {isRest ? 'Descanso' : workout!.name.includes(' + ') ? workout!.name.split(' + ')[0] : workout!.name}
          </p>
          {!isRest && workout!.name.includes(' + ') && (
            <p style={{ fontSize: '10px', fontWeight: 600, color: `${accent}bb`, margin: '0 0 1px', lineHeight: 1.2 }}>
              + {workout!.name.split(' + ').slice(1).join(' + ')}
            </p>
          )}
          <p style={{ fontSize: '9px', opacity: 0.40, margin: 0 }}>
            {isRest ? 'Recuperação ativa' : `${wp!.days}×/sem · ${LEVEL_LABEL[wp!.level] ?? wp!.level}`}
          </p>
        </div>
      </div>

      {/* Week bar segments */}
      <div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {weekDots.map((d, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '99px',
              background: d.done
                ? (isRest ? 'rgba(255,255,255,0.55)' : accent)
                : d.isToday ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
              outline: d.isToday ? '1.5px solid rgba(255,255,255,0.30)' : 'none',
              outlineOffset: '1.5px',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <p style={{ fontSize: '9px', opacity: 0.40, margin: 0, fontWeight: 600 }}>
          {weekDone}/{wp!.days} treinos esta semana
        </p>
      </div>
    </button>
  )
}

// ── Meal widget ───────────────────────────────────────────────────────────────
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
  const arcR     = 20
  const arcCirc  = 2 * Math.PI * arcR
  const arcOff   = arcCirc * (1 - pct / 100)
  const arcClr   = pct >= 100 ? '#FBBF24' : 'rgba(255,255,255,0.85)'
  const sub      = (dietSex === 'F' ? slot.sub_F : slot.sub_M).split(' · ')[0].trim()

  if (!dietSet) {
    return (
      <button onClick={() => onNavigate('health', 'food')} style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '14px', borderRadius: '18px', textAlign: 'left', cursor: 'pointer',
        background: 'var(--surface)', border: '1.5px dashed var(--border-strong)',
        boxShadow: 'var(--shadow-card)', fontFamily: 'Inter, -apple-system, sans-serif', minHeight: '130px',
      }}>
        <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0 }}>Alimentação</p>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>Configurar plano</p>
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
        display: 'flex', flexDirection: 'column', gap: '11px',
        padding: '14px', borderRadius: '18px', textAlign: 'left', cursor: 'pointer',
        background: 'linear-gradient(155deg, #1A6B3C 0%, #0F4E2C 60%, #0A3820 100%)',
        border: 'none',
        boxShadow: '0 8px 24px rgba(10,56,32,0.40), 0 2px 6px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#fff', transition: 'transform 0.15s ease',
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.50, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
          {isCurrent ? 'Agora' : 'Próxima refeição'}
        </p>
        <ChevronRight size={11} strokeWidth={2.5} color="rgba(255,255,255,0.35)" />
      </div>

      {/* Meal name + mini arc */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
            {slot.label}
          </p>
          <p style={{ fontSize: '10px', opacity: 0.55, margin: 0, fontWeight: 500 }}>{sub}</p>
        </div>
        {/* Mini SVG arc */}
        <div style={{ position: 'relative', flexShrink: 0, width: '46px', height: '46px' }}>
          <svg width="46" height="46" viewBox="0 0 46 46">
            <circle cx="23" cy="23" r={arcR} fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="4" />
            <circle cx="23" cy="23" r={arcR} fill="none" stroke={arcClr} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={arcCirc}
              strokeDashoffset={arcOff}
              transform="rotate(-90 23 23)"
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, margin: 0, lineHeight: 1, opacity: 0.95 }}>{pct}%</p>
          </div>
        </div>
      </div>

      {/* Kcal progress */}
      <div>
        <div style={{ background: 'rgba(255,255,255,0.11)', borderRadius: '99px', height: '3px', overflow: 'hidden', marginBottom: '5px' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: pct >= 100 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'rgba(255,255,255,0.80)',
            borderRadius: '99px', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
        <p style={{ fontSize: '9px', opacity: 0.42, margin: 0, fontWeight: 600 }}>
          {consumed} / {target} kcal hoje
        </p>
      </div>
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

      {/* ── Daily widgets ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <WorkoutWidget onNavigate={onNavigate} />
        <MealWidget profile={profile} onNavigate={onNavigate} />
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <StatTile
          label="IMC"
          value={imc ? imc.toFixed(1) : '--'}
          sub={imcInfo?.text}
          subColor={imcInfo?.color}
        />
        <div className="stat-card">
          <p className="label-base" style={{ marginBottom: '6px' }}>Dose atual</p>
          <p style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px', color: 'var(--text-primary)', margin: 0 }}>
            {profile.currentDose}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>mg</span>
          </p>
          <div style={{ marginTop: '7px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {daysUntilNext !== null && (
              <p style={{ fontSize: '11px', fontWeight: 700, margin: 0, color: appToday ? '#10B981' : 'var(--primary)' }}>
                {appToday ? 'Aplicar hoje!' : `Próxima: ${daysUntilNext}d`}
              </p>
            )}
            {(DOSE_PHASE[profile.currentDose]) && (
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                {DOSE_PHASE[profile.currentDose]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stock indicator ── */}
      <button
        onClick={() => onNavigate('profile', 'stock')}
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

      {/* ── Calendar ── */}
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

    </div>
  )
}
