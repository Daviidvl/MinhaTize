import { useState } from 'react'
import { Syringe, Check, X, AlertTriangle, ChevronDown, Info } from 'lucide-react'
import { alpha } from '../utils/color'

type ItemStatus = 'ok' | 'no' | 'warn'

interface MedItem {
  status: ItemStatus
  text: string
}

interface Med {
  id: string
  name: string
  brand: string
  color: string
  badgeBg: string
  badgeColor: string
  accentBg: string
  accentBorder: string
  items: MedItem[]
}

const MEDS: Med[] = [
  {
    id: 'tirzepatida',

    name: 'Tirzepatida',
    brand: 'Mounjaro',
    color: 'var(--cobalt)',
    badgeBg: 'var(--ice)',
    badgeColor: 'var(--cobalt)',
    accentBg: 'var(--ice)',
    accentBorder: 'var(--sky)',
    items: [
      { status: 'ok',   text: 'Armazenar entre 2°C e 8°C' },
      { status: 'ok',   text: 'Manter na embalagem original' },
      { status: 'ok',   text: 'Proteger da luz' },
      { status: 'no',   text: 'Não congelar' },
      { status: 'ok',   text: 'Pode permanecer fora da geladeira por até 21 dias quando mantida abaixo de 30°C' },
    ],
  },
  {
    id: 'semaglutida',

    name: 'Semaglutida',
    brand: 'Wegovy',
    color: 'var(--cobalt)',
    badgeBg: 'var(--ice)',
    badgeColor: 'var(--cobalt)',
    accentBg: 'var(--ice)',
    accentBorder: 'var(--sky)',
    items: [
      { status: 'ok',   text: 'Manter refrigerada antes do uso' },
      { status: 'ok',   text: 'Proteger da luz' },
      { status: 'no',   text: 'Não congelar' },
      { status: 'ok',   text: 'Após aberta, pode permanecer fora da geladeira conforme orientação do fabricante' },
      { status: 'warn', text: 'Temperatura máxima recomendada: 30°C' },
    ],
  },
  {
    id: 'liraglutida',

    name: 'Liraglutida',
    brand: 'Olire',
    color: 'var(--teal-d)',
    badgeBg: 'var(--teal-l)',
    badgeColor: 'var(--teal-d)',
    accentBg: 'var(--teal-l)',
    accentBorder: 'var(--teal)',
    items: [
      { status: 'ok',   text: 'Manter refrigerada' },
      { status: 'ok',   text: 'Proteger da luz e calor' },
      { status: 'no',   text: 'Não congelar' },
      { status: 'ok',   text: 'Após aberta, validade de até 4 semanas' },
      { status: 'ok',   text: 'Manter tampada e na embalagem original' },
    ],
  },
]

const STATUS_ICON: Record<ItemStatus, React.ReactNode> = {
  ok:   <Check         size={14} strokeWidth={2.5} />,
  no:   <X             size={14} strokeWidth={2} />,
  warn: <AlertTriangle size={14} strokeWidth={2} />,
}
const STATUS_COLOR: Record<ItemStatus, string> = {
  ok:   'var(--text-secondary)',
  no:   'var(--red)',
  warn: 'var(--amber)',
}
const STATUS_BG: Record<ItemStatus, string> = {
  ok:   'var(--surface-2)',
  no:   'var(--red-bg)',
  warn: 'var(--amber-bg)',
}
const STATUS_BORDER: Record<ItemStatus, string> = {
  ok:   'var(--border)',
  no:   'var(--red-line)',
  warn: 'var(--amber-line)',
}

export default function Storage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['tirzepatida']))

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Intro banner */}
      <div style={{
        background: 'var(--g-hero)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: '0 4px 20px rgba(var(--shadow-rgb),0.28)',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Orientações de armazenamento
        </p>
        <p style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '8px' }}>
          Armazene corretamente para preservar a eficácia
        </p>
        <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
          Temperaturas inadequadas podem comprometer a estabilidade e a qualidade da medicação.
        </p>
      </div>

      {/* Accordion cards */}
      {MEDS.map(med => {
        const isOpen = expanded.has(med.id)
        return (
          <div key={med.id} style={{
            borderRadius: '16px', overflow: 'hidden',
            border: `1.5px solid ${isOpen ? med.accentBorder : 'var(--border)'}`,
            background: isOpen ? med.accentBg : 'var(--surface)',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-card)',
          }}>

            {/* Header */}
            <button
              onClick={() => toggle(med.id)}
              style={{
                width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                textAlign: 'left', fontFamily: "Inter, -apple-system, sans-serif",
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                background: alpha(med.color, 9), border: `1px solid ${alpha(med.color, 19)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: med.color,
              }}>
                <Syringe size={20} strokeWidth={1.75} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                    {med.name}
                  </p>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                    background: med.badgeBg, color: med.badgeColor,
                  }}>
                    {med.brand}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Armazenamento correto
                </p>
              </div>

              <span style={{
                flexShrink: 0, color: 'var(--text-muted)',
                transition: 'transform 0.2s', display: 'inline-flex',
                transform: isOpen ? 'rotate(180deg)' : 'none',
              }}><ChevronDown size={16} strokeWidth={1.75} /></span>
            </button>

            {/* Items */}
            {isOpen && (
              <div style={{
                padding: '0 14px 14px',
                borderTop: `1px solid ${med.accentBorder}`,
                display: 'flex', flexDirection: 'column', gap: '7px',
              }}>
                {med.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '9px 12px', borderRadius: '11px',
                    background: STATUS_BG[item.status],
                    border: `1px solid ${STATUS_BORDER[item.status]}`,
                  }}>
                    <span style={{
                      flexShrink: 0, marginTop: '2px', lineHeight: 1,
                      color: STATUS_COLOR[item.status],
                    }}>
                      {STATUS_ICON[item.status]}
                    </span>
                    <p style={{
                      fontSize: '13px', lineHeight: 1.5, margin: 0,
                      color: STATUS_COLOR[item.status],
                      fontWeight: item.status === 'no' ? 700 : item.status === 'warn' ? 700 : 500,
                    }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Disclaimer */}
      <div className="card-warning">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Info size={13} strokeWidth={2} style={{ color: 'var(--warn-text)', flexShrink: 0 }} />
          <p style={{ fontWeight: 800, fontSize: '12px', color: 'var(--warn-text)', margin: 0 }}>Importante</p>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
          As orientações apresentadas possuem caráter exclusivamente educativo e não substituem as recomendações do fabricante, a bula oficial ou a orientação do profissional de saúde responsável pelo seu tratamento.
        </p>
      </div>

    </div>
  )
}
