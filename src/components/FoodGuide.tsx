import { useState } from 'react'

interface FoodItem {
  name: string
  reason: string
}

interface Category {
  id: string
  icon: string
  label: string
  color: string
  bg: string
  border: string
  items: FoodItem[]
}

const CATEGORIES: Category[] = [
  {
    id: 'avoid',
    icon: '🚫',
    label: 'Evitar',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.2)',
    items: [
      { name: 'Frituras e alimentos gordurosos', reason: 'Agrava náusea e retarda ainda mais o esvaziamento gástrico' },
      { name: 'Bebidas gaseificadas', reason: 'Causa distensão abdominal e desconforto intenso' },
      { name: 'Álcool', reason: 'Potencializa efeitos colaterais e pode causar hipoglicemia' },
      { name: 'Refeições muito grandes', reason: 'O estômago esvazia mais devagar — prefira 5 a 6 pequenas refeições' },
      { name: 'Alimentos ultraprocessados', reason: 'Alta densidade calórica com pouco valor nutricional, atrapalha os resultados' },
      { name: 'Doces e açúcar em excesso', reason: 'Picos glicêmicos reduzem a eficiência do medicamento' },
    ],
  },
  {
    id: 'moderate',
    icon: '⚠️',
    label: 'Moderação',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.2)',
    items: [
      { name: 'Laticínios integrais', reason: 'Podem agravar náusea em algumas pessoas — prefira versões com menos gordura' },
      { name: 'Vegetais crus em excesso', reason: 'Fibras insolúveis em grande quantidade podem causar desconforto' },
      { name: 'Cafeína', reason: 'Em excesso pode intensificar tontura e irritação gástrica' },
      { name: 'Alimentos muito gelados', reason: 'Podem provocar espasmos e desconforto digestivo' },
      { name: 'Carnes vermelhas gordas', reason: 'Digestão mais lenta — consuma em porções pequenas e com menos frequência' },
    ],
  },
  {
    id: 'allies',
    icon: '✅',
    label: 'Aliados',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    items: [
      { name: 'Proteínas magras', reason: 'Frango, peixe e ovos preservam massa muscular durante o emagrecimento' },
      { name: 'Vegetais cozidos', reason: 'Fáceis de digerir e nutritivos — brócolis, abobrinha, cenoura' },
      { name: 'Gengibre', reason: 'Propriedade antiemética natural — ótimo aliado contra náusea' },
      { name: 'Água e hidratação', reason: 'Fundamental — a Tirzepatida pode reduzir a sensação de sede' },
      { name: 'Fibras solúveis', reason: 'Aveia, banana, maçã — regulam o intestino sem agravar desconforto' },
      { name: 'Refeições menores e frequentes', reason: 'Respeita o ritmo mais lento de digestão e reduz náusea' },
    ],
  },
]

export default function FoodGuide() {
  const [open, setOpen] = useState<string | null>('allies')

  return (
    <div className="space-y-4 fade-in">
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Guia Alimentar
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>
          A Tirzepatida retarda o esvaziamento gástrico. A alimentação certa reduz efeitos colaterais e potencializa os resultados.
        </p>
      </div>

      {CATEGORIES.map(cat => (
        <div
          key={cat.id}
          style={{
            borderRadius: '16px',
            border: `1.5px solid ${open === cat.id ? cat.border : 'var(--border)'}`,
            background: open === cat.id ? cat.bg : 'var(--surface)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <button
            onClick={() => setOpen(open === cat.id ? null : cat.id)}
            style={{
              width: '100%', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '34px', height: '34px', borderRadius: '9px',
                background: `${cat.color}18`, border: `1px solid ${cat.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>
                {cat.icon}
              </span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: cat.color }}>{cat.label}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {cat.items.length} itens
                </p>
              </div>
            </div>
            <span style={{
              fontSize: '11px', color: 'var(--text-muted)',
              transform: open === cat.id ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}>▼</span>
          </button>

          {open === cat.id && (
            <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cat.items.map(item => (
                <div
                  key={item.name}
                  style={{
                    padding: '10px 12px', borderRadius: '10px',
                    background: 'var(--surface)',
                    border: `1px solid ${cat.border}`,
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="card-warning">
        <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
          ⚕️ Este guia é informativo. Cada organismo responde de forma diferente. Consulte um nutricionista para um plano alimentar personalizado.
        </p>
      </div>
    </div>
  )
}
