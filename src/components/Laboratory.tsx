import { useState } from 'react'
import {
  FlaskConical,
  ChevronDown, FileText, Download, Info, Check, AlertTriangle, XCircle,
  ClipboardList, BarChart2,
} from 'lucide-react'
import { UserProfile } from '../types'
import {
  type ExamStatus,
  CATEGORY_ICON, CATEGORY_ICON_SM, CATEGORIES, EXAMS,
  STATUS_LABEL, STATUS_COLOR, STATUS_BG, STATUS_BORDER,
} from '../data/labExams'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Laboratory({ profile, onUpdateProfile }: Props) {
  const sex = profile.sex

  const [innerTab, setInnerTab] = useState<'exams' | 'analysis'>('exams')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['metabolic']))

  // Local input state — synced to profile on blur
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const r of profile.labResults ?? []) {
      map[r.examId] = String(r.value)
    }
    return map
  })

  // ── Persistence ──────────────────────────────────────────────────────────
  function commitValue(examId: string, raw: string) {
    const value = parseFloat(raw)
    const rest  = (profile.labResults ?? []).filter(r => r.examId !== examId)
    if (!raw || isNaN(value)) {
      onUpdateProfile({ ...profile, labResults: rest })
    } else {
      const date = new Date().toISOString().split('T')[0]
      onUpdateProfile({ ...profile, labResults: [...rest, { examId, value, date }] })
    }
  }

  function clearExam(examId: string) {
    setInputs(p => ({ ...p, [examId]: '' }))
    commitValue(examId, '')
  }

  // ── Computed results ─────────────────────────────────────────────────────
  const savedResults = profile.labResults ?? []

  const filledExams = EXAMS.flatMap(exam => {
    const saved = savedResults.find(r => r.examId === exam.id)
    if (!saved) return []
    return [{ exam, value: saved.value, status: exam.getStatus(saved.value, sex) }]
  })

  const abnormal = filledExams.filter(r => r.status !== 'normal')

  const priority: 'none' | 'green' | 'yellow' | 'red' =
    filledExams.length === 0 ? 'none'
    : abnormal.length === 0  ? 'green'
    : abnormal.length <= 3   ? 'yellow'
    : 'red'

  // ── Checkup items ────────────────────────────────────────────────────────
  const checkupItems = CATEGORIES.flatMap(cat => {
    const catResults = filledExams.filter(r => r.exam.category === cat.id)
    if (catResults.length === 0) return []
    const catAbnormal = catResults.filter(r => r.status !== 'normal')
    if (catAbnormal.length === 0) {
      return [{ ok: true, text: cat.checkupLabel }]
    }
    return catAbnormal.map(r => ({
      ok: false,
      text: `${r.exam.name} ${r.status === 'low' ? 'abaixo' : 'acima'} da referência`,
    }))
  })

  // ── PDF: solicitação (sempre disponível) ────────────────────────────────
  function downloadRequest() {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const sections = CATEGORIES.map(cat => {
      const catExams = EXAMS.filter(e => e.category === cat.id)
      const rows = catExams.map(exam => {
        const ref = typeof exam.refDisplay === 'function'
          ? (sex
              ? exam.refDisplay(sex)
              : `F: ${exam.refDisplay('female')}  – M: ${exam.refDisplay('male')}`)
          : exam.refDisplay
        return `<tr>
          <td>${exam.name}</td>
          <td>${exam.unit || '–'}</td>
          <td>${ref}</td>
          <td></td>
        </tr>`
      }).join('')

      return `
        <h2>${cat.title}</h2>
        <table>
          <thead><tr><th>Exame</th><th>Unidade</th><th>Referência (plataforma)</th><th>Resultado</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Solicitação de Exames – Minha Tize</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;max-width:820px;margin:0 auto;padding:24px;color:#111;line-height:1.5}
    h1{color:#059669;font-size:22px;margin-bottom:2px}
    .sub{color:#6b7280;font-size:12px;margin-bottom:28px}
    h2{color:#374151;font-size:15px;border-bottom:2px solid #e5e7eb;padding-bottom:5px;margin-top:24px;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-bottom:4px;font-size:12px}
    thead tr{background:#f0fdf4}
    th{text-align:left;padding:7px 10px;font-size:10px;color:#374151;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
    td{padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
    td:last-child{min-width:90px;border-left:1px solid #e5e7eb}
    tr:last-child td{border-bottom:none}
    .disc{font-size:11px;color:#6b7280;border-top:2px solid #e5e7eb;padding-top:14px;margin-top:28px;line-height:1.6}
    @media print{body{padding:12px}h2{page-break-before:auto}table{page-break-inside:avoid}}
  </style>
</head>
<body>
  <h1>Minha Tize – Solicitação de Exames Essenciais</h1>
  <p class="sub">Gerado em ${today} – Leve ao seu médico, nutricionista ou laboratório</p>
  ${sections}
  <div class="disc">
    <strong>Aviso importante:</strong> Os valores de referência são gerais, baseados em literatura científica, e podem variar entre laboratórios, métodos analíticos, equipamentos, sexo, idade e contexto clínico. Sempre que houver divergência entre a plataforma e o laudo laboratorial, prevalece o valor de referência informado pelo laboratório. Esta plataforma fornece apenas orientação educativa – não realiza diagnóstico, não sugere tratamento, não sugere medicamentos e não sugere suplementação específica.
  </div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  // ── PDF: resultados (disponível quando há exames preenchidos) ────────────
  function downloadResults() {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const statusColor: Record<ExamStatus, string> = { normal: '#059669', low: '#B45309', high: '#DC2626' }
    const statusLabel: Record<ExamStatus, string> = { normal: 'Normal', low: 'Baixo', high: 'Alto' }

    const sections = CATEGORIES.map(cat => {
      const catExams = EXAMS.filter(e => e.category === cat.id)
      const rows = catExams.map(exam => {
        const ref = typeof exam.refDisplay === 'function'
          ? (sex
              ? exam.refDisplay(sex)
              : `F: ${exam.refDisplay('female')}  – M: ${exam.refDisplay('male')}`)
          : exam.refDisplay
        const raw    = inputs[exam.id]
        const value  = raw ? parseFloat(raw) : null
        const status = value !== null ? exam.getStatus(value, sex) : null
        const valueCell  = value !== null
          ? `<span style="font-weight:700;color:${statusColor[status!]}">${raw} ${exam.unit}</span>`
          : `<span style="color:#9ca3af">–</span>`
        const statusCell = status !== null
          ? `<span style="font-weight:700;color:${statusColor[status]}">${statusLabel[status]}</span>`
          : `<span style="color:#d1d5db">–</span>`
        return `<tr>
          <td>${exam.name}</td>
          <td>${valueCell}</td>
          <td>${ref}</td>
          <td>${statusCell}</td>
        </tr>`
      }).join('')

      return `
        <h2>${cat.title}</h2>
        <table>
          <thead><tr><th>Exame</th><th>Resultado</th><th>Referência (plataforma)</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`
    }).join('')

    const filledCount = Object.values(inputs).filter(v => v !== '').length

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Resultados de Exames – Minha Tize</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;max-width:820px;margin:0 auto;padding:24px;color:#111;line-height:1.5}
    h1{color:#059669;font-size:22px;margin-bottom:2px}
    .sub{color:#6b7280;font-size:12px;margin-bottom:28px}
    h2{color:#374151;font-size:15px;border-bottom:2px solid #e5e7eb;padding-bottom:5px;margin-top:24px;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-bottom:4px;font-size:12px}
    thead tr{background:#f0fdf4}
    th{text-align:left;padding:7px 10px;font-size:10px;color:#374151;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
    td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:#fafafa}
    .disc{font-size:11px;color:#6b7280;border-top:2px solid #e5e7eb;padding-top:14px;margin-top:28px;line-height:1.6}
    @media print{body{padding:12px}h2{page-break-before:auto}table{page-break-inside:avoid}}
  </style>
</head>
<body>
  <h1>Minha Tize – Resultados de Exames</h1>
  <p class="sub">Gerado em ${today} – ${filledCount} exame${filledCount !== 1 ? 's' : ''} preenchido${filledCount !== 1 ? 's' : ''}</p>
  ${sections}
  <div class="disc">
    <strong>Aviso importante:</strong> A Minha Tize não substitui avaliação médica. Os valores de referência são gerais, baseados em literatura científica, e podem variar entre laboratórios, métodos analíticos, equipamentos, sexo, idade e contexto clínico. Sempre que houver divergência entre a plataforma e o laudo laboratorial, prevalece o valor de referência informado pelo laboratório. Esta plataforma fornece apenas orientação educativa – não realiza diagnóstico, não sugere tratamento, não sugere medicamentos e não sugere suplementação específica.
  </div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  // ── Toggle category ──────────────────────────────────────────────────────
  function toggleCat(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div data-tour="lab-main" className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Laboratório</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Insira seus resultados e receba orientações educativas
          </p>
        </div>
        {priority !== 'none' && (
          <div style={{
            flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%',
            background: priority === 'green' ? 'var(--primary-light)' : priority === 'yellow' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
            border: `2px solid ${priority === 'green' ? 'var(--primary)' : priority === 'yellow' ? '#F59E0B' : '#EF4444'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: priority === 'green' ? 'var(--primary)' : priority === 'yellow' ? '#F59E0B' : '#EF4444',
          }}>
            {priority === 'green'
              ? <Check          size={20} strokeWidth={2.5} />
              : priority === 'yellow'
              ? <AlertTriangle  size={20} strokeWidth={2.5} />
              : <XCircle        size={20} strokeWidth={2.5} />}
          </div>
        )}
      </div>

      {/* Priority banner */}
      {priority !== 'none' && (
        <div style={{
          padding: '10px 14px', borderRadius: '11px', fontWeight: 700, fontSize: '13px',
          background: priority === 'green' ? 'var(--primary-light)' : priority === 'yellow' ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${priority === 'green' ? 'rgba(16,185,129,0.2)' : priority === 'yellow' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: priority === 'green' ? 'var(--primary)' : priority === 'yellow' ? '#B45309' : '#DC2626',
        }}>
          {priority === 'green' && 'Todos os exames analisados dentro da referência'}
          {priority === 'yellow' && `${abnormal.length} alteração${abnormal.length > 1 ? 'ões' : ''} identificada${abnormal.length > 1 ? 's' : ''} – veja a análise`}
          {priority === 'red'    && 'Múltiplas alterações identificadas – discuta com seu médico'}
        </div>
      )}

      {/* Sex notice */}
      {!sex && EXAMS.some(e => e.sexDependent && savedResults.some(r => r.examId === e.id)) && (
        <div className="card-warning">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
            <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
              Você tem exames que dependem do sexo para referência. Configure o sexo no seu <strong>Perfil → Editar</strong> para uma análise mais precisa.
            </p>
          </div>
        </div>
      )}

      {/* Inner tabs */}
      <div style={{
        display: 'flex', gap: '5px',
        background: 'var(--surface-2)', borderRadius: '14px', padding: '4px',
      }}>
        {([
          { id: 'exams'    as const, label: 'Exames',    icon: <ClipboardList size={14} strokeWidth={2} /> },
          { id: 'analysis' as const, label: `Análise${filledExams.length > 0 ? ` (${filledExams.length})` : ''}`, icon: <BarChart2 size={14} strokeWidth={2} /> },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setInnerTab(t.id)}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none',
              background: innerTab === t.id ? 'var(--primary)' : 'transparent',
              color: innerTab === t.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "Inter, -apple-system, sans-serif",
              boxShadow: innerTab === t.id ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              {t.icon}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* ─── EXAMES TAB ──────────────────────────────────────────────── */}
      {innerTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Card 1 – Solicitação de exames (sempre disponível) */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)',
              }}>
                <FileText size={20} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                  Solicitação de Exames Essenciais
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  Baixe esta lista e leve ao laboratório, clínica ou médico de sua preferência.
                </p>
              </div>
            </div>
            <button onClick={downloadRequest} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Download size={15} strokeWidth={2.5} />
              Baixar PDF
            </button>
          </div>

          {/* Card 2 – Progresso dos resultados */}
          {(() => {
            const filled = EXAMS.filter(e => inputs[e.id] && inputs[e.id] !== '').length
            const total  = EXAMS.length
            return (
              <div style={{
                padding: '14px 16px', borderRadius: '14px',
                background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '9px',
                      background: 'var(--primary-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                    }}>
                      <FlaskConical size={16} strokeWidth={2} />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                      Resultados Laboratoriais
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                    {filled}/{total}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '99px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px', background: 'var(--primary)',
                    width: `${(filled / total) * 100}%`, transition: 'width 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  {filled === 0
                    ? 'Após receber seus resultados, cadastre-os aqui para receber análise educativa.'
                    : `${filled} de ${total} exames cadastrados`}
                </p>
              </div>
            )
          })()}

          {/* Disclaimer */}
          <div className="card-warning">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
              <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
                Os valores de referência são gerais e podem variar entre laboratórios, métodos e contexto clínico. Quando houver divergência, prevalece o valor do seu laudo. A plataforma <strong>não realiza diagnóstico</strong>.
              </p>
            </div>
          </div>

          {/* Categories */}
          {CATEGORIES.map(cat => {
            const catExams   = EXAMS.filter(e => e.category === cat.id)
            const isOpen     = expanded.has(cat.id)
            const filledCnt  = catExams.filter(e => {
              const v = inputs[e.id]
              return v !== '' && v !== undefined && !isNaN(parseFloat(v))
            }).length

            return (
              <div key={cat.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Category toggle */}
                <button
                  onClick={() => toggleCat(cat.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: "Inter, -apple-system, sans-serif",
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)',
                  }}>
                    {CATEGORY_ICON[cat.id]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                      {cat.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {filledCnt}/{catExams.length} preenchidos
                    </p>
                  </div>
                  {filledCnt > 0 && (
                    <span className="badge badge-green" style={{ marginRight: '4px' }}>{filledCnt}</span>
                  )}
                  <span style={{
                    color: 'var(--text-muted)',
                    transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none',
                    display: 'inline-flex',
                  }}><ChevronDown size={16} strokeWidth={2} /></span>
                </button>

                {/* Exam fields */}
                {isOpen && (
                  <div style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                  }}>
                    {catExams.map(exam => {
                      const val    = inputs[exam.id] ?? ''
                      const parsed = parseFloat(val)
                      const hasVal = val !== '' && !isNaN(parsed)
                      const status = hasVal ? exam.getStatus(parsed, sex) : null
                      const refTxt = typeof exam.refDisplay === 'function'
                        ? exam.refDisplay(sex)
                        : exam.refDisplay

                      return (
                        <div key={exam.id} style={{ paddingTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                                {exam.name}
                              </p>
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Ref: {refTxt}
                              </p>
                            </div>
                            {status && (
                              <span style={{
                                flexShrink: 0, fontSize: '10px', fontWeight: 700,
                                padding: '3px 8px', borderRadius: '99px',
                                background: STATUS_BG[status], color: STATUS_COLOR[status],
                              }}>
                                {STATUS_LABEL[status]}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="number"
                              className="input-field"
                              placeholder={exam.unit ? `Valor em ${exam.unit}` : 'Valor'}
                              value={val}
                              step={exam.step ?? 0.1}
                              inputMode="decimal"
                              onChange={e => setInputs(p => ({ ...p, [exam.id]: e.target.value }))}
                              onBlur={e  => commitValue(exam.id, e.target.value)}
                              style={{ flex: 1 }}
                            />
                            {hasVal && (
                              <button
                                onClick={() => clearExam(exam.id)}
                                style={{
                                  width: '42px', flexShrink: 0, borderRadius: '9px',
                                  border: '1px solid var(--border)', background: 'var(--surface-2)',
                                  cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >×</button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─── ANÁLISE TAB ─────────────────────────────────────────────── */}
      {innerTab === 'analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {filledExams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '18px', margin: '0 auto 14px',
                background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--primary)',
              }}>
                <FlaskConical size={26} strokeWidth={2} />
              </div>
              <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                Nenhum exame preenchido
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                Vá em "Exames" e insira seus resultados
              </p>
            </div>
          ) : (
            <>
              {/* Interpretations per category */}
              {CATEGORIES.map(cat => {
                const catResults = filledExams.filter(r => r.exam.category === cat.id)
                if (catResults.length === 0) return null

                return (
                  <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      color: 'var(--text-muted)',
                    }}>
                      {CATEGORY_ICON_SM[cat.id]}
                      <p style={{
                        fontWeight: 700, fontSize: '11px',
                        textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0,
                      }}>
                        {cat.title}
                      </p>
                    </div>

                    {catResults.map(({ exam, value, status }) => (
                      <div key={exam.id} style={{
                        padding: '12px 14px', borderRadius: '13px',
                        background: status === 'normal' ? 'var(--surface)' : STATUS_BG[status] + '4d',
                        border: `1px solid ${STATUS_BORDER[status]}`,
                        boxShadow: 'var(--shadow-card)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px', gap: '8px' }}>
                          <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', margin: 0, minWidth: 0 }}>
                            {exam.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: STATUS_COLOR[status] }}>
                              {value}{exam.unit ? ` ${exam.unit}` : ''}
                            </span>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                              background: STATUS_BG[status], color: STATUS_COLOR[status],
                            }}>
                              {STATUS_LABEL[status]}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                          {exam.interpret(value, status, sex)}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* Checkup Minha Tize */}
              <div style={{
                background: 'linear-gradient(135deg, var(--surface), var(--surface-2))',
                border: '1px solid var(--border)', borderRadius: '18px', padding: '18px 20px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <p style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  Seu Checkup Minha Tize
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {checkupItems.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '8px 11px', borderRadius: '10px',
                      background: item.ok ? 'var(--primary-light)' : 'rgba(245,158,11,0.07)',
                    }}>
                      <span style={{ lineHeight: 1.4, flexShrink: 0, display: 'flex', color: item.ok ? 'var(--primary)' : '#92400E' }}>
                        {item.ok
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        }
                      </span>
                      <p style={{
                        fontSize: '13px', fontWeight: 600, margin: 0,
                        color: item.ok ? 'var(--primary)' : '#92400E',
                        lineHeight: 1.4,
                      }}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.5 }}>
                  Recomenda-se discutir estes resultados com seu médico ou nutricionista.
                </p>
              </div>

              {/* Download resultados */}
              <button onClick={downloadResults} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Download size={15} strokeWidth={2.5} />
                Baixar PDF com Resultados
              </button>

              {/* Disclaimer */}
              <div className="card-warning">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
                  <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.65, margin: 0 }}>
                    <strong>Aviso importante:</strong> A Minha Tize não substitui avaliação médica. Os valores de referência são gerais e podem variar entre laboratórios, métodos analíticos, equipamentos, sexo, idade e contexto clínico. Quando houver divergência entre a plataforma e o laudo laboratorial, prevalece o valor de referência informado pelo laboratório. Esta ferramenta fornece apenas orientação educativa – não realiza diagnóstico, não sugere tratamento, medicamentos ou suplementação específica.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
