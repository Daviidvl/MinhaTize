import { useState } from 'react'
import { UserProfile, WEEK_DAYS } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  compact?: boolean
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

function getLog(profile: UserProfile): string[] {
  if (profile.applicationLog) return profile.applicationLog
  if (!profile.lastApplication || profile.applicationDay === undefined) return []
  const last = new Date(profile.lastApplication + 'T12:00:00')
  const log: string[] = []
  for (let w = 0; w < 52; w++) {
    const d = new Date(last)
    d.setDate(last.getDate() - w * 7)
    if (d.getDay() !== profile.applicationDay) break
    log.push(toDateStr(d))
    if (w > 0 && d < new Date(profile.startDate + 'T12:00:00')) break
  }
  return log
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

function fmtDateShort(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function getGlobalNextApp(appDayNum: number, todayStr: string): string {
  const today = new Date(todayStr + 'T12:00:00')
  const daysUntil = (appDayNum - today.getDay() + 7) % 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return toDateStr(next)
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconCheck({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="6.5" r="5.5" />
      <polyline points="4 6.5 5.8 8.2 9 4.5"/>
    </svg>
  )
}
function IconClock({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="6.5" r="5.5" />
      <polyline points="6.5 3.5 6.5 6.5 8.5 7.5"/>
    </svg>
  )
}
function IconAlert({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 1.5L1 11h11L6.5 1.5z"/>
      <line x1="6.5" y1="5.5" x2="6.5" y2="8"/>
      <circle cx="6.5" cy="9.8" r="0.5" fill={color} stroke="none"/>
    </svg>
  )
}
function IconWarningLarge() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.07 3.86L1.5 20a2 2 0 001.71 3H22.8a2 2 0 001.71-3L15.93 3.86a2 2 0 00-3.42 0z"/>
      <line x1="13" y1="10" x2="13" y2="15"/>
      <circle cx="13" cy="18.5" r="1" fill="#F59E0B" stroke="none"/>
    </svg>
  )
}
function IconTrashLarge() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ApplicationCalendar({ profile, onUpdateProfile, compact = false }: Props) {
  const today   = new Date()
  const [view, setView]           = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [noteInput, setNoteInput]     = useState('')
  const [sheetMode, setSheetMode]     = useState<'detail' | 'confirm-early' | 'confirm-delete'>('detail')

  const appDay      = profile.applicationDay
  const todayStr    = toDateStr(today)
  const log         = getLog(profile)
  const notes       = profile.applicationNotes ?? {}
  const confirmedDates = new Set(log)
  const globalNextApp  = appDay !== undefined ? getGlobalNextApp(appDay, todayStr) : undefined

  function prevMonth() {
    setView(v => { const d = new Date(v.year, v.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }
  function nextMonth() {
    setView(v => { const d = new Date(v.year, v.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }

  const firstDay    = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const appDatesInMonth: string[] = []
  if (appDay !== undefined) {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(view.year, view.month, d)
      if (date.getDay() === appDay) appDatesInMonth.push(toDateStr(date))
    }
  }

  const nextApp = appDatesInMonth.find(d => d >= todayStr)

  function doRegister(dateStr: string) {
    const newLog = [...log.filter(d => d !== dateStr), dateStr].sort()
    const lastApp = newLog.at(-1) ?? dateStr
    onUpdateProfile({ ...profile, applicationLog: newLog, lastApplication: lastApp })
    setSelectedDay(null)
    setSheetMode('detail')
  }

  function doDelete(dateStr: string) {
    const newLog = log.filter(d => d !== dateStr)
    const lastApp = newLog.at(-1) ?? profile.lastApplication
    onUpdateProfile({ ...profile, applicationLog: newLog, lastApplication: lastApp })
    setSelectedDay(null)
    setSheetMode('detail')
  }

  function saveNote(dateStr: string, text: string) {
    const newNotes = { ...notes, [dateStr]: text }
    onUpdateProfile({ ...profile, applicationNotes: newNotes })
  }

  function openSheet(dateStr: string) {
    setSelectedDay(dateStr)
    setNoteInput(notes[dateStr] ?? '')
    setSheetMode('detail')
  }

  function handleDayClick(dateStr: string, isConfirmed: boolean, isFuture: boolean, isAppDayCell: boolean) {
    if (!isAppDayCell && !isConfirmed) return
    if (isFuture) return
    openSheet(dateStr)
  }

  function handleDetailAction() {
    if (!selectedDay || selectedDay > todayStr) return
    if (confirmedDates.has(selectedDay)) {
      setSheetMode('confirm-delete')
    } else if (selectedDay === todayStr && globalNextApp && todayStr < globalNextApp) {
      setSheetMode('confirm-early')
    } else {
      doRegister(selectedDay)
    }
  }

  function closeSheet() {
    setSelectedDay(null)
    setSheetMode('detail')
  }

  // ── Sheet derived values ─────────────────────────────────────────────────────
  const selIsConfirmed = selectedDay ? confirmedDates.has(selectedDay) : false
  const selIsPast      = selectedDay ? selectedDay < todayStr : false
  const selIsFuture    = selectedDay ? selectedDay > todayStr : false
  const selIsToday     = selectedDay === todayStr

  const selStatus: 'Aplicado' | 'Atrasado' | 'Pendente' =
    selIsConfirmed ? 'Aplicado' : selIsPast ? 'Atrasado' : 'Pendente'

  const statusColor =
    selStatus === 'Aplicado' ? '#10B981' :
    selStatus === 'Atrasado' ? '#EF4444' :
    'var(--primary)'

  const statusBgLight =
    selStatus === 'Aplicado' ? 'rgba(16,185,129,0.10)' :
    selStatus === 'Atrasado' ? 'rgba(239,68,68,0.08)' :
    'rgba(37,99,235,0.08)'

  const selDate     = selectedDay ? new Date(selectedDay + 'T12:00:00') : null
  const selDaysDiff = selDate ? Math.round(Math.abs(selDate.getTime() - today.getTime()) / 864e5) : 0

  const timingLabel =
    selIsToday      ? 'Hoje'
    : selIsFuture   ? 'Em'
    : selIsConfirmed ? 'Registrado há'
    : 'Há'

  // ── Calendar grid config ─────────────────────────────────────────────────────
  const monthName = new Date(view.year, view.month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const cellSize    = compact ? '30px' : undefined
  const fontSize    = compact ? '11px' : '12px'
  const headerFs    = compact ? '13px' : '14px'
  const btnSize     = compact ? '28px' : '36px'
  const btnRadius   = compact ? '8px' : '10px'
  const gap         = compact ? '2px' : '3px'
  const dayHeaderPb = compact ? '4px' : '6px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '10px' : '16px' }}>

      {/* ══════════════════════════════════════════════════════
          BOTTOM SHEET — detalhe + warnings inline
      ══════════════════════════════════════════════════════ */}
      {selectedDay && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={closeSheet}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: '28px 28px 0 0',
              width: '100%', maxWidth: '480px',
              maxHeight: '92vh', overflowY: 'auto',
              boxShadow: '0 -12px 60px rgba(0,0,0,0.30), 0 -2px 12px rgba(0,0,0,0.12)',
              border: '1px solid var(--border)', borderBottom: 'none',
              overflow: 'hidden',
              animation: 'slide-up 0.26s cubic-bezier(0.34,1.06,0.64,1) both',
            }}
          >
            {/* Status accent stripe */}
            <div style={{
              height: '3px',
              background: sheetMode === 'confirm-early'
                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                : sheetMode === 'confirm-delete'
                ? 'linear-gradient(90deg, #EF4444, #F87171)'
                : selStatus === 'Aplicado'
                ? 'linear-gradient(90deg, #10B981, #34D399)'
                : selStatus === 'Atrasado'
                ? 'linear-gradient(90deg, #EF4444, #F87171)'
                : 'linear-gradient(90deg, var(--primary), #3B82F6)',
            }} />

            {/* Handle bar */}
            <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '38px', height: '4px', borderRadius: '99px', background: 'var(--border)' }} />
            </div>

            {/* ── MODE: detail ── */}
            {sheetMode === 'detail' && (
              <div style={{ padding: '14px 22px 32px' }}>

                {/* Status badge */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px 5px 9px', borderRadius: '99px',
                    background: statusBgLight,
                    border: `1px solid ${statusColor}35`,
                  }}>
                    {selStatus === 'Aplicado' ? <IconCheck color={statusColor} /> :
                     selStatus === 'Atrasado' ? <IconAlert color={statusColor} /> :
                     <IconClock color={statusColor} />}
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: statusColor,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>{selStatus}</span>
                  </div>
                </div>

                {/* Date */}
                <p style={{
                  fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 4px',
                }}>Data da aplicação</p>
                <p style={{
                  fontSize: '21px', fontWeight: 900, color: 'var(--text-primary)',
                  margin: '0 0 20px', letterSpacing: '-0.6px', lineHeight: 1.2,
                  textTransform: 'capitalize',
                }}>{fmtDate(selectedDay)}</p>

                {/* Info tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  {/* Dose */}
                  <div style={{
                    padding: '13px 15px', borderRadius: '18px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <p style={{
                      fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 6px',
                    }}>Dose</p>
                    <p style={{
                      fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)',
                      margin: 0, letterSpacing: '-1px', lineHeight: 1,
                    }}>
                      {profile.currentDose}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>mg</span>
                    </p>
                  </div>

                  {/* Timing */}
                  <div style={{
                    padding: '13px 15px', borderRadius: '18px',
                    background: selIsConfirmed ? 'rgba(16,185,129,0.08)' : 'var(--surface-2)',
                    border: `1px solid ${selIsConfirmed ? 'rgba(16,185,129,0.22)' : 'var(--border)'}`,
                  }}>
                    <p style={{
                      fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 6px',
                    }}>{timingLabel}</p>
                    {selIsToday ? (
                      <p style={{
                        fontSize: '18px', fontWeight: 900,
                        color: selIsConfirmed ? '#10B981' : 'var(--primary)',
                        margin: 0, lineHeight: 1,
                      }}>Hoje</p>
                    ) : (
                      <p style={{
                        fontSize: '24px', fontWeight: 900,
                        color: selIsConfirmed ? '#10B981' : 'var(--text-primary)',
                        margin: 0, letterSpacing: '-1px', lineHeight: 1,
                      }}>
                        {selDaysDiff}
                        <span style={{
                          fontSize: '13px', fontWeight: 600,
                          color: selIsConfirmed ? 'rgba(16,185,129,0.65)' : 'var(--text-muted)',
                          marginLeft: '3px',
                        }}>dias</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 8px',
                  }}>Observações</p>
                  <textarea
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Ex: Aplicado no abdômen, sem reações adversas..."
                    rows={2}
                    style={{
                      width: '100%', padding: '11px 13px', borderRadius: '14px',
                      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                      fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '13px',
                      color: 'var(--text-primary)', resize: 'none', outline: 'none',
                      boxSizing: 'border-box', lineHeight: 1.55,
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = statusColor === 'var(--primary)' ? 'var(--primary)' : statusColor
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${selStatus === 'Aplicado' ? 'rgba(16,185,129,0.14)' : selStatus === 'Atrasado' ? 'rgba(239,68,68,0.12)' : 'rgba(37,99,235,0.14)'}`
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                      saveNote(selectedDay, noteInput)
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={closeSheet}
                    style={{
                      flex: 1, padding: '13px', borderRadius: '16px',
                      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                      color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif',
                      transition: 'background 0.15s',
                    }}
                  >Fechar</button>

                  {!selIsFuture && (
                    <button
                      onClick={handleDetailAction}
                      style={{
                        flex: 2, padding: '13px', borderRadius: '16px',
                        border: selIsConfirmed ? '1.5px solid rgba(239,68,68,0.25)' : 'none',
                        background: selIsConfirmed
                          ? 'rgba(239,68,68,0.09)'
                          : 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                        color: selIsConfirmed ? '#EF4444' : '#fff',
                        cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        boxShadow: selIsConfirmed ? 'none' : '0 4px 16px rgba(37,99,235,0.32)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selIsConfirmed ? 'Remover registro' : 'Registrar aplicação'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── MODE: confirm-early (aplicação antecipada) ── */}
            {sheetMode === 'confirm-early' && (
              <div style={{ padding: '18px 22px 32px' }}>

                {/* Icon */}
                <div style={{
                  width: '54px', height: '54px', borderRadius: '18px',
                  background: 'rgba(245,158,11,0.12)',
                  border: '1.5px solid rgba(245,158,11,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                }}>
                  <IconWarningLarge />
                </div>

                <p style={{
                  fontSize: '19px', fontWeight: 900, color: 'var(--text-primary)',
                  margin: '0 0 10px', letterSpacing: '-0.5px',
                }}>Aplicação antecipada</p>

                <p style={{
                  fontSize: '13px', color: 'var(--text-secondary)',
                  lineHeight: 1.65, margin: '0 0 14px',
                }}>
                  Sua próxima aplicação está programada para:
                </p>

                {/* Next date highlight */}
                <div style={{
                  padding: '12px 16px', borderRadius: '14px',
                  background: 'rgba(245,158,11,0.09)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  marginBottom: '14px',
                }}>
                  <p style={{
                    fontSize: '15px', fontWeight: 800, color: '#D97706',
                    margin: 0, textTransform: 'capitalize',
                  }}>{globalNextApp ? fmtDateShort(globalNextApp) : '—'}</p>
                </div>

                <p style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  lineHeight: 1.65, margin: '0 0 22px',
                }}>
                  Aplicar antes do prazo pode reduzir a eficácia do tratamento.
                  Tem certeza que deseja registrar hoje?
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSheetMode('detail')}
                    style={{
                      flex: 1, padding: '13px', borderRadius: '16px',
                      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                      color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >Voltar</button>
                  <button
                    onClick={() => selectedDay && doRegister(selectedDay)}
                    style={{
                      flex: 2, padding: '13px', borderRadius: '16px', border: 'none',
                      background: 'linear-gradient(135deg, #D97706 0%, #FBBF24 100%)',
                      color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      boxShadow: '0 4px 18px rgba(217,119,6,0.38)',
                    }}
                  >Confirmar mesmo assim</button>
                </div>
              </div>
            )}

            {/* ── MODE: confirm-delete (remover registro) ── */}
            {sheetMode === 'confirm-delete' && (
              <div style={{ padding: '18px 22px 32px' }}>

                {/* Icon */}
                <div style={{
                  width: '54px', height: '54px', borderRadius: '18px',
                  background: 'rgba(239,68,68,0.10)',
                  border: '1.5px solid rgba(239,68,68,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                }}>
                  <IconTrashLarge />
                </div>

                <p style={{
                  fontSize: '19px', fontWeight: 900, color: 'var(--text-primary)',
                  margin: '0 0 10px', letterSpacing: '-0.5px',
                }}>Remover aplicação</p>

                <p style={{
                  fontSize: '13px', color: 'var(--text-secondary)',
                  lineHeight: 1.65, margin: '0 0 14px',
                }}>
                  Você está prestes a remover o registro de:
                </p>

                {/* Date highlight */}
                <div style={{
                  padding: '12px 16px', borderRadius: '14px',
                  background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.20)',
                  marginBottom: '14px',
                }}>
                  <p style={{
                    fontSize: '15px', fontWeight: 800, color: '#EF4444',
                    margin: 0, textTransform: 'capitalize',
                  }}>{fmtDate(selectedDay)}</p>
                </div>

                <p style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  lineHeight: 1.65, margin: '0 0 22px',
                }}>
                  Esta ação não pode ser desfeita. O histórico de aplicação será atualizado.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSheetMode('detail')}
                    style={{
                      flex: 1, padding: '13px', borderRadius: '16px',
                      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                      color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >Voltar</button>
                  <button
                    onClick={() => selectedDay && doDelete(selectedDay)}
                    style={{
                      flex: 2, padding: '13px', borderRadius: '16px', border: 'none',
                      background: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)',
                      color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      boxShadow: '0 4px 18px rgba(220,38,38,0.35)',
                    }}
                  >Remover registro</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header do calendário ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevMonth} style={{
          width: btnSize, height: btnSize, borderRadius: btnRadius,
          border: '1px solid var(--border)', background: 'var(--surface-2)',
          cursor: 'pointer', fontSize: compact ? '13px' : '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>

        <p style={{ fontWeight: 700, fontSize: headerFs, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
          {monthName}
        </p>

        <button onClick={nextMonth} style={{
          width: btnSize, height: btnSize, borderRadius: btnRadius,
          border: '1px solid var(--border)', background: 'var(--surface-2)',
          cursor: 'pointer', fontSize: compact ? '13px' : '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>›</button>
      </div>

      {/* ── Próxima aplicação (modo normal) ── */}
      {!compact && globalNextApp && (
        <div style={{
          padding: '12px 14px', borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
          border: '1px solid rgba(37,99,235,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {globalNextApp === todayStr ? 'Aplicar hoje' : 'Próxima aplicação'}
            </p>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px', textTransform: 'capitalize' }}>
              {fmtDate(globalNextApp)}
            </p>
          </div>
          {!confirmedDates.has(todayStr) && (
            <button
              onClick={() => {
                if (globalNextApp !== todayStr) {
                  openSheet(todayStr)
                  setSheetMode('confirm-early')
                } else {
                  doRegister(todayStr)
                }
              }}
              style={{
                padding: '8px 14px', borderRadius: '10px', border: 'none', flexShrink: 0,
                background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '12px',
                cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
                boxShadow: '0 4px 12px rgba(37,99,235,0.28)',
              }}
            >Registrar</button>
          )}
          {confirmedDates.has(todayStr) && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#10B981',
              background: 'rgba(16,185,129,0.12)', padding: '5px 10px', borderRadius: '8px',
              border: '1px solid rgba(16,185,129,0.22)',
            }}>Registrado</span>
          )}
        </div>
      )}

      {/* ── Dias da semana ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: compact ? '9px' : '10px',
            fontWeight: 700, color: 'var(--text-muted)', paddingBottom: dayHeaderPb,
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Grid de dias ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap, marginTop: compact ? '-6px' : '-8px' }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} style={cellSize ? { height: cellSize } : undefined} />

          const dateStr     = toDateStr(new Date(view.year, view.month, day))
          const isToday     = dateStr === todayStr
          const isAppDay    = appDay !== undefined && new Date(view.year, view.month, day).getDay() === appDay
          const isConfirmed = confirmedDates.has(dateStr)
          const isNext      = dateStr === nextApp
          const isPast      = dateStr < todayStr
          const isFuture    = dateStr > todayStr

          let bg = 'transparent', color = 'var(--text-primary)', border = 'none'
          let fontWeight = 400

          if (isConfirmed) {
            bg = '#10B981'; color = '#fff'; fontWeight = 700
          } else if (isToday && isAppDay) {
            bg = 'var(--primary)'; color = '#fff'; fontWeight = 800; border = '2px solid var(--primary-dark)'
          } else if (isToday) {
            bg = 'var(--surface-3)'; fontWeight = 800; border = '2px solid var(--primary)'
          } else if (isNext) {
            bg = 'var(--primary-light)'; color = 'var(--primary)'; fontWeight = 700; border = '1.5px dashed var(--primary)'
          } else if (isAppDay && isPast) {
            bg = 'rgba(239,68,68,0.10)'; color = '#EF4444'; fontWeight = 600; border = '1px solid rgba(239,68,68,0.28)'
          } else if (isAppDay && isFuture) {
            bg = 'var(--primary-light)'; color = 'var(--primary)'; fontWeight = 600
          } else if (isPast) {
            color = 'var(--text-muted)'
          }

          const clickable = (isAppDay || isConfirmed) && !isFuture

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr, isConfirmed, isFuture, isAppDay)}
              style={{
                height: cellSize ?? undefined,
                aspectRatio: cellSize ? undefined : '1',
                borderRadius: compact ? '7px' : '9px',
                background: bg, border, color, fontWeight, fontSize,
                cursor: clickable ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease, transform 0.12s ease',
                fontFamily: 'Inter, -apple-system, sans-serif',
                position: 'relative',
                opacity: isFuture && isAppDay && !isNext ? 0.55 : 1,
              }}
              onMouseEnter={e => { if (clickable) e.currentTarget.style.transform = 'scale(1.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {day}
              {isConfirmed && (
                <span style={{ position: 'absolute', top: '1px', right: '2px', lineHeight: 1 }}>
                  <svg width={compact ? 6 : 7} height={compact ? 6 : 7} viewBox="0 0 10 10" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1.5 5 4 7.5 8.5 2.5"/>
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Legenda ── */}
      <div style={{ display: 'flex', gap: compact ? '8px' : '12px', flexWrap: 'wrap' }}>
        {[
          { label: 'Aplicado',  color: '#10B981', bg: '#10B981',                      border: 'none' },
          { label: 'Pendente',  color: 'var(--primary)', bg: 'var(--primary-light)',  border: '1.5px dashed var(--primary)' },
          { label: 'Atrasado',  color: '#EF4444', bg: 'rgba(239,68,68,0.10)',         border: '1px solid rgba(239,68,68,0.28)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.bg, border: l.border }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {!compact && log.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          Nenhuma aplicação registrada ainda.
        </p>
      )}

    </div>
  )
}
