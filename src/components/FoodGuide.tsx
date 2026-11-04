import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { User } from 'lucide-react'
import { UserProfile } from '../types'
import Hydration from './Hydration'
import FoodToday from './FoodToday'
import FoodMenu from './FoodMenu'
import FoodInfo from './FoodInfo'
import FoodMealSheet from './FoodMealSheet'
import { Segmented } from './FoodShared'
import { readJSON, writeJSON } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'
import {
  type DietSex, type FoodView, type FoodTab, type MealOption,
  DIET_KCAL, MEAL_SHARES, MEAL_PROTEIN, DIET_F, DIET_M, FOOD_TABS,
} from '../data/foodPlans'
import { getMondayOf } from '../data/healthHubContent'
import { toDateStr } from '../utils/exerciseUtils'
import {
  type AppetiteMode, type DayLog, type FoodLog, type ManualItem, type WaterLog, EMPTY_DAY,
  waterGoalMl, waterTotal, mealDays, waterDays, dayProtein, dayKcal, parseProtein,
  proteinGoalG, proteinRange, formatMl, summarizeItems,
} from '../utils/foodUtils'
import { alpha } from '../utils/color'
import { notifyRemindersChanged } from '../utils/reminderUtils'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  view: FoodView | null  // null = abas Hoje / Cardápio / Guia
  onViewChange: (v: FoodView | null) => void
}

const LOG_KEY   = STORAGE_KEYS.foodLog
const DIET_KEY  = STORAGE_KEYS.dietProfile
const WATER_KEY = STORAGE_KEYS.waterLog

// Sintomas da semana que pedem refeições menores (id → como aparece na frase)
const APPETITE_SYMPTOMS: Record<string, string> = {
  appetite: 'falta de apetite', nausea: 'náusea', vomiting: 'vômito', reflux: 'refluxo',
}

interface Toast { id: number; text: string; undo?: () => void }

export default function FoodGuide({ profile, view, onViewChange }: Props) {
  const detectedSex: DietSex | null = profile.sex === 'female' ? 'F' : profile.sex === 'male' ? 'M' : null

  // O plano já escolhido vale mais que o sexo do perfil (o componente remonta a cada troca de tela)
  const [sex, setSex] = useState<DietSex | null>(
    () => readJSON<{ sex: DietSex } | null>(DIET_KEY, null)?.sex ?? detectedSex
  )
  const [log, setLog]         = useState<FoodLog>(() => readJSON(LOG_KEY, {}))
  const [water, setWater]     = useState<WaterLog>(() => readJSON(WATER_KEY, {}))
  const [tab, setTab]         = useState<FoodTab>('today')
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [toast, setToast]     = useState<Toast | null>(null)

  // Persiste tizetrack_diet (o Início lê a meta de kcal daqui)
  useEffect(() => {
    if (!sex) return
    const saved = readJSON<{ sex: DietSex; dailyKcal: number } | null>(DIET_KEY, null)
    if (!saved || saved.sex !== sex) writeJSON(DIET_KEY, { sex, dailyKcal: DIET_KCAL[sex] })
  }, [sex])

  // Aviso some sozinho
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const today = toDateStr(new Date())
  const day: DayLog = log[today] ?? EMPTY_DAY
  // Semanas de pouca fome duram dias: sem escolha hoje, herda o último modo usado
  const mode: AppetiteMode = day.mode ?? lastMode(log, today)

  const diet        = sex === 'M' ? DIET_M : DIET_F
  const dailyKcal   = sex ? DIET_KCAL[sex] : DIET_KCAL.F
  const mealProtein = MEAL_PROTEIN[sex ?? 'F']
  const currentW    = profile.weightHistory.at(-1)?.weight ?? profile.currentWeight ?? profile.startWeight
  const goalMl      = waterGoalMl(currentW)
  const liters      = (mlPerKg: number) => (currentW * mlPerKg / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const waterRange  = `${liters(35)}–${liters(40)} L`
  const required    = diet.filter(m => m.required).map(m => m.id)

  // Sintoma de apetite mais forte da semana, para sugerir o modo "Pouca fome"
  const week        = profile.sideEffects?.find(e => e.date === getMondayOf(new Date()))
  const appetiteSym = week?.symptoms
    .filter(s => s.intensity > 0 && APPETITE_SYMPTOMS[s.id])
    .sort((a, b) => b.intensity - a.intensity)[0]

  // ── Gravação ────────────────────────────────────────────────────────────────
  function saveDay(next: DayLog) {
    setLog(prev => {
      const updated = { ...prev, [today]: next }
      writeJSON(LOG_KEY, updated)
      return updated
    })
  }

  function saveWater(entries: number[]) {
    setWater(prev => {
      const updated = { ...prev, [today]: entries }
      writeJSON(WATER_KEY, updated)
      return updated
    })
    notifyRemindersChanged()
  }

  function notify(text: string, undo?: () => void) {
    setToast({ id: Date.now(), text, undo })
  }

  const mealName = (id: string) => diet.find(m => m.id === id)?.label ?? 'Refeição'
  const done     = (id: string) => `${mealName(id)} ${id === 'ceia' ? 'registrada' : 'registrado'}`

  function pickMeal(mealId: string, option: MealOption) {
    const before = day
    const protein = parseProtein(option.protein) ?? mealProtein[mealId] ?? 0
    saveDay({
      ...day,
      meals: day.meals.includes(mealId) ? day.meals : [...day.meals, mealId],
      picks: { ...day.picks, [mealId]: { label: option.label, protein, summary: summarizeItems(option.items) } },
    })
    setSheetId(null)
    notify(`${done(mealId)} · ${protein} g de proteína`, () => saveDay(before))
  }

  function markDone(mealId: string) {
    const before = day
    const picks = { ...day.picks }
    delete picks[mealId]
    saveDay({ ...day, meals: [...day.meals, mealId], picks })
    setSheetId(null)
    notify(done(mealId), () => saveDay(before))
  }

  function unmark(mealId: string) {
    const before = day
    const picks = { ...day.picks }
    delete picks[mealId]
    saveDay({ ...day, meals: day.meals.filter(m => m !== mealId), picks })
    setSheetId(null)
    notify(`${mealName(mealId)} desmarcad${mealId === 'ceia' ? 'a' : 'o'}`, () => saveDay(before))
  }

  function addExtra(item: Omit<ManualItem, 'id'>) {
    const before = day
    saveDay({ ...day, manual: [...day.manual, { ...item, id: Date.now().toString() }] })
    notify(`Extra adicionado: ${item.name}${item.protein ? ` (+${item.protein} g)` : ''}`, () => saveDay(before))
  }

  function removeExtra(id: string) {
    const before = day
    saveDay({ ...day, manual: day.manual.filter(m => m.id !== id) })
    notify('Extra removido', () => saveDay(before))
  }

  function addWater(ml: number) {
    const before = water[today] ?? []
    saveWater([...before, ml])
    notify(`+${formatMl(ml)} ml de água`, () => saveWater(before))
  }

  function selectSex(s: DietSex) {
    setSex(s)
    writeJSON(DIET_KEY, { sex: s, dailyKcal: DIET_KCAL[s] })
  }

  // ── Seletor de plano ────────────────────────────────────────────────────────
  // A hidratação não depende do plano: o widget do Início abre direto nela
  if (!sex && view !== 'hydration') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '0 2px' }}>
          <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Escolha seu plano alimentar</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>As metas e o cardápio se ajustam ao plano. Dá para trocar depois na aba Guia.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {(['F', 'M'] as DietSex[]).map(s => (
            <button key={s} onClick={() => selectSex(s)} className="meal-row" style={{
              padding: '24px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: 'var(--g-hero)', color: '#fff', textAlign: 'center',
              boxShadow: '0 8px 28px rgba(var(--shadow-rgb),0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px', margin: '0 auto 14px',
                background: alpha('var(--sky)', 13), border: `1px solid ${alpha('var(--sky)', 25)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={20} strokeWidth={1.75} color="var(--sky)" />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 5px', letterSpacing: '-0.3px' }}>
                Plano {s === 'F' ? 'Feminino' : 'Masculino'}
              </p>
              <p style={{ fontSize: '11px', margin: 0, opacity: 0.8 }}>
                {DIET_KCAL[s].toLocaleString('pt-BR')} kcal · 30 dias
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'hydration') {
    return (
      <Hydration
        entries={water[today] ?? []} goalMl={goalMl} goalRange={waterRange} weight={currentW}
        doneDays={waterDays(water, goalMl)} onChange={saveWater}
      />
    )
  }

  const sheetMeal = diet.find(m => m.id === sheetId)
  const goal      = proteinGoalG(profile.goalWeight)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Segmented label="Seções da alimentação" options={FOOD_TABS} value={tab} onChange={t => { setTab(t); window.scrollTo({ top: 0 }) }} />

      <div key={tab} className="fade-in">
        {tab === 'today' && (
          <FoodToday
            diet={diet} day={day} mode={mode}
            onModeChange={m => saveDay({ ...day, mode: m })}
            symptomHint={appetiteSym ? APPETITE_SYMPTOMS[appetiteSym.id] : null}
            mealProtein={mealProtein}
            protein={dayProtein(day, mealProtein)} proteinGoal={goal}
            kcal={dayKcal(day, dailyKcal, MEAL_SHARES)} dailyKcal={dailyKcal}
            waterMl={waterTotal(water[today])} waterGoalMl={goalMl}
            mealDoneDays={mealDays(log, required)}
            onOpenMeal={setSheetId}
            onAddExtra={addExtra} onRemoveExtra={removeExtra}
            onAddWater={addWater} onOpenHydration={() => onViewChange('hydration')}
          />
        )}
        {tab === 'menu' && (
          <FoodMenu diet={diet} dailyKcal={dailyKcal} mealProtein={mealProtein} todayMode={mode} day={day} onRegister={pickMeal} />
        )}
        {tab === 'guide' && sex && (
          <FoodInfo
            sex={sex} dailyKcal={dailyKcal} proteinRange={proteinRange(profile.goalWeight)}
            goalWeight={profile.goalWeight} waterRange={waterRange} onChangePlan={() => setSex(null)}
          />
        )}
      </div>

      {sheetMeal && (
        <FoodMealSheet
          meal={sheetMeal} mode={mode}
          done={day.meals.includes(sheetMeal.id)} pick={day.picks?.[sheetMeal.id]}
          defaultProtein={mealProtein[sheetMeal.id] ?? 0}
          onPick={opt => pickMeal(sheetMeal.id, opt)}
          onMarkDone={() => markDone(sheetMeal.id)}
          onUnmark={() => unmark(sheetMeal.id)}
          onClose={() => setSheetId(null)}
        />
      )}

      {toast && <ToastBar key={toast.id} toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Último modo de fome registrado antes de hoje
function lastMode(log: FoodLog, today: string): AppetiteMode {
  const prev = Object.keys(log).filter(d => d < today && log[d].mode).sort().at(-1)
  return prev ? log[prev].mode! : 'normal'
}

// ── Aviso com "Desfazer" ──────────────────────────────────────────────────────
function ToastBar({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return createPortal(
    <div style={{
      position: 'fixed', left: 0, right: 0, zIndex: 150, padding: '0 16px', pointerEvents: 'none',
      bottom: 'calc(92px + env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'center',
    }}>
    <div role="status" aria-live="polite" style={{
      width: '100%', maxWidth: '420px', pointerEvents: 'auto',
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 12px 12px 16px', borderRadius: '16px',
      background: 'var(--g-hero)', color: '#fff',
      boxShadow: '0 10px 32px rgba(var(--shadow-rgb),0.32)',
      animation: 'fade-up 0.25s var(--ease-smooth) both',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <p style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 600, margin: 0 }}>{toast.text}</p>
      {toast.undo && (
        <button onClick={() => { toast.undo?.(); onClose() }} style={{
          padding: '6px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
          background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: '12px', fontWeight: 800, fontFamily: 'inherit',
        }}>
          Desfazer
        </button>
      )}
    </div>
    </div>,
    document.body,
  )
}
