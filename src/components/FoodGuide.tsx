import { useState, useRef } from 'react'
import {
  Sun, Droplets, Utensils, Moon, Target, Activity,
  AlertCircle, AlertTriangle, Shield, Leaf, ChevronDown,
  ChevronUp, Info, X, Plus, User,
} from 'lucide-react'
import { UserProfile } from '../types'
import { readJSON, writeJSON } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'
import {
  type IconComp, type DietSex, type MealOption,
  DIET_KCAL, MEAL_SHARES, MEAL_PROTEIN, MEAL_COLOR, MEAL_ICON,
  DIET_F, INFO_F, DIET_M, INFO_M,
} from '../data/foodPlans'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ManualItem { id: string; name: string; kcal: number }
interface DayLog     { meals: string[]; manual: ManualItem[] }
type FoodLog   = Record<string, DayLog>
type ActiveTab = 'hoje' | 'plano' | 'pouca-fome'

// ── Storage ───────────────────────────────────────────────────────────────────
const LOG_KEY  = STORAGE_KEYS.foodLog
const DIET_KEY = STORAGE_KEYS.dietProfile
function toDateStr(d = new Date()) { return d.toISOString().split('T')[0] }

// ── Componente principal ──────────────────────────────────────────────────────
export default function FoodGuide({ profile }: Props) {
  const rawSex     = profile.sex
  const detectedSex: DietSex | null = rawSex === 'female' ? 'F' : rawSex === 'male' ? 'M' : null

  const [sex, setSex]             = useState<DietSex | null>(detectedSex)
  const [activeTab, setActiveTab] = useState<ActiveTab>('hoje')
  const [log, setLog]             = useState<FoodLog>(() => readJSON(LOG_KEY, {}))

  const today  = toDateStr()
  const dayLog = log[today] ?? { meals: [], manual: [] }

  const [manualName, setManualName] = useState('')
  const [manualKcal, setManualKcal] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())

  // Persiste tizetrack_diet
  if (sex) {
    const saved = readJSON<{ sex: DietSex; dailyKcal: number } | null>(DIET_KEY, null)
    if (!saved || saved.sex !== sex) writeJSON(DIET_KEY, { sex, dailyKcal: DIET_KCAL[sex] })
  }

  function saveLog(next: DayLog) {
    const updated = { ...log, [today]: next }
    setLog(updated)
    writeJSON(LOG_KEY, updated)
  }

  function toggleMeal(id: string) {
    const meals = dayLog.meals.includes(id)
      ? dayLog.meals.filter(m => m !== id)
      : [...dayLog.meals, id]
    saveLog({ ...dayLog, meals })
  }

  function addManual() {
    const name = manualName.trim(); const kcal = parseInt(manualKcal)
    if (!name || !kcal || kcal <= 0) return
    saveLog({ ...dayLog, manual: [...dayLog.manual, { id: Date.now().toString(), name, kcal }] })
    setManualName(''); setManualKcal(''); nameRef.current?.focus()
  }

  function removeManual(id: string) {
    saveLog({ ...dayLog, manual: dayLog.manual.filter(m => m.id !== id) })
  }

  function toggleExpanded(id: string) {
    const next = new Set(expanded); next.has(id) ? next.delete(id) : next.add(id); setExpanded(next)
  }

  function selectSex(s: DietSex) {
    setSex(s); writeJSON(DIET_KEY, { sex: s, dailyKcal: DIET_KCAL[s] })
  }

  const diet      = sex === 'F' ? DIET_F : DIET_M
  const infoList  = sex === 'F' ? INFO_F : INFO_M
  const dailyKcal = sex ? DIET_KCAL[sex] : 1600

  const mealKcal        = dayLog.meals.reduce((s, id) => s + Math.round(dailyKcal * (MEAL_SHARES[id] ?? 0)), 0)
  const manualKcalTotal = dayLog.manual.reduce((s, m) => s + m.kcal, 0)
  const consumed        = mealKcal + manualKcalTotal
  const pct             = Math.min(100, Math.round((consumed / dailyKcal) * 100))
  const remaining       = Math.max(0, dailyKcal - consumed)
  const proteinEst      = sex ? dayLog.meals.reduce((s, id) => s + (MEAL_PROTEIN[sex][id] ?? 0), 0) : 0
  const proteinGoal     = `${Math.round(1.6 * profile.goalWeight)}–${Math.round(2.0 * profile.goalWeight)} g`
  const currentW        = profile.weightHistory.at(-1)?.weight ?? profile.startWeight
  const waterGoal       = `${(currentW * 35 / 1000).toFixed(1)}–${(currentW * 40 / 1000).toFixed(1)} L`

  // ── Seletor de sexo ───────────────────────────────────────────────────────
  if (!sex) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Alimentação
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Selecione seu plano para continuar</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {(['F', 'M'] as DietSex[]).map(s => {
            const bg = s === 'F'
              ? 'linear-gradient(150deg, #2D1B69 0%, #1E1145 100%)'
              : 'linear-gradient(150deg, #1E3A8A 0%, #172554 100%)'
            const accent = s === 'F' ? '#A78BFA' : '#60A5FA'
            return (
              <button key={s} onClick={() => selectSex(s)} style={{
                padding: '24px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: bg, color: '#fff', textAlign: 'center',
                boxShadow: s === 'F'
                  ? '0 8px 28px rgba(45,27,105,0.45), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : '0 8px 28px rgba(30,58,138,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
                transition: 'transform 0.15s', fontFamily: 'Inter, -apple-system, sans-serif',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px', margin: '0 auto 14px',
                  background: `${accent}20`, border: `1px solid ${accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={20} strokeWidth={1.8} color={accent} />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 5px', letterSpacing: '-0.3px' }}>
                  Plano {s === 'F' ? 'Feminino' : 'Masculino'}
                </p>
                <p style={{ fontSize: '11px', opacity: 0.55, margin: 0 }}>
                  {s === 'F' ? '1.600 kcal · 30 dias' : '2.000 kcal · 30 dias'}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'hoje', label: 'Hoje' }, { id: 'plano', label: 'Cardápio' }, { id: 'pouca-fome', label: 'Pouca Fome' },
  ]
  const accentColor = sex === 'F' ? '#A78BFA' : '#60A5FA'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>
            Alimentação
          </h2>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Plano {sex === 'F' ? 'Feminino' : 'Masculino'} · 30 dias · {dailyKcal} kcal
          </p>
        </div>
        <button onClick={() => setSex(null)} style={{
          padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}>
          Trocar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', borderRadius: '14px', padding: '4px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '8px 6px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: activeTab === t.id ? 'var(--surface)' : 'transparent',
            color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === t.id ? 'var(--shadow-xs)' : 'none',
            transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: HOJE ─────────────────────────────────────────────────── */}
      {activeTab === 'hoje' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Metas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Kcal meta', value: `${dailyKcal}` },
              { label: 'Proteína', value: proteinGoal },
              { label: 'Água', value: waterGoal },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--surface)', borderRadius: '14px',
                border: '1px solid var(--border)', padding: '10px 12px', boxShadow: 'var(--shadow-xs)',
              }}>
                <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>
                  {m.label}
                </p>
                <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.2px', fontFamily: 'Inter, sans-serif' }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Progresso kcal */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>{consumed}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>kcal consumidas</span>
              </p>
              <span style={{ fontSize: '12px', fontWeight: 700, color: pct >= 100 ? '#F59E0B' : 'var(--primary)' }}>{pct}%</span>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: '99px', height: '5px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: pct >= 100 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'var(--primary)',
                borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Proteína estimada: ~{proteinEst} g</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                {pct < 100 ? `Faltam ${remaining} kcal` : 'Meta atingida!'}
              </p>
            </div>
          </div>

          {/* Dica de ordem */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 14px', borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid var(--primary-glow)' }}>
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0, color: 'var(--primary)', marginTop: '1px' }} />
            <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              Ordem no prato: <strong>1º Proteína · 2º Carboidrato · 3º Legumes cozidos · 4º Salada crua</strong>
            </p>
          </div>

          {/* Lista de refeições */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {diet.map(meal => {
              const checked = dayLog.meals.includes(meal.id)
              const MealIcon = MEAL_ICON[meal.id] ?? Utensils
              const mealColor = MEAL_COLOR[meal.id] ?? '#10B981'
              return (
                <button key={meal.id} onClick={() => toggleMeal(meal.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '16px', textAlign: 'left',
                  background: checked ? 'var(--primary-light)' : 'var(--surface)',
                  border: `1.5px solid ${checked ? 'var(--primary-glow)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: 'var(--shadow-xs)', fontFamily: 'Inter, sans-serif',
                }}>
                  {/* Checkbox */}
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    background: checked ? 'var(--primary)' : 'var(--surface-2)',
                    border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {checked && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {/* Ícone colorido */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                    background: `${mealColor}18`,
                    border: `1px solid ${mealColor}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MealIcon size={15} strokeWidth={1.8} color={mealColor} />
                  </div>
                  {/* Texto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: checked ? 'var(--primary)' : 'var(--text-primary)', margin: 0 }}>
                        {meal.label}
                      </p>
                      {!meal.required && (
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          OPCIONAL
                        </span>
                      )}
                    </div>
                    {meal.note && (
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{meal.note}</p>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
                    ~{Math.round(dailyKcal * meal.kcalShare)} kcal
                  </span>
                </button>
              )
            })}
          </div>

          {/* Extras manuais */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>
              Extras / Lanches livres
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: dayLog.manual.length > 0 ? '10px' : '0' }}>
              <input
                ref={nameRef} type="text" value={manualName}
                onChange={e => setManualName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManual()}
                placeholder="Descrição"
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: '10px', fontSize: '13px',
                  border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                  color: 'var(--text-primary)', outline: 'none', fontFamily: 'Inter, sans-serif',
                }}
              />
              <input
                type="number" value={manualKcal}
                onChange={e => setManualKcal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManual()}
                placeholder="kcal"
                style={{
                  width: '68px', padding: '9px 10px', borderRadius: '10px', fontSize: '13px',
                  border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                  color: 'var(--text-primary)', outline: 'none', fontFamily: 'Inter, sans-serif',
                }}
              />
              <button onClick={addManual} style={{
                width: '38px', height: '38px', borderRadius: '10px', border: 'none', flexShrink: 0,
                background: 'var(--primary)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
            {dayLog.manual.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '10px', background: 'var(--surface-2)', marginTop: '6px',
              }}>
                <p style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)', margin: 0 }}>{m.name}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>{m.kcal} kcal</p>
                <button onClick={() => removeManual(m.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                }}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: PLANO ───────────────────────────────────────────────── */}
      {activeTab === 'plano' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          <ExpandCard id="principios" Icon={Activity} iconColor="#7C3AED" label="Princípios do Plano" expanded={expanded} onToggle={toggleExpanded}>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(sex === 'F' ? [
                'Preservação de massa muscular',
                'Maior saciedade com menor volume alimentar',
                'Prevenção de queda de cabelo',
                'Melhor tolerância gastrointestinal',
                'Redução da constipação',
                'Facilidade de adesão por 30 dias',
                'Flexibilidade e praticidade',
              ] : [
                'Preservação de massa muscular',
                'Alta saciedade',
                'Melhor tolerância gastrointestinal',
                'Menor risco de náusea e refluxo',
                'Prevenção de constipação',
                'Facilidade de adesão por longo prazo',
              ]).map((item, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</li>
              ))}
            </ul>
          </ExpandCard>

          <ExpandCard id="meta-prot" Icon={Target} iconColor="#10B981" label="Meta de Proteína" expanded={expanded} onToggle={toggleExpanded}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                <strong>1,6–2,0 g de proteína por kg do peso-alvo</strong> por dia.
              </p>
              <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid var(--primary-glow)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                  Peso-alvo: {profile.goalWeight} kg → meta {proteinGoal} de proteína/dia
                </p>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Obrigatórias: Café · Almoço · Jantar<br/>
                Opcionais: Lanche manhã · Lanche tarde · Ceia
              </p>
            </div>
          </ExpandCard>

          <ExpandCard id="hidratacao" Icon={Droplets} iconColor="#0EA5E9" label="Hidratação" expanded={expanded} onToggle={toggleExpanded}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                <strong>Meta: 35–40 ml de água por kg de peso corporal.</strong>
              </p>
              <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.20)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0EA5E9', margin: 0 }}>
                  Seu peso: {currentW} kg → {waterGoal} por dia
                </p>
              </div>
            </div>
          </ExpandCard>

          {diet.map(meal => (
            <ExpandCard key={meal.id} id={`meal-${meal.id}`} Icon={meal.Icon} iconColor={meal.color} label={meal.label} badge={meal.required ? undefined : 'OPCIONAL'} note={meal.note} expanded={expanded} onToggle={toggleExpanded}>
              <OptionsBlock options={meal.options} accentColor={accentColor} />
            </ExpandCard>
          ))}

          {infoList.map(info => (
            <ExpandCard key={info.id} id={info.id} Icon={info.Icon} iconColor={info.color} label={info.label} note={info.note} expanded={expanded} onToggle={toggleExpanded}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {info.items.map((item, i) => (
                  <span key={i} style={{
                    padding: '5px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                    background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                  }}>{item}</span>
                ))}
              </div>
            </ExpandCard>
          ))}
        </div>
      )}

      {/* ── TAB: POUCA FOME ──────────────────────────────────────────── */}
      {activeTab === 'pouca-fome' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Banner */}
          <div style={{
            padding: '14px 16px', borderRadius: '16px',
            background: 'linear-gradient(150deg, #0F766E 0%, #0A5952 100%)',
            boxShadow: '0 6px 20px rgba(15,118,110,0.30)',
          }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 6px' }}>
              Módulo
            </p>
            <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Semanas de Pouca Fome</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
              Quando a fome diminui muito, o objetivo não é forçar grandes refeições — mas comer menos volume com mais densidade nutricional.
            </p>
          </div>

          <ExpandCard id="sinais" Icon={AlertCircle} iconColor="#F59E0B" label="Sinais de Pouca Fome" expanded={expanded} onToggle={toggleExpanded} defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {['Saciedade com poucas colheradas', 'Náusea', 'Empachamento', 'Sensação de comida parada no estômago', 'Refluxo', 'Falta de vontade de comer', 'Pular refeições sem perceber'].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{s}</p>
                </div>
              ))}
              <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <p style={{ fontSize: '11px', color: '#B45309', margin: 0, lineHeight: 1.4 }}>
                  Nessas semanas, o cardápio tradicional pode ser substituído por refeições menores.
                </p>
              </div>
            </div>
          </ExpandCard>

          <ExpandCard id="lh-cafe" Icon={Sun} iconColor="#D97706" label="Café da Manhã" expanded={expanded} onToggle={toggleExpanded}>
            <OptionsBlock accentColor={accentColor} options={[
              { label: 'Opção 1', protein: '35–40 g', items: ['170 g de iogurte grego', '1 scoop de whey', 'Morangos ou banana'] },
              { label: 'Opção 2 — Vitamina', protein: '30–35 g', items: ['200 ml de leite semidesnatado', '1 scoop de whey', '20 g de aveia', '1 banana'] },
              { label: 'Opção 3', protein: '25–30 g', items: ['2 ovos', '2 claras', '1 fatia de pão'] },
            ]} />
          </ExpandCard>

          <ExpandCard id="lh-almoco" Icon={Utensils} iconColor="#059669" label="Almoço" expanded={expanded} onToggle={toggleExpanded}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Prato pequeno (ao invés de prato cheio)</p>
                {['100–130 g de arroz', '150–180 g de frango ou carne magra', 'Legumes cozidos', 'Sem exagerar na salada crua'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '3px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '7px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--primary-light)', border: '1px solid var(--primary-glow)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Prioridade: comer primeiro a proteína</p>
              </div>
            </div>
          </ExpandCard>

          <ExpandCard id="lh-lanches" Icon={Droplets} iconColor="#0891B2" label="Lanches" expanded={expanded} onToggle={toggleExpanded}>
            <OptionsBlock accentColor={accentColor} options={[
              { label: 'Opção 1', items: ['Whey com água'] },
              { label: 'Opção 2', items: ['Iogurte proteico'] },
              { label: 'Opção 3', items: ['Cottage ou ricota'] },
            ]} />
          </ExpandCard>

          <ExpandCard id="lh-jantar" Icon={Moon} iconColor="#7C3AED" label="Jantar" expanded={expanded} onToggle={toggleExpanded}>
            <OptionsBlock accentColor={accentColor} options={[
              { label: 'Opção 1 — Omelete', items: ['3 ovos', '3 claras', 'Pequena porção de arroz'] },
              { label: 'Opção 2 — Sanduíche', items: ['1 pão francês', '150 g de frango desfiado', '30 g de queijo branco'] },
              { label: 'Opção 3', protein: '40 g', items: ['Iogurte grego', '1 scoop de whey', '20 g de aveia'] },
            ]} />
          </ExpandCard>

          <ExpandCard id="lh-extremos" Icon={AlertTriangle} iconColor="#DC2626" label="Dias Extremos — Quase Sem Fome" expanded={expanded} onToggle={toggleExpanded}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', margin: 0 }}>Objetivo: não tentar "comer normal". Foque em bater proteína.</p>
              </div>
              {[
                { refeicao: 'Café',   items: ['Iogurte grego', 'Whey'],           protein: '40 g' },
                { refeicao: 'Almoço', items: ['180 g de frango', '100 g de arroz'], protein: '45 g' },
                { refeicao: 'Jantar', items: ['Whey', 'Leite desnatado', 'Banana'], protein: '35 g' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{r.refeicao}</p>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(16,185,129,0.10)', color: '#10B981', border: '1px solid rgba(16,185,129,0.20)' }}>
                      {r.protein} prot.
                    </span>
                  </div>
                  {r.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '7px' }} />
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 2px', lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid var(--primary-glow)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Total: ~120 g de proteína com pouco volume alimentar</p>
              </div>
            </div>
          </ExpandCard>

          <ExpandCard id="lh-tolerados" Icon={Shield} iconColor="#10B981" label="Alimentos Melhor Tolerados" expanded={expanded} onToggle={toggleExpanded}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Proteínas',     items: ['Frango desfiado', 'Peixe', 'Atum em água', 'Ovos', 'Iogurte grego', 'Cottage', 'Whey'] },
                { label: 'Carboidratos',  items: ['Arroz branco', 'Batata inglesa', 'Batata doce', 'Cuscuz', 'Pão francês', 'Banana', 'Mamão'] },
              ].map(group => (
                <div key={group.label}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{group.label}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {group.items.map((item, i) => (
                      <span key={i} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ExpandCard>

          <ExpandCard id="lh-hidra" Icon={Droplets} iconColor="#0EA5E9" label="Hidratação" expanded={expanded} onToggle={toggleExpanded}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Mesmo sem fome, a água continua sendo obrigatória. Meta: <strong>35–40 ml por kg de peso corporal.</strong>
              </p>
              <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#B45309', margin: '0 0 2px' }}>Se houver tontura, dor de cabeça ou fadiga:</p>
                <p style={{ fontSize: '12px', color: '#B45309', margin: 0, lineHeight: 1.4 }}>Muitas vezes o problema é desidratação, não falta de comida.</p>
              </div>
            </div>
          </ExpandCard>

          <ExpandCard id="lh-intestino" Icon={Leaf} iconColor="#16A34A" label="Intestino" expanded={expanded} onToggle={toggleExpanded}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Nas semanas de pouca fome costuma haver menos ingestão de fibras. Priorize diariamente:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Mamão', 'Kiwi', 'Feijão', 'Legumes', 'Água'].map((item, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.20)' }}>
                    {item}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Se necessário: Psyllium 5 g, podendo chegar a 10 g/dia.</p>
            </div>
          </ExpandCard>

          {/* Resumo */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '12px 16px', background: 'linear-gradient(150deg, #0F766E 0%, #0A5952 100%)' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 2px' }}>Estratégia</p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>Resumo</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Bater a meta de proteína', 'Manter hidratação adequada', 'Treinar musculação regularmente', 'Ser consistente por 30 dias'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
                    background: 'var(--primary-light)', border: '1px solid var(--primary-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800, color: 'var(--primary)',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.15)' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 6px' }}>Regra Mais Importante</p>
            <p style={{ fontSize: '12px', color: '#DC2626', margin: 0, lineHeight: 1.55 }}>
              Em semanas de pouca fome por causa da Tirzepatida, não tente comer como antes. Adapte o volume das refeições. Proteína, água e constância são mais importantes do que quantidade de comida.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ExpandCard ────────────────────────────────────────────────────────────────
function ExpandCard({
  id, Icon, iconColor, label, badge, note, expanded, onToggle, defaultOpen = false, children,
}: {
  id: string; Icon: IconComp; iconColor: string; label: string
  badge?: string; note?: string; expanded: Set<string>; onToggle: (id: string) => void
  defaultOpen?: boolean; children: React.ReactNode
}) {
  const isOpen = defaultOpen ? !expanded.has(id) : expanded.has(id)

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 14px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: `${iconColor}18`, border: `1px solid ${iconColor}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} strokeWidth={1.8} color={iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
            {badge && (
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {badge}
              </span>
            )}
          </div>
          {note && !isOpen && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{note}</p>
          )}
        </div>
        {isOpen
          ? <ChevronUp size={15} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          : <ChevronDown size={15} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        }
      </button>
      {isOpen && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: '14px' }}>
            {note && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <Info size={12} strokeWidth={2} style={{ flexShrink: 0, color: '#B45309', marginTop: '1px' }} />
                <p style={{ fontSize: '11px', color: '#B45309', margin: 0, lineHeight: 1.4 }}>{note}</p>
              </div>
            )}
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ── OptionsBlock ──────────────────────────────────────────────────────────────
function OptionsBlock({ options, accentColor }: { options: MealOption[]; accentColor: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {options.map((opt, i) => (
        <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ padding: '7px 12px', background: 'var(--surface-3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{opt.label}</p>
            {opt.protein && (
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(16,185,129,0.10)', color: '#10B981', border: '1px solid rgba(16,185,129,0.20)', flexShrink: 0 }}>
                {opt.protein} prot.
              </span>
            )}
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {opt.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: accentColor, flexShrink: 0, marginTop: '7px', opacity: 0.7 }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
            {opt.note && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <Info size={11} strokeWidth={2} style={{ flexShrink: 0, color: '#B45309', marginTop: '2px' }} />
                <p style={{ fontSize: '11px', color: '#B45309', margin: 0, lineHeight: 1.4 }}>{opt.note}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
