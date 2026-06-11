import { useState } from 'react'
import { UserProfile, WEEK_DAYS } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  compact?: boolean
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

// Migra perfis antigos (lastApplication) para o novo modelo (applicationLog)
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

export default function ApplicationCalendar({ profile, onUpdateProfile, compact = false }: Props) {
  const today   = new Date()
  const [view, setView]           = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [confirmEarly, setConfirmEarly] = useState<string | null>(null)   // data a registrar antecipado
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null) // data a apagar

  const appDay   = profile.applicationDay
  const todayStr = toDateStr(today)
  const log      = getLog(profile)

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
  const confirmedDates = new Set(log)

  function doRegister(dateStr: string) {
    const newLog = [...log.filter(d => d !== dateStr), dateStr].sort()
    const lastApp = newLog.at(-1) ?? dateStr
    onUpdateProfile({ ...profile, applicationLog: newLog, lastApplication: lastApp })
    setConfirmEarly(null)
  }

  function doDelete(dateStr: string) {
    const newLog = log.filter(d => d !== dateStr)
    const lastApp = newLog.at(-1) ?? profile.lastApplication
    onUpdateProfile({ ...profile, applicationLog: newLog, lastApplication: lastApp })
    setConfirmDelete(null)
  }

  function handleDayClick(dateStr: string, isConfirmed: boolean, isFuture: boolean) {
    if (isFuture) return
    if (isConfirmed) { setConfirmDelete(dateStr); return }
    // Registrar: avisa se for antes da data programada
    if (nextApp && dateStr < nextApp && dateStr === todayStr) {
      setConfirmEarly(dateStr)
      return
    }
    doRegister(dateStr)
  }

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

      {/* Modal: confirmação de aplicação antecipada */}
      {confirmEarly && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}
          onClick={() => setConfirmEarly(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: '20px', padding: '24px',
              maxWidth: '320px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Aplicação antecipada
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Sua próxima aplicação está programada para{' '}
              <strong style={{ color: 'var(--primary)' }}>
                {nextApp
                  ? new Date(nextApp + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
                  : '—'}
              </strong>.
              {' '}Tem certeza que deseja registrar hoje?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmEarly(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => doRegister(confirmEarly)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  border: 'none', background: 'var(--primary)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  color: '#fff', fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Registrar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmação de exclusão */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: '20px', padding: '24px',
              maxWidth: '320px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Remover aplicação
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Deseja remover o registro de{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {new Date(confirmDelete + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </strong>
              ?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => doDelete(confirmDelete)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  border: 'none', background: '#ef4444',
                  cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  color: '#fff', fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header do calendário */}
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

      {/* Próxima aplicação — apenas no modo normal */}
      {!compact && nextApp && (
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
          border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {nextApp === todayStr ? 'Aplicar hoje' : 'Próxima aplicação'}
            </p>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
              {new Date(nextApp + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
          {!confirmedDates.has(todayStr) && (
            <button
              onClick={() => {
                if (nextApp !== todayStr) { setConfirmEarly(todayStr); return }
                doRegister(todayStr)
              }}
              style={{
                padding: '8px 14px', borderRadius: '9px', border: 'none', flexShrink: 0,
                background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '12px',
                cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
                boxShadow: 'var(--shadow-green)',
              }}
            >
              Registrar
            </button>
          )}
          {confirmedDates.has(todayStr) && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--primary)',
              background: 'rgba(16,185,129,0.12)', padding: '5px 10px', borderRadius: '8px',
            }}>
              Registrado
            </span>
          )}
        </div>
      )}

      {/* Dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: compact ? '9px' : '10px', fontWeight: 700, color: 'var(--text-muted)', paddingBottom: dayHeaderPb }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
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
            bg = 'var(--primary)'; color = '#fff'; fontWeight = 700
          } else if (isToday && isAppDay) {
            bg = 'var(--primary)'; color = '#fff'; fontWeight = 800; border = '2px solid var(--primary-dark)'
          } else if (isToday) {
            bg = 'var(--surface-3)'; fontWeight = 800; border = '2px solid var(--primary)'
          } else if (isNext) {
            bg = 'var(--primary-light)'; color = 'var(--primary)'; fontWeight = 700; border = '1.5px dashed var(--primary)'
          } else if (isAppDay && isPast) {
            bg = 'var(--surface-2)'; color = 'var(--text-muted)'; fontWeight = 600
          } else if (isAppDay && isFuture) {
            bg = 'var(--primary-light)'; color = 'var(--primary)'; fontWeight = 600
          } else if (isPast) {
            color = 'var(--text-muted)'
          }

          const clickable = !isFuture || isConfirmed

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr, isConfirmed, isFuture)}
              style={{
                height: cellSize ?? undefined,
                aspectRatio: cellSize ? undefined : '1',
                borderRadius: compact ? '7px' : '9px',
                background: bg, border, color, fontWeight, fontSize,
                cursor: clickable ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', fontFamily: 'Inter, -apple-system, sans-serif',
                position: 'relative',
                opacity: isFuture && isAppDay && !isNext ? 0.5 : 1,
              }}
            >
              {day}
              {isConfirmed && (
                <span style={{ position: 'absolute', top: '1px', right: '2px', lineHeight: 1 }}>
                  <svg width={compact ? 6 : 7} height={compact ? 6 : 7} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1.5 5 4 7.5 8.5 2.5"/>
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legenda — apenas no modo normal */}
      {!compact && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { color: 'var(--primary)',       label: 'Confirmado' },
            { color: 'var(--primary-light)', label: 'Programado', border: '1.5px dashed var(--primary)' },
            { color: 'var(--surface-2)',      label: 'Esperado' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color, border: l.border }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'transparent', border: '1px solid var(--border)', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: 'var(--text-muted)' }}>×</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Toque para remover</span>
          </div>
        </div>
      )}

      {!compact && log.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          Nenhuma aplicação registrada ainda.
        </p>
      )}
    </div>
  )
}
