import { useState } from 'react'
import { UserProfile, WEEK_DAYS } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  compact?: boolean
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }
function isSameDay(a: string, b: string) { return a === b }

export default function ApplicationCalendar({ profile, onUpdateProfile, compact = false }: Props) {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const appDay = profile.applicationDay

  function prevMonth() {
    setView(v => { const d = new Date(v.year, v.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }
  function nextMonth() {
    setView(v => { const d = new Date(v.year, v.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }

  const firstDay    = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const todayStr    = toDateStr(today)

  const appDatesInMonth: string[] = []
  if (appDay !== undefined) {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(view.year, view.month, d)
      if (date.getDay() === appDay) appDatesInMonth.push(toDateStr(date))
    }
  }

  const nextApp = appDatesInMonth.find(d => d >= todayStr)

  const confirmedDates = new Set<string>()
  if (profile.lastApplication) {
    const last = new Date(profile.lastApplication + 'T12:00:00')
    for (let w = 0; w < 52; w++) {
      const d = new Date(last)
      d.setDate(last.getDate() - w * 7)
      if (d.getFullYear() === view.year && d.getMonth() === view.month) confirmedDates.add(toDateStr(d))
      if (d.getFullYear() < view.year || (d.getFullYear() === view.year && d.getMonth() < view.month)) break
    }
  }

  function registerApplication(dateStr: string) {
    onUpdateProfile({ ...profile, lastApplication: dateStr })
  }

  const monthName = new Date(view.year, view.month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const cellSize  = compact ? '30px' : undefined
  const fontSize  = compact ? '11px' : '12px'
  const headerFs  = compact ? '13px' : '14px'
  const btnSize   = compact ? '28px' : '36px'
  const btnRadius = compact ? '8px' : '10px'
  const gap       = compact ? '2px' : '3px'
  const dayHeaderPb = compact ? '4px' : '6px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '10px' : '16px' }}>

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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Próxima aplicação
            </p>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
              {new Date(nextApp + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
          {nextApp === todayStr && (
            <button
              onClick={() => registerApplication(todayStr)}
              style={{
                padding: '8px 14px', borderRadius: '9px', border: 'none',
                background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '12px',
                cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: 'var(--shadow-green)',
              }}
            >
              Registrar ✓
            </button>
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

          const dateStr    = toDateStr(new Date(view.year, view.month, day))
          const isToday    = isSameDay(dateStr, todayStr)
          const isAppDay   = appDay !== undefined && new Date(view.year, view.month, day).getDay() === appDay
          const isConfirmed = confirmedDates.has(dateStr)
          const isNext     = dateStr === nextApp
          const isPast     = dateStr < todayStr
          const isFuture   = dateStr > todayStr

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

          return (
            <button
              key={dateStr}
              onClick={() => isAppDay && day ? registerApplication(dateStr) : undefined}
              style={{
                height: cellSize ?? undefined,
                aspectRatio: cellSize ? undefined : '1',
                borderRadius: compact ? '7px' : '9px',
                background: bg, border, color, fontWeight, fontSize,
                cursor: isAppDay ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif",
                position: 'relative',
              }}
            >
              {day}
              {isConfirmed && (
                <span style={{ position: 'absolute', top: '1px', right: '2px', fontSize: compact ? '6px' : '7px' }}>✓</span>
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
        </div>
      )}
    </div>
  )
}
