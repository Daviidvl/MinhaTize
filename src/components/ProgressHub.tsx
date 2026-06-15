import { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, BarChart2, ClipboardList } from 'lucide-react'
import { UserProfile, WeightEntry } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

type InnerTab = 'evolution' | 'summary'

const TABS: { id: InnerTab; label: string; icon: React.ReactNode }[] = [
  { id: 'evolution', label: 'Evolução', icon: <BarChart2 size={13} strokeWidth={2} /> },
  { id: 'summary',   label: 'Resumo',   icon: <ClipboardList size={13} strokeWidth={2} /> },
]

function calcIMC(w: number, h: number) {
  if (!h || !w) return null
  return w / ((h / 100) ** 2)
}

function imcLabel(v: number) {
  if (v < 18.5) return { label: 'Abaixo do peso', color: '#F59E0B' }
  if (v < 25)   return { label: 'Peso normal',    color: 'var(--primary)' }
  if (v < 30)   return { label: 'Sobrepeso',      color: '#F97316' }
  if (v < 35)   return { label: 'Obesidade I',    color: '#EF4444' }
  if (v < 40)   return { label: 'Obesidade II',   color: '#DC2626' }
  return         { label: 'Obesidade III',         color: '#B91C1C' }
}

function weightInputError(val: string): string | null {
  const w = parseFloat(val)
  if (!val || val.trim() === '') return null
  if (isNaN(w) || w <= 0) return 'Informe um peso válido.'
  if (w < 20)  return `${val}kg é muito baixo. Verifique o valor.`
  if (w > 500) return `${val}kg está fora dos limites. Verifique o valor.`
  if (w < 30)  return `${val}kg parece muito baixo. Confirme antes de salvar.`
  if (w > 350) return `${val}kg é um valor incomum. Confirme antes de salvar.`
  return null
}

export default function ProgressHub({ profile, onUpdateProfile }: Props) {
  const [tab, setTab]             = useState<InnerTab>('evolution')
  const [newWeight, setNewWeight] = useState('')
  const [weightSaved, setWeightSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }, [])

  const firstWeight = profile.startWeight
  const lastWeight  = profile.weightHistory.at(-1)?.weight ?? profile.currentWeight ?? firstWeight
  const totalLost   = firstWeight - lastWeight
  const toGoal      = lastWeight - profile.goalWeight
  const hasGoal     = profile.startWeight !== profile.goalWeight
  const pct         = hasGoal
    ? Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.goalWeight)) * 100))
    : 0

  const days  = Math.floor((Date.now() - new Date(profile.startDate).getTime()) / 864e5)
  const weeks = Math.floor(days / 7)

  const chartPoints = [{ date: profile.startDate, weight: firstWeight }, ...profile.weightHistory]
  const maxW  = Math.max(...chartPoints.map(e => e.weight))
  const minW  = Math.min(...chartPoints.map(e => e.weight))
  const range = maxW - minW || 1
  const history = [...profile.weightHistory].reverse().slice(0, 16)

  // Weekly comparison: last 2 entries
  const prev2   = profile.weightHistory.at(-2)?.weight ?? firstWeight
  const weekDiff = lastWeight - prev2

  const wInputErr = weightInputError(newWeight)
  const wBlocked  = !!newWeight && (parseFloat(newWeight) < 20 || parseFloat(newWeight) > 500)

  function addWeight() {
    const w = parseFloat(newWeight)
    if (!w || wBlocked) return
    const entry: WeightEntry = { date: new Date().toISOString().split('T')[0], weight: w }
    onUpdateProfile({ ...profile, weightHistory: [...profile.weightHistory, entry] })
    setNewWeight('')
    setWeightSaved(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setWeightSaved(false), 2000)
  }

  const imc = calcIMC(lastWeight, profile.height)

  return (
    <div data-tour="progress-main" className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Progresso</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Evolução e resumo do protocolo
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: '5px',
        background: 'var(--surface-2)', borderRadius: '14px', padding: '4px',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: '10px', border: 'none',
              background: tab === t.id ? 'var(--primary)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '11px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, -apple-system, sans-serif',
              boxShadow: tab === t.id ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {t.icon}{t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={tab} className="fade-in">

        {/* ── EVOLUÇÃO ── */}
        {tab === 'evolution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { label: 'Início',  value: `${firstWeight}kg`,  green: false },
                { label: 'Atual',   value: `${lastWeight}kg`,   green: false },
                { label: 'Perdido', value: `${totalLost > 0 ? '-' : ''}${Math.abs(totalLost).toFixed(1)}kg`, green: totalLost > 0 },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '0.9rem 0.5rem' }}>
                  <p className="label-base" style={{ marginBottom: '4px', textAlign: 'center' }}>{s.label}</p>
                  <p style={{ fontWeight: 800, fontSize: '15px', color: s.green ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Meta */}
            {hasGoal && (
              <div className="card" style={{ padding: '1rem 1.125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Meta: {profile.goalWeight}kg</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                    {toGoal <= 0 ? 'Atingida!' : `Faltam ${toGoal.toFixed(1)}kg`}
                  </span>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
                  {pct.toFixed(0)}% concluído
                </p>
              </div>
            )}

            {/* Gráfico */}
            {chartPoints.length > 1 ? (
              <div className="card">
                <p className="label-base" style={{ marginBottom: '14px' }}>Curva de peso</p>
                <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                  {chartPoints.map((entry, i) => {
                    const h = ((entry.weight - minW) / range) * 85 + 15
                    const isLast = i === chartPoints.length - 1
                    const isFirst = i === 0
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        {isLast && (
                          <span style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: 700 }}>{entry.weight}</span>
                        )}
                        <div style={{
                          width: '100%', height: `${h}px`, borderRadius: '4px 4px 0 0',
                          background: isLast
                            ? 'var(--primary)'
                            : isFirst
                              ? `rgba(124,58,237,0.5)`
                              : `rgba(16,185,129,${0.15 + (i / chartPoints.length) * 0.45})`,
                          transition: 'height 0.5s ease',
                        }} />
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Início ({firstWeight}kg)</span>
                  <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>Hoje</span>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <TrendingDown size={24} strokeWidth={2} color="var(--primary)" />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>Nenhum registro ainda</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  Adicione sua primeira pesagem abaixo
                </p>
              </div>
            )}

            {/* Registrar */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                Registrar pesagem
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number" className="input-field" placeholder="Ex: 84.5"
                    style={{ flex: 1 }}
                    value={newWeight} onChange={e => setNewWeight(e.target.value)}
                    min={20} max={500} step={0.1} inputMode="decimal"
                  />
                  {(() => {
                    const n = parseFloat(newWeight)
                    const valid = !!newWeight && !isNaN(n) && n >= 20 && n <= 500 && !wBlocked
                    return (
                      <button
                        className="btn-primary"
                        style={{ flexShrink: 0, padding: '0 20px', opacity: valid ? 1 : 0.4 }}
                        onClick={addWeight} disabled={!valid}
                      >
                        {weightSaved ? 'Salvo' : 'Salvar'}
                      </button>
                    )
                  })()}
                </div>
                {wInputErr && newWeight && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '6px',
                    padding: '8px 11px', borderRadius: '9px',
                    background: wBlocked ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)',
                    border: `1px solid ${wBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.22)'}`,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={wBlocked ? '#EF4444' : '#D97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p style={{ fontSize: '11px', color: wBlocked ? '#B91C1C' : '#92400E', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
                      {wInputErr}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico */}
            {history.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Histórico de pesagens
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {history.map((entry, i) => {
                    const prev = history[i + 1]
                    const diff = prev ? entry.weight - prev.weight : null
                    return (
                      <div key={entry.date + i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '9px 12px', borderRadius: '10px', background: 'var(--surface-2)',
                      }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {diff !== null && (
                            <span style={{
                              fontSize: '11px', fontWeight: 700,
                              color: diff < 0 ? 'var(--primary)' : diff > 0 ? '#EF4444' : 'var(--text-muted)',
                              display: 'inline-flex', alignItems: 'center', gap: '2px',
                            }}>
                              {diff < 0
                                ? <TrendingDown size={11} strokeWidth={2.5} />
                                : diff > 0
                                  ? <TrendingUp size={11} strokeWidth={2.5} />
                                  : <Minus size={11} strokeWidth={2.5} />
                              }
                              {Math.abs(diff).toFixed(1)}
                            </span>
                          )}
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
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

        {/* ── RESUMO ── */}
        {tab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* IMC */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
              borderRadius: '18px', padding: '18px 20px', color: '#fff',
              boxShadow: 'var(--shadow-green)',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                Índice de Massa Corporal
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
                    {imc ? imc.toFixed(1) : '--'}
                  </p>
                  {imc && (
                    <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px', fontWeight: 700 }}>
                      {imcLabel(imc).label}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800 }}>{profile.height}cm</p>
                  <p style={{ fontSize: '10px', opacity: 0.6, fontWeight: 600 }}>altura</p>
                </div>
              </div>
            </div>

            {/* Stats do protocolo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="stat-card">
                <p className="label-base" style={{ marginBottom: '4px' }}>Semanas</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-1px' }}>{weeks}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>{days} dias totais</p>
              </div>
              <div className="stat-card">
                <p className="label-base" style={{ marginBottom: '4px' }}>Meta concluída</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1, letterSpacing: '-1px' }}>
                  {hasGoal ? `${pct.toFixed(0)}%` : '--'}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>
                  {hasGoal ? `${toGoal.toFixed(1)}kg restantes` : 'Meta não definida'}
                </p>
              </div>
            </div>

            {/* Comparativo semanal */}
            <div className="card">
              <p className="label-base" style={{ marginBottom: '12px' }}>Variação recente</p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px', borderRadius: '12px',
                background: weekDiff < 0 ? 'var(--primary-light)' : weekDiff > 0 ? 'rgba(239,68,68,0.06)' : 'var(--surface-2)',
                border: `1px solid ${weekDiff < 0 ? 'rgba(37,99,235,0.2)' : weekDiff > 0 ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '11px',
                  background: weekDiff < 0 ? 'var(--primary-light)' : weekDiff > 0 ? 'rgba(239,68,68,0.08)' : 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: weekDiff < 0 ? 'var(--primary)' : weekDiff > 0 ? '#EF4444' : 'var(--text-muted)',
                }}>
                  {weekDiff < 0
                    ? <TrendingDown size={20} strokeWidth={2} />
                    : weekDiff > 0
                      ? <TrendingUp size={20} strokeWidth={2} />
                      : <Minus size={20} strokeWidth={2} />
                  }
                </div>
                <div>
                  <p style={{
                    fontSize: '20px', fontWeight: 800, lineHeight: 1,
                    color: weekDiff < 0 ? 'var(--primary)' : weekDiff > 0 ? '#EF4444' : 'var(--text-muted)',
                  }}>
                    {weekDiff === 0 ? 'Estável' : `${weekDiff < 0 ? '-' : '+'}${Math.abs(weekDiff).toFixed(1)}kg`}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                    {profile.weightHistory.length < 2 ? 'Registre mais pesagens' : 'entre as duas últimas medições'}
                  </p>
                </div>
              </div>
            </div>

            {/* Meta progress */}
            {hasGoal && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                    Progresso até a meta
                  </p>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>{pct.toFixed(0)}%</span>
                </div>
                <div className="progress-track" style={{ height: '10px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{profile.startWeight}kg</span>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800 }}>
                    {toGoal <= 0 ? 'Meta atingida!' : `${profile.goalWeight}kg`}
                  </span>
                </div>
              </div>
            )}

            {/* Dose */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="label-base" style={{ marginBottom: '3px' }}>Dose atual</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {profile.currentDose}mg
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="label-base" style={{ marginBottom: '3px' }}>Registros</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                  {profile.weightHistory.length}
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
