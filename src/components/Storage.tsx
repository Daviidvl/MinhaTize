import { useState } from 'react'

type ItemStatus = 'ok' | 'no' | 'warn'

interface MedItem {
  status: ItemStatus
  text: string
}

interface Med {
  id: string
  icon: string
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
    icon: '💉',
    name: 'Tirzepatida',
    brand: 'Mounjaro',
    color: '#0EA5E9',
    badgeBg: 'rgba(14,165,233,0.12)',
    badgeColor: '#0369A1',
    accentBg: 'rgba(14,165,233,0.05)',
    accentBorder: 'rgba(14,165,233,0.18)',
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
    icon: '💉',
    name: 'Semaglutida',
    brand: 'Wegovy',
    color: '#7C3AED',
    badgeBg: 'rgba(124,58,237,0.1)',
    badgeColor: '#6D28D9',
    accentBg: 'rgba(124,58,237,0.05)',
    accentBorder: 'rgba(124,58,237,0.18)',
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
    icon: '💉',
    name: 'Liraglutida',
    brand: 'Olire',
    color: '#059669',
    badgeBg: 'rgba(5,150,105,0.1)',
    badgeColor: '#047857',
    accentBg: 'rgba(5,150,105,0.05)',
    accentBorder: 'rgba(5,150,105,0.18)',
    items: [
      { status: 'ok',   text: 'Manter refrigerada' },
      { status: 'ok',   text: 'Proteger da luz e calor' },
      { status: 'no',   text: 'Não congelar' },
      { status: 'ok',   text: 'Após aberta, validade de até 4 semanas' },
      { status: 'ok',   text: 'Manter tampada e na embalagem original' },
    ],
  },
]

const STATUS_ICON: Record<ItemStatus, string>  = { ok: '✅', no: '❌', warn: '⚠️' }
const STATUS_COLOR: Record<ItemStatus, string> = {
  ok:   'var(--text-secondary)',
  no:   '#DC2626',
  warn: '#B45309',
}
const STATUS_BG: Record<ItemStatus, string> = {
  ok:   'var(--surface-2)',
  no:   'rgba(239,68,68,0.05)',
  warn: 'rgba(245,158,11,0.07)',
}
const STATUS_BORDER: Record<ItemStatus, string> = {
  ok:   'var(--border)',
  no:   'rgba(239,68,68,0.18)',
  warn: 'rgba(245,158,11,0.25)',
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
        background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: '0 4px 20px rgba(14,165,233,0.28)',
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
                textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                background: `${med.color}18`, border: `1px solid ${med.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                {med.icon}
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
                fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0,
                transition: 'transform 0.2s', display: 'inline-block',
                transform: isOpen ? 'rotate(180deg)' : 'none',
              }}>▼</span>
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
                    <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px', lineHeight: 1 }}>
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
        <p style={{ fontWeight: 800, fontSize: '12px', color: 'var(--warn-text)', marginBottom: '6px' }}>
          ⚠️ Importante
        </p>
        <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
          As orientações apresentadas possuem caráter exclusivamente educativo e não substituem as recomendações do fabricante, a bula oficial ou a orientação do profissional de saúde responsável pelo seu tratamento.
        </p>
      </div>

    </div>
  )
}
