import { useState } from 'react'
import { UserProfile, WEEK_DAYS } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  compact?: boolean
}

// ── Utils ─────────────────────────────────────────────────────────────────────
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

function fmtDateShort(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

function getGlobalNextApp(appDayNum: number, todayStr: string): string {
  const today = new Date(todayStr + 'T12:00:00')
  const daysUntil = (appDayNum - today.getDay() + 7) % 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return toDateStr(next)
}

function calcStreak(confirmed: Set<string>, appDay: number, todayStr: string): number {
  let streak = 0
  const today = new Date(todayStr + 'T12:00:00')
  const offset = (today.getDay() - appDay + 7) % 7
  for (let w = 0; w < 52; w++) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset - w * 7)
    const s = toDateStr(d)
    if (s > todayStr) continue
    if (confirmed.has(s)) streak++
    else break
  }
  return streak
}

function calcAdherence(confirmed: Set<string>, appDay: number, todayStr: string, weeks = 12): number {
  const today = new Date(todayStr + 'T12:00:00')
  const offset = (today.getDay() - appDay + 7) % 7
  let scheduled = 0, done = 0
  for (let w = 0; w < weeks; w++) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset - w * 7)
    const s = toDateStr(d)
    if (s > todayStr) continue
    if (s < new Date(new Date(todayStr).setDate(new Date(todayStr).getDate() - weeks * 7 + 1)).toISOString().split('T')[0]) continue
    scheduled++
    if (confirmed.has(s)) done++
  }
  return scheduled > 0 ? Math.round((done / scheduled) * 100) : 0
}

const SITES = ['Abdômen', 'Coxa E', 'Coxa D', 'Braço']

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoCheck({ c }: { c: string }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="6"/><polyline points="4.5 7 6.2 8.8 9.8 5"/></svg>
}
function IcoClock({ c }: { c: string }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="6"/><polyline points="7 4 7 7 9 8.2"/></svg>
}
function IcoAlert({ c }: { c: string }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1.5L1.2 12.5h11.6L7 1.5z"/><line x1="7" y1="6" x2="7" y2="9"/><circle cx="7" cy="10.8" r="0.5" fill={c} stroke="none"/></svg>
}
function IcoSyringe() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4"/><path d="M17 7L4 20"/><path d="M14 4l6 6"/><path d="M9 9l6 6"/><path d="M3 21l3-3"/></svg>
}
function IcoChevLeft() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
function IcoChevRight() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
}
function IcoX() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function IcoWarning() {
  return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.07 3.86L1.5 22a2 2 0 001.71 3H24.8a2 2 0 001.71-3L15.93 3.86a2 2 0 00-3.42 0z"/><line x1="14" y1="10" x2="14" y2="16"/><circle cx="14" cy="20" r="1" fill="#F59E0B" stroke="none"/></svg>
}
function IcoTrash() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ApplicationCalendar({ profile, onUpdateProfile, compact = false }: Props) {
  const today    = new Date()
  const todayStr = toDateStr(today)

  const [view, setView]         = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [noteInput, setNoteInput]     = useState('')
  const [siteInput, setSiteInput]     = useState('')
  const [sheetMode, setSheetMode]     = useState<'detail' | 'confirm-early' | 'confirm-delete'>('detail')

  const appDay     = profile.applicationDay
  const log        = getLog(profile)
  const notes      = profile.applicationNotes ?? {}
  const sites      = profile.applicationSites ?? {}
  const confirmed  = new Set(log)
  const nextAppGlobal = appDay !== undefined ? getGlobalNextApp(appDay, todayStr) : undefined

  const streak    = appDay !== undefined ? calcStreak(confirmed, appDay, todayStr) : 0
  const adherence = appDay !== undefined ? calcAdherence(confirmed, appDay, todayStr) : 0

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
    const newLog  = [...log.filter(d => d !== dateStr), dateStr].sort()
    const lastApp = newLog.at(-1) ?? dateStr
    const newSites = { ...sites }
    if (siteInput) newSites[dateStr] = siteInput
    onUpdateProfile({ ...profile, applicationLog: newLog, lastApplication: lastApp, applicationSites: newSites })
    setSelectedDay(null); setSheetMode('detail')
  }

  function doDelete(dateStr: string) {
    const newLog  = log.filter(d => d !== dateStr)
    const lastApp = newLog.at(-1) ?? profile.lastApplication
    const newNotes = { ...notes }; delete newNotes[dateStr]
    const newSites = { ...sites };  delete newSites[dateStr]
    onUpdateProfile({ ...profile, applicationLog: newLog, lastApplication: lastApp, applicationNotes: newNotes, applicationSites: newSites })
    setSelectedDay(null); setSheetMode('detail')
  }

  function saveNote(dateStr: string, text: string) {
    onUpdateProfile({ ...profile, applicationNotes: { ...notes, [dateStr]: text } })
  }

  function openSheet(dateStr: string) {
    setSelectedDay(dateStr)
    setNoteInput(notes[dateStr] ?? '')
    setSiteInput(sites[dateStr] ?? '')
    setSheetMode('detail')
  }

  function closeSheet() { setSelectedDay(null); setSheetMode('detail') }

  function handleDayClick(dateStr: string, isFuture: boolean) {
    if (isFuture) return
    openSheet(dateStr)
  }

  function handleDetailAction() {
    if (!selectedDay || selectedDay > todayStr) return
    if (confirmed.has(selectedDay)) {
      setSheetMode('confirm-delete')
    } else if (selectedDay === todayStr && nextAppGlobal && todayStr < nextAppGlobal) {
      setSheetMode('confirm-early')
    } else {
      doRegister(selectedDay)
    }
  }

  // ── Sheet derived state ───────────────────────────────────────────────────────
  const selConfirmed = selectedDay ? confirmed.has(selectedDay) : false
  const selIsPast    = selectedDay ? selectedDay < todayStr : false
  const selIsFuture  = selectedDay ? selectedDay > todayStr : false
  const selIsToday   = selectedDay === todayStr
  const selIsAppDay  = selectedDay ? (appDay !== undefined && new Date(selectedDay + 'T12:00:00').getDay() === appDay) : false

  const selStatus: 'Aplicado' | 'Atrasado' | 'Hoje' | 'Agendado' | 'Livre' =
    selConfirmed   ? 'Aplicado'  :
    selIsToday     ? 'Hoje'      :
    selIsPast && selIsAppDay ? 'Atrasado' :
    selIsPast      ? 'Livre'     :
    'Agendado'

  const statusMeta: Record<string, { color: string; bg: string; grad: string; label: string }> = {
    Aplicado: { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  grad: 'linear-gradient(135deg,#059669,#10B981)', label: 'Aplicado' },
    Hoje:     { color: '#2E6FEB', bg: 'rgba(46,111,235,0.12)',  grad: 'linear-gradient(135deg,#1A52C9,#2E6FEB)', label: 'Hoje' },
    Atrasado: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   grad: 'linear-gradient(135deg,#DC2626,#EF4444)', label: 'Atrasado' },
    Agendado: { color: '#7B5CF5', bg: 'rgba(123,92,245,0.10)',  grad: 'linear-gradient(135deg,#6D28D9,#7B5CF5)', label: 'Agendado' },
    Livre:    { color: '#64748B', bg: 'rgba(100,116,139,0.10)', grad: 'linear-gradient(135deg,#475569,#64748B)', label: 'Data livre' },
  }
  const sm = statusMeta[selStatus]

  const selDate  = selectedDay ? new Date(selectedDay + 'T12:00:00') : null
  const selDiff  = selDate ? Math.round(Math.abs(selDate.getTime() - today.getTime()) / 864e5) : 0

  // ── Calendar grid ─────────────────────────────────────────────────────────────
  const monthName = new Date(view.year, view.month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const gap       = compact ? '2px' : '2px'
  const fontSize  = compact ? '11px' : '11px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '10px' : '14px' }}>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM SHEET
      ════════════════════════════════════════════════════════════════ */}
      {selectedDay && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={closeSheet}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: '28px 28px 0 0',
              width: '100%', maxWidth: '480px', maxHeight: '92dvh', overflowY: 'auto',
              boxShadow: '0 -16px 60px rgba(0,0,0,0.35)',
              border: '1px solid var(--border)', borderBottom: 'none',
              animation: 'slide-up 0.28s cubic-bezier(0.34,1.06,0.64,1) both',
            }}
          >
            {/* Handle */}
            <div style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--border-strong)' }} />
            </div>

            {sheetMode === 'detail' && (
              <>
                {/* ── Cabeçalho colorido ──────────────────────────────────── */}
                <div style={{ padding: '16px 20px 20px', position: 'relative' }}>

                  {/* Close button */}
                  <button onClick={closeSheet} style={{
                    position: 'absolute', top: '14px', right: '16px',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}><IcoX /></button>

                  {/* Status pill */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px 5px 9px', borderRadius: '99px',
                    background: sm.bg, border: `1px solid ${sm.color}40`,
                    marginBottom: '10px',
                  }}>
                    {selStatus === 'Aplicado' ? <IcoCheck c={sm.color} /> :
                     selStatus === 'Atrasado' ? <IcoAlert c={sm.color} /> :
                     <IcoClock c={sm.color} />}
                    <span style={{ fontSize: '11px', fontWeight: 800, color: sm.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {sm.label}
                    </span>
                  </div>

                  {/* Date */}
                  <p style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.8px', lineHeight: 1.15, textTransform: 'capitalize' }}>
                    {fmtDateShort(selectedDay)}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0', fontWeight: 500 }}>
                    {new Date(selectedDay + 'T12:00:00').getFullYear()}
                    {selIsAppDay && <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 700, color: sm.color, background: sm.bg, padding: '1px 7px', borderRadius: '99px' }}>dia de aplicação</span>}
                  </p>
                </div>

                {/* Divisor */}
                <div style={{ height: '1px', background: 'var(--border)', margin: '0 20px' }} />

                <div style={{ padding: '18px 20px 32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  {/* Info tiles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 8px' }}>Dose</p>
                      <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
                        {profile.currentDose}
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>mg</span>
                      </p>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: '16px', background: selConfirmed ? 'rgba(16,185,129,0.08)' : 'var(--surface-2)', border: `1px solid ${selConfirmed ? 'rgba(16,185,129,0.22)' : 'var(--border)'}` }}>
                      <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 8px' }}>
                        {selIsToday ? 'Hoje' : selIsFuture ? 'Em' : selConfirmed ? 'Há' : 'Há'}
                      </p>
                      {selIsToday ? (
                        <p style={{ fontSize: '22px', fontWeight: 900, color: selConfirmed ? '#10B981' : 'var(--primary)', margin: 0, lineHeight: 1 }}>Hoje</p>
                      ) : (
                        <p style={{ fontSize: '28px', fontWeight: 900, color: selConfirmed ? '#10B981' : 'var(--text-primary)', margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
                          {selDiff}<span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>dias</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Local de aplicação */}
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 10px' }}>
                      Local de aplicação
                    </p>
                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                      {SITES.map(s => {
                        const active = siteInput === s
                        return (
                          <button
                            key={s}
                            onClick={() => setSiteInput(active ? '' : s)}
                            style={{
                              padding: '7px 13px', borderRadius: '99px', border: 'none',
                              background: active ? sm.grad : 'var(--surface-2)',
                              color: active ? '#fff' : 'var(--text-secondary)',
                              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'Inter, -apple-system, sans-serif',
                              outline: active ? 'none' : `1px solid var(--border)`,
                              transition: 'all 0.15s',
                              boxShadow: active ? `0 4px 14px ${sm.color}40` : 'none',
                            }}
                          >{s}</button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 8px' }}>
                      Observações
                    </p>
                    <textarea
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Ex: Sem reações, abdômen esquerdo, 1cm da cicatriz..."
                      rows={2}
                      style={{
                        width: '100%', padding: '11px 13px', borderRadius: '14px',
                        border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                        fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '13px',
                        color: 'var(--text-primary)', resize: 'none', outline: 'none',
                        boxSizing: 'border-box', lineHeight: 1.55, transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = sm.color; e.currentTarget.style.boxShadow = `0 0 0 3px ${sm.color}22` }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; saveNote(selectedDay, noteInput) }}
                    />
                  </div>

                  {/* Botões de ação */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={closeSheet} style={{
                      flex: 1, padding: '14px', borderRadius: '16px',
                      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '14px',
                      color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif',
                    }}>Fechar</button>

                    {!selIsFuture && (
                      <button onClick={handleDetailAction} style={{
                        flex: 2, padding: '14px', borderRadius: '16px',
                        border: selConfirmed ? '1.5px solid rgba(239,68,68,0.25)' : 'none',
                        background: selConfirmed ? 'rgba(239,68,68,0.09)' : sm.grad,
                        color: selConfirmed ? '#EF4444' : '#fff',
                        cursor: 'pointer', fontWeight: 700, fontSize: '14px',
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        boxShadow: selConfirmed ? 'none' : `0 6px 20px ${sm.color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                        transition: 'all 0.18s',
                      }}>
                        {selConfirmed ? 'Remover registro' : <><IcoSyringe />{selIsToday ? 'Registrar hoje' : 'Registrar aplicação'}</>}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Confirmação antecipada ──────────────────────────────────── */}
            {sheetMode === 'confirm-early' && (
              <div style={{ padding: '20px 22px 36px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <IcoWarning />
                </div>
                <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.5px' }}>Aplicação antecipada</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 12px' }}>
                  Sua próxima aplicação está programada para:
                </p>
                <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '12px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#D97706', margin: 0, textTransform: 'capitalize' }}>
                    {nextAppGlobal ? fmtDateShort(nextAppGlobal) : '—'}
                  </p>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 24px' }}>
                  Aplicar antes do prazo pode reduzir a eficácia. Tem certeza?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setSheetMode('detail')} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif' }}>Voltar</button>
                  <button onClick={() => selectedDay && doRegister(selectedDay)} style={{ flex: 2, padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#D97706,#FBBF24)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: 'Inter, -apple-system, sans-serif', boxShadow: '0 6px 20px rgba(217,119,6,0.38)' }}>
                    Confirmar mesmo assim
                  </button>
                </div>
              </div>
            )}

            {/* ── Confirmação de remoção ──────────────────────────────────── */}
            {sheetMode === 'confirm-delete' && (
              <div style={{ padding: '20px 22px 36px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'rgba(239,68,68,0.10)', border: '1.5px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <IcoTrash />
                </div>
                <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.5px' }}>Remover aplicação?</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 12px' }}>Você está prestes a remover o registro de:</p>
                <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)', marginBottom: '12px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#EF4444', margin: 0, textTransform: 'capitalize' }}>{fmtDateShort(selectedDay)}</p>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 24px' }}>Esta ação não pode ser desfeita.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setSheetMode('detail')} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Inter, -apple-system, sans-serif' }}>Voltar</button>
                  <button onClick={() => selectedDay && doDelete(selectedDay)} style={{ flex: 2, padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#DC2626,#F87171)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: 'Inter, -apple-system, sans-serif', boxShadow: '0 6px 20px rgba(220,38,38,0.35)' }}>
                    Sim, remover
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STATS BAR (non-compact only)
      ════════════════════════════════════════════════════════════════ */}
      {!compact && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Sequência', value: streak > 0 ? `${streak}sem` : '—', color: 'var(--green)', sub: streak === 1 ? 'semana' : 'semanas' },
            { label: 'Aderência', value: `${adherence}%`, color: adherence >= 80 ? 'var(--green)' : adherence >= 50 ? '#F59E0B' : '#EF4444', sub: 'últimas 12 sem.' },
            { label: 'Total', value: String(confirmed.size), color: 'var(--primary)', sub: confirmed.size === 1 ? 'aplicação' : 'aplicações' },
          ].map(s => (
            <div key={s.label} style={{ padding: '9px 6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '3px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BANNER: próxima aplicação / hoje
      ════════════════════════════════════════════════════════════════ */}
      {!compact && nextAppGlobal && (
        <div style={{
          padding: '14px 16px', borderRadius: '16px',
          background: confirmed.has(todayStr) ? 'rgba(16,185,129,0.07)' : 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
          border: `1px solid ${confirmed.has(todayStr) ? 'rgba(16,185,129,0.2)' : 'rgba(46,111,235,0.15)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
        }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>
              {confirmed.has(todayStr) ? '✓ Aplicação de hoje' : nextAppGlobal === todayStr ? 'Aplicar hoje' : 'Próxima aplicação'}
            </p>
            <p style={{ fontSize: '15px', fontWeight: 800, color: confirmed.has(todayStr) ? '#10B981' : 'var(--primary)', margin: 0, textTransform: 'capitalize' }}>
              {fmtDateShort(nextAppGlobal)}
            </p>
          </div>
          {!confirmed.has(todayStr) && (
            <button
              onClick={() => { if (nextAppGlobal !== todayStr) { openSheet(todayStr); setSheetMode('confirm-early') } else openSheet(todayStr) }}
              style={{
                padding: '9px 16px', borderRadius: '11px', border: 'none', flexShrink: 0,
                background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '12px',
                cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
                boxShadow: '0 4px 14px rgba(46,111,235,0.3)',
              }}
            >Registrar</button>
          )}
          {confirmed.has(todayStr) && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '6px 12px', borderRadius: '9px', border: '1px solid rgba(16,185,129,0.22)', flexShrink: 0 }}>✓ Registrado</span>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          NAVEGAÇÃO MÊS
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevMonth} style={{
          width: '32px', height: '32px',
          borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-2)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}><IcoChevLeft /></button>

        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', textTransform: 'capitalize', margin: 0 }}>
          {monthName}
        </p>

        <button onClick={nextMonth} style={{
          width: '32px', height: '32px',
          borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-2)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}><IcoChevRight /></button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DIAS DA SEMANA
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(7, 1fr)' : 'repeat(7, 34px)', gap, padding: '0', justifyContent: 'center' }}>
        {WEEK_DAYS.map((d, i) => {
          const isAppDayCol = appDay !== undefined && i === appDay
          return (
            <div key={d} style={{
              textAlign: 'center', fontSize: compact ? '9px' : '10px',
              fontWeight: isAppDayCol ? 800 : 700,
              color: isAppDayCol ? 'var(--primary)' : 'var(--text-muted)',
              paddingBottom: compact ? '4px' : '6px',
            }}>{d}</div>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          GRID DE DIAS
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(7, 1fr)' : 'repeat(7, 34px)', gap, marginTop: '-4px', padding: '0', justifyContent: 'center' }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} style={{ aspectRatio: '1' }} />

          const dateStr    = toDateStr(new Date(view.year, view.month, day))
          const isToday    = dateStr === todayStr
          const isAppDay   = appDay !== undefined && new Date(view.year, view.month, day).getDay() === appDay
          const isConf     = confirmed.has(dateStr)
          const isNext     = dateStr === nextApp
          const isPast     = dateStr < todayStr
          const isFuture   = dateStr > todayStr
          const hasNote    = !!notes[dateStr]
          const hasSite    = !!sites[dateStr]

          // ── Cell style ──
          let bg = 'transparent'
          let color = isPast ? 'var(--text-muted)' : 'var(--text-primary)'
          let border = 'none'
          let fw = isPast ? 400 : 500

          if (isConf) {
            bg = '#10B981'; color = '#fff'; fw = 700; border = 'none'
          } else if (isToday && isAppDay) {
            bg = 'var(--primary)'; color = '#fff'; fw = 800
          } else if (isToday) {
            bg = 'var(--surface-3)'; fw = 800; border = '2px solid var(--primary)'
          } else if (isNext) {
            bg = 'var(--primary-light)'; color = 'var(--primary)'; fw = 700; border = '1.5px dashed var(--primary)'
          } else if (isAppDay && isPast) {
            bg = 'rgba(239,68,68,0.09)'; color = '#EF4444'; fw = 600; border = '1px solid rgba(239,68,68,0.25)'
          } else if (isAppDay && isFuture && !isNext) {
            color = 'var(--primary)'; fw = 600
          }

          const clickable = !isFuture

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr, isFuture)}
              style={{
                aspectRatio: '1', borderRadius: '8px',
                background: bg, border, color, fontWeight: fw, fontSize,
                cursor: clickable ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '1px',
                transition: 'all 0.14s ease',
                fontFamily: 'Inter, -apple-system, sans-serif',
                position: 'relative',
                opacity: isFuture && !isNext && !isAppDay ? 0.38 : 1,
              }}
              onMouseEnter={e => { if (clickable) { e.currentTarget.style.transform = 'scale(1.1)'; if (!isConf && !isToday) e.currentTarget.style.background = 'var(--surface-2)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = bg }}
            >
              <span>{day}</span>

              {/* Dot indicator */}
              {!compact && (
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: isConf ? 'rgba(255,255,255,0.7)' :
                              isToday && isAppDay ? 'rgba(255,255,255,0.7)' :
                              hasNote || hasSite ? 'var(--primary)' : 'transparent',
                  display: 'block', flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LEGENDA
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: compact ? '8px' : '10px', flexWrap: 'wrap', paddingTop: '2px' }}>
        {[
          { label: 'Aplicado',  dot: '#10B981',              dotBorder: 'none' },
          { label: 'Agendado',  dot: 'var(--primary-light)', dotBorder: '1.5px dashed var(--primary)' },
          { label: 'Atrasado',  dot: 'rgba(239,68,68,0.10)', dotBorder: '1px solid rgba(239,68,68,0.3)' },
          { label: 'Livre',     dot: 'var(--surface-3)',     dotBorder: '1px solid var(--border)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.dot, border: l.dotBorder }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {!compact && confirmed.size === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
          Toque em qualquer data passada para registrar uma aplicação.
        </p>
      )}
    </div>
  )
}
