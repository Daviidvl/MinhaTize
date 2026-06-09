import { useState } from 'react'
import { Utensils, Info, ChevronDown, RotateCcw, Droplets, Leaf, AlertCircle } from 'lucide-react'

type DietSex = 'M' | 'F'
type DietTab = 'cardapio' | 'pouca-fome'

const STORAGE_KEY = 'tizetrack_diet'

interface DietProfile { sex: DietSex }

interface Option {
  label?: string
  items: string[]
  protein?: string
  note?: string
}

interface MealSection {
  id: string
  label: string
  sublabel?: string
  color: string
  options: Option[]
}

interface ListSection {
  id: string
  label: string
  items: string[]
  note?: string
}

// ── Female meals ──────────────────────────────────────────────────────────────
const FEMALE_MEALS: MealSection[] = [
  {
    id: 'f-cafe', label: 'Café da Manhã', color: '#D97706',
    options: [
      { items: ['1 pão francês', '2 ovos inteiros', '30 g de queijo branco', '1 fruta: mamão (120 g), banana (50 g), kiwi (90 g) ou melão'], protein: '25–30 g' },
      { items: ['1 pão francês', '1 ovo inteiro + 3 claras', '20 g de queijo branco ou requeijão light', '1 fruta'], protein: '28–30 g' },
      { items: ['2 fatias de pão integral', '2 ovos inteiros', '1 fruta'], protein: '25 g' },
      { label: 'Vitamina', items: ['200 ml de leite desnatado', '1 scoop de whey', '20 g de aveia', '1 fruta'], protein: '30–35 g' },
      { items: ['170 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'], protein: '35–40 g' },
    ],
  },
  {
    id: 'f-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B',
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['1 iogurte proteico'] },
      { items: ['2 ovos cozidos'] },
      { items: ['1 fruta', '50 g de cottage ou ricota'], protein: '15–25 g (média)' },
    ],
  },
  {
    id: 'f-almoco', label: 'Almoço', color: '#059669',
    options: [
      { items: ['Arroz branco cozido (90–120 g)', 'Feijão (70–100 g)', 'Frango grelhado (120–150 g)', 'Legumes cozidos', 'Pequena porção de salada'], protein: '35–45 g' },
      { items: ['Arroz branco (100–120 g)', 'Frango (120–150 g)', 'Legumes'], note: 'Chocolate ao leite (15 g) eventualmente, apenas para aderência.' },
      { items: ['Baião de dois (100–130 g)', 'Frango ou carne magra (120–150 g)', 'Legumes'] },
      { items: ['Macarrão cozido (100–120 g)', 'Sardinha ou peixe (130–150 g)', 'Legumes'] },
      { items: ['Arroz branco (90–120 g)', 'Feijão (70–100 g)', 'Carne magra (100–120 g)', 'Legumes'] },
    ],
  },
  {
    id: 'f-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2',
    options: [
      { items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Sanduíche', items: ['2 fatias de pão integral', '100 g de frango desfiado'] },
      { items: ['Iogurte proteico', '15 g de aveia'] },
      { items: ['2 ovos', '1 fruta'] },
      { items: ['120 g de cuscuz', '50 g de carne magra', '10 g de requeijão light'] },
    ],
  },
  {
    id: 'f-jantar', label: 'Jantar', color: '#7C3AED',
    options: [
      { items: ['Arroz branco (100–120 g)', 'Carne magra ou frango (100–140 g)', 'Legumes cozidos'], protein: '30–40 g' },
      { label: 'Sanduíche', items: ['1 pão francês', 'Frango desfiado (100–120 g)', '20 g de queijo branco', 'Pequena porção de salada'] },
      { items: ['Baião de dois (100–120 g)', 'Carne magra (100–120 g)'] },
      { items: ['Macarrão cozido', 'Frango ou atum (100–120 g)'] },
      { label: 'Omelete', items: ['2 ovos inteiros + 3 claras', 'Pequena porção de arroz ou batata'] },
      { label: 'Dias de pouca fome', items: ['170 g de iogurte grego natural', '1 scoop de whey', '20 g de aveia', 'Morangos ou banana'], protein: '35–40 g' },
    ],
  },
  {
    id: 'f-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF',
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['200 ml de leite desnatado', '20 g de whey'] },
      { items: ['Iogurte proteico'] },
      { items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

const FEMALE_LISTS: ListSection[] = [
  {
    id: 'f-prot-sub', label: 'Substituições das Proteínas',
    items: ['Frango desfiado', 'Carne magra', 'Patinho moído', 'Peixe', 'Sardinha', 'Atum', 'Fígado (1×/semana, se houver boa aceitação)', '3 ovos', 'Iogurte grego', 'Whey protein'],
  },
  {
    id: 'f-carb-sub', label: 'Substituições dos Carboidratos',
    items: ['Arroz branco', 'Macarrão', 'Cuscuz', 'Tapioca', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Baião de dois'],
  },
  {
    id: 'f-frutas', label: 'Frutas Prioritárias',
    items: ['Mamão', 'Kiwi', 'Banana', 'Morango', 'Melão', 'Maçã', 'Pera'],
  },
  {
    id: 'f-fibras', label: 'Fibras e Constipação',
    items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais', 'Água'],
    note: 'Se necessário: Psyllium 5 g inicialmente, podendo chegar a 10 g/dia. Sempre acompanhado de boa hidratação.',
  },
  {
    id: 'f-peixes', label: 'Peixes e Ômega-3',
    items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'],
    note: 'Idealmente 2 vezes por semana.',
  },
]

// ── Male meals ────────────────────────────────────────────────────────────────
const MALE_MEALS: MealSection[] = [
  {
    id: 'm-cafe', label: 'Café da Manhã', color: '#D97706',
    options: [
      { items: ['1 pão francês', '3 ovos', '30 g de queijo branco', '1 fruta: mamão (180 g), banana (70 g), kiwi (130 g) ou melão'], protein: '30 g' },
      { items: ['2 fatias de pão integral', '120 g de frango desfiado (ou 2 ovos + 3 claras)', '1 fruta'], protein: '30–35 g' },
      { items: ['40 g de aveia', '1 scoop de whey', '200 ml de leite semidesnatado', '1 fruta'], protein: '35 g' },
      { items: ['170–200 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'], protein: '35–40 g' },
    ],
  },
  {
    id: 'm-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B',
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['1 iogurte proteico'] },
      { items: ['2 ovos cozidos'] },
      { items: ['1 fruta', '50 g de cottage ou ricota'], protein: '15–25 g (média)' },
    ],
  },
  {
    id: 'm-almoco', label: 'Almoço', color: '#059669',
    options: [
      { items: ['Arroz branco cozido (130–180 g)', 'Feijão (100 g)', 'Frango grelhado (150–200 g)', 'Legumes cozidos', 'Pequena porção de salada'], protein: '40–50 g' },
      { items: ['Macarrão cozido (150–180 g)', 'Patinho moído ou carne magra (150–180 g)', 'Legumes cozidos'] },
      { items: ['Baião de dois (180–220 g)', 'Frango desfiado ou carne magra (150–180 g)', 'Legumes', 'Salada'] },
      { items: ['Arroz (130 g)', 'Feijão (100 g)', 'Peixe (180 g)', 'Legumes cozidos'] },
      { items: ['Batata doce ou mandioca', 'Frango ou carne magra (150–180 g)', 'Legumes'] },
    ],
  },
  {
    id: 'm-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2',
    options: [
      { items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Sanduíche', items: ['2 fatias de pão integral', '100–120 g de frango desfiado (ou 1 lata de atum em água)'] },
      { items: ['Iogurte proteico', '15 g de aveia'] },
      { items: ['2 ovos', '1 fruta'] },
    ],
  },
  {
    id: 'm-jantar', label: 'Jantar', color: '#7C3AED',
    options: [
      { items: ['Arroz (120–160 g)', 'Carne magra ou frango (150–180 g)', 'Legumes cozidos'], protein: '40–45 g' },
      { items: ['1 pão francês', 'Frango desfiado (150 g)', '30 g de queijo branco', 'Legumes ou pequena salada'] },
      { label: 'Omelete', items: ['3 ovos inteiros + 3 claras', 'Pequena porção de arroz ou batata'] },
      { items: ['Macarrão cozido', 'Atum ou frango (150–180 g)'] },
      { label: 'Dias de pouca fome', items: ['170 g de iogurte grego', '1 scoop de whey', '1 banana', '20 g de aveia'], protein: '40 g' },
    ],
  },
  {
    id: 'm-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF',
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['200 ml de leite desnatado', '20 g de whey'] },
      { items: ['Iogurte proteico'] },
      { items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

const MALE_LISTS: ListSection[] = [
  {
    id: 'm-prot-sub', label: 'Fontes de Proteína para Rodízio',
    items: ['Frango', 'Patinho', 'Coxão mole', 'Peixes', 'Atum em água', 'Sardinha', 'Ovos', 'Iogurte grego', 'Cottage', 'Ricota', 'Whey protein'],
  },
  {
    id: 'm-carb', label: 'Carboidratos',
    items: ['Arroz', 'Feijão', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Macarrão', 'Pão francês', 'Pão integral', 'Aveia', 'Cuscuz', 'Tapioca em porções moderadas'],
  },
  {
    id: 'm-frutas', label: 'Frutas Prioritárias',
    items: ['Mamão', 'Kiwi', 'Pera', 'Maçã', 'Morango', 'Banana', 'Melão'],
    note: 'Para o intestino e melhor tolerância.',
  },
  {
    id: 'm-fibras', label: 'Fibras e Constipação',
    items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais'],
    note: 'Se necessário: Psyllium 5 g inicialmente, podendo evoluir para 10 g/dia. Sempre associado ao aumento da ingestão de água.',
  },
  {
    id: 'm-peixes', label: 'Peixes e Ômega-3',
    items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'],
    note: 'Idealmente duas vezes por semana.',
  },
]

// ── Low hunger module ─────────────────────────────────────────────────────────
const LOW_HUNGER_MEALS: MealSection[] = [
  {
    id: 'lh-cafe', label: 'Café da Manhã', color: '#D97706',
    options: [
      { items: ['170 g de iogurte grego', '1 scoop de whey', 'Morangos ou banana'], protein: '35–40 g' },
      { label: 'Vitamina', items: ['200 ml de leite semidesnatado', '1 scoop de whey', '20 g de aveia', '1 banana'], protein: '30–35 g' },
      { items: ['2 ovos', '2 claras', '1 fatia de pão'], protein: '25–30 g' },
    ],
  },
  {
    id: 'lh-almoco', label: 'Almoço — Prato Pequeno', color: '#059669',
    options: [
      {
        label: 'Prato reduzido',
        items: ['100–130 g de arroz', '150–180 g de frango ou carne magra', 'Legumes cozidos (sem exagerar na salada crua)'],
        note: 'Prioridade: comer primeiro a proteína.',
      },
    ],
  },
  {
    id: 'lh-lanches', label: 'Lanches', color: '#F59E0B',
    options: [
      { items: ['Whey com água'] },
      { items: ['Iogurte proteico'] },
      { items: ['Cottage ou ricota'] },
    ],
  },
  {
    id: 'lh-jantar', label: 'Jantar', color: '#7C3AED',
    options: [
      { label: 'Omelete', items: ['3 ovos', '3 claras', 'Pequena porção de arroz'] },
      { label: 'Sanduíche', items: ['1 pão francês', '150 g de frango desfiado', '30 g de queijo branco'] },
      { items: ['Iogurte grego', '1 scoop de whey', '20 g de aveia'], protein: '40 g' },
    ],
  },
]

// ── Pill button ───────────────────────────────────────────────────────────────
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
        fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '13px', fontWeight: 700,
        background: active ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' : 'var(--surface-2)',
        color: active ? '#fff' : 'var(--text-primary)',
        outline: active ? 'none' : '1px solid var(--border)',
        transition: 'all 0.15s',
        boxShadow: active ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FoodGuide() {
  const [profile, setProfile] = useState<DietProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const [formSex, setFormSex] = useState<DietSex | null>(() => {
    try {
      const raw = localStorage.getItem('tizetrack_profile')
      if (raw) {
        const p = JSON.parse(raw)
        if (p.sex === 'M' || p.sex === 'F') return p.sex as DietSex
      }
    } catch { /* */ }
    return null
  })

  const [activeTab, setActiveTab] = useState<DietTab>('cardapio')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function saveProfile() {
    if (!formSex) return
    const p: DietProfile = { sex: formSex }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    setProfile(p)
    setExpanded(new Set())
    setActiveTab('cardapio')
  }

  function resetProfile() {
    localStorage.removeItem(STORAGE_KEY)
    setProfile(null)
    setExpanded(new Set())
  }

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function MealCard({ section }: { section: MealSection }) {
    const isOpen = expanded.has(section.id)
    return (
      <div style={{
        borderRadius: '16px',
        border: `1.5px solid ${isOpen ? section.color + '35' : 'var(--border)'}`,
        background: isOpen ? section.color + '07' : 'var(--surface)',
        overflow: 'hidden', transition: 'all 0.2s ease',
        boxShadow: 'var(--card-shadow)',
      }}>
        <button
          onClick={() => toggle(section.id)}
          style={{
            width: '100%', padding: '13px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: section.color }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{section.label}</p>
                {section.sublabel && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                    background: section.color + '18', color: section.color,
                  }}>
                    {section.sublabel}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '1px' }}>
                {section.options.length} {section.options.length === 1 ? 'opção' : 'opções'}
              </p>
            </div>
          </div>
          <span style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease', display: 'inline-flex', flexShrink: 0,
          }}>
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </button>

        {isOpen && (
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {section.options.map((opt, idx) => (
              <div key={idx} style={{
                padding: '10px 12px', borderRadius: '11px',
                background: 'var(--surface)', border: `1px solid ${section.color}22`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                    background: section.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800, color: section.color,
                  }}>
                    {idx + 1}
                  </span>
                  {opt.label && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: section.color }}>{opt.label}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '4px' }}>
                  {opt.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <span style={{
                        width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0,
                        background: section.color + 'aa', marginTop: '7px',
                      }} />
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
                {opt.protein && (
                  <div style={{ marginTop: '8px', paddingTop: '7px', borderTop: `1px solid ${section.color}18` }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: section.color }}>
                      Proteína aprox.: {opt.protein}
                    </span>
                  </div>
                )}
                {opt.note && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic', lineHeight: 1.4, margin: '6px 0 0' }}>
                    {opt.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function ListCard({ section }: { section: ListSection }) {
    const isOpen = expanded.has(section.id)
    return (
      <div style={{
        borderRadius: '16px',
        border: `1.5px solid ${isOpen ? 'rgba(37,99,235,0.22)' : 'var(--border)'}`,
        background: isOpen ? 'rgba(37,99,235,0.04)' : 'var(--surface)',
        overflow: 'hidden', transition: 'all 0.2s ease', boxShadow: 'var(--card-shadow)',
      }}>
        <button
          onClick={() => toggle(section.id)}
          style={{
            width: '100%', padding: '13px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{section.label}</p>
          <span style={{
            color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease', display: 'inline-flex', flexShrink: 0,
          }}>
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </button>
        {isOpen && (
          <div style={{ padding: '0 14px 14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {section.items.map(item => (
                <span key={item} style={{
                  padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  border: '1px solid rgba(37,99,235,0.15)',
                }}>
                  {item}
                </span>
              ))}
            </div>
            {section.note && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
                {section.note}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #16653A 0%, #0E4A29 100%)',
          borderRadius: '20px', padding: '18px 20px', color: '#fff',
          boxShadow: '0 8px 28px rgba(22,101,58,0.35)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Avaliação nutricional
          </p>
          <p style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '8px' }}>
            Dieta personalizada para o seu protocolo
          </p>
          <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
            Plano alimentar de 30 dias elaborado por nutricionista, otimizado para uso com Tirzepatida.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Sexo biológico
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill active={formSex === 'M'} onClick={() => setFormSex('M')}>Masculino</Pill>
              <Pill active={formSex === 'F'} onClick={() => setFormSex('F')}>Feminino</Pill>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
              Homens e mulheres possuem cardápios independentes com quantidades e composições distintas.
            </p>
          </div>

          <button
            onClick={saveProfile}
            disabled={!formSex}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 800, fontSize: '15px',
              cursor: formSex ? 'pointer' : 'not-allowed',
              background: formSex ? 'linear-gradient(135deg, #16653A 0%, #059669 100%)' : 'var(--surface-3)',
              color: formSex ? '#fff' : 'var(--text-muted)',
              opacity: formSex ? 1 : 0.6, transition: 'all 0.2s',
              boxShadow: formSex ? '0 4px 14px rgba(22,101,58,0.4)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Utensils size={16} strokeWidth={2.5} />
            Ver Meu Plano Alimentar
          </button>
        </div>

        <div className="card-warning">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
            <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
              Plano elaborado por nutricionista para uso com Tirzepatida. Não substitui acompanhamento nutricional individualizado.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Plan view ─────────────────────────────────────────────────────────────
  const meals = profile.sex === 'F' ? FEMALE_MEALS : MALE_MEALS
  const lists = profile.sex === 'F' ? FEMALE_LISTS : MALE_LISTS
  const sexLabel = profile.sex === 'F' ? 'Feminino' : 'Masculino'
  const proteinGoal = profile.sex === 'F'
    ? '1,6–2,0 g/kg · ex: 65 kg → 105–130 g/dia'
    : '1,6–2,0 g/kg · ex: 80 kg → 130–160 g/dia'
  const hydrationGoal = profile.sex === 'F'
    ? '35–40 ml/kg · ex: 80 kg → 2,8–3,2 L/dia'
    : '35–40 ml/kg · ex: 100 kg → 3,5–4,0 L/dia'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #16653A 0%, #0E4A29 100%)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: '0 8px 28px rgba(22,101,58,0.35)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Seu plano personalizado
        </p>
        <p style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '10px' }}>
          Dieta {sexLabel} · 30 dias
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 10px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Meta de proteína</p>
            <p style={{ fontSize: '11px', fontWeight: 700, margin: '3px 0 0', lineHeight: 1.35 }}>{proteinGoal}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 10px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Hidratação</p>
            <p style={{ fontSize: '11px', fontWeight: 700, margin: '3px 0 0', lineHeight: 1.35 }}>{hydrationGoal}</p>
          </div>
        </div>
      </div>

      {/* Plate priority */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
          Ordem de prioridade do prato
        </p>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['1. Proteína', '2. Carboidrato', '3. Legumes cozidos', '4. Saladas cruas'].map(p => (
            <span key={p} style={{
              flex: '1 1 0', fontSize: '10px', fontWeight: 700, textAlign: 'center',
              padding: '5px 3px', borderRadius: '8px', lineHeight: 1.3,
              background: 'var(--primary-light)', color: 'var(--primary)',
              border: '1px solid rgba(37,99,235,0.12)',
            }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '6px', padding: '4px',
        background: 'var(--surface-2)', borderRadius: '14px',
      }}>
        {([
          { id: 'cardapio' as DietTab, label: 'Cardápio 30 dias' },
          { id: 'pouca-fome' as DietTab, label: 'Pouca Fome' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 700, fontSize: '12px',
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? 'var(--card-shadow)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Cardápio tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'cardapio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Divider label="Refeições" />
          {meals.map(s => <MealCard key={s.id} section={s} />)}
          <Divider label="Referências" />
          {lists.map(s => <ListCard key={s.id} section={s} />)}
        </div>
      )}

      {/* ── Pouca Fome tab ───────────────────────────────────────────────────── */}
      {activeTab === 'pouca-fome' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Intro */}
          <div style={{
            padding: '14px 16px', borderRadius: '16px',
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', marginBottom: '6px' }}>
              Quando a fome diminui muito
            </p>
            <p style={{ fontSize: '12px', color: '#B45309', lineHeight: 1.5, marginBottom: '10px', margin: '0 0 10px' }}>
              O objetivo não é forçar grandes refeições. A estratégia é comer menos volume e aumentar a densidade nutricional.
            </p>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', margin: '0 0 6px' }}>Sinais desta fase:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Saciedade com poucas colheradas', 'Náusea, empachamento', 'Sensação de comida parada no estômago', 'Refluxo ou falta de vontade de comer', 'Pular refeições sem perceber'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#B45309', flexShrink: 0, marginTop: '2px' }}>•</span>
                  <p style={{ fontSize: '12px', color: '#B45309', margin: 0, lineHeight: 1.4 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Ordem de prioridade
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { n: '1', label: 'Proteína', color: '#2563EB' },
                { n: '2', label: 'Hidratação', color: '#0891B2' },
                { n: '3', label: 'Carboidratos de fácil digestão', color: '#059669' },
                { n: '4', label: 'Fibras', color: '#D97706' },
                { n: '5', label: 'Todo o restante', color: 'var(--text-muted)' },
              ].map(p => (
                <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                    background: p.color === 'var(--text-muted)' ? 'var(--surface-2)' : p.color + '18',
                    color: p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800,
                  }}>{p.n}</span>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meals */}
          {LOW_HUNGER_MEALS.map(s => <MealCard key={s.id} section={s} />)}

          {/* Extreme days */}
          <div style={{
            borderRadius: '16px', border: '1.5px solid rgba(239,68,68,0.22)',
            background: 'rgba(239,68,68,0.04)', overflow: 'hidden', boxShadow: 'var(--card-shadow)',
          }}>
            <button
              onClick={() => toggle('lh-dias-extremos')}
              style={{
                width: '100%', padding: '13px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} strokeWidth={2} style={{ color: '#EF4444', flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Dias Extremos</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '1px' }}>Quando quase não há fome</p>
                </div>
              </div>
              <span style={{
                color: 'var(--text-muted)',
                transform: expanded.has('lh-dias-extremos') ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s', display: 'inline-flex', flexShrink: 0,
              }}>
                <ChevronDown size={16} strokeWidth={2} />
              </span>
            </button>
            {expanded.has('lh-dias-extremos') && (
              <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Objetivo: não tentar "comer normal". <strong>Bater proteína</strong> é a única prioridade.
                </p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>Exemplo de um dia:</p>
                {[
                  { label: 'Café', items: ['Iogurte grego', 'Whey'], protein: '40 g' },
                  { label: 'Almoço', items: ['180 g de frango', '100 g de arroz'], protein: '45 g' },
                  { label: 'Jantar', items: ['Whey', 'Leite desnatado', 'Banana'], protein: '35 g' },
                ].map(meal => (
                  <div key={meal.label} style={{
                    padding: '10px 12px', borderRadius: '10px',
                    background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.15)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', margin: 0 }}>{meal.label}</p>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>~{meal.protein}</span>
                    </div>
                    {meal.items.map(item => (
                      <p key={item} style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{item}</p>
                    ))}
                  </div>
                ))}
                <div style={{
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', margin: 0 }}>
                    Total aproximado: ~120 g de proteína — mesmo com pouco volume alimentar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tolerated foods */}
          {[
            { id: 'lh-prot', label: 'Proteínas Melhor Toleradas', color: '#2563EB', items: ['Frango desfiado', 'Peixe', 'Atum em água', 'Ovos', 'Iogurte grego', 'Cottage', 'Whey'] },
            { id: 'lh-carb', label: 'Carboidratos Melhor Tolerados', color: '#059669', items: ['Arroz branco', 'Batata inglesa', 'Batata doce', 'Cuscuz', 'Pão francês', 'Banana', 'Mamão'] },
          ].map(sec => {
            const isOpen = expanded.has(sec.id)
            return (
              <div key={sec.id} style={{
                borderRadius: '16px',
                border: `1.5px solid ${isOpen ? sec.color + '35' : 'var(--border)'}`,
                background: isOpen ? sec.color + '07' : 'var(--surface)',
                overflow: 'hidden', transition: 'all 0.2s', boxShadow: 'var(--card-shadow)',
              }}>
                <button
                  onClick={() => toggle(sec.id)}
                  style={{
                    width: '100%', padding: '13px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{sec.label}</p>
                  <span style={{
                    color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s', display: 'inline-flex', flexShrink: 0,
                  }}>
                    <ChevronDown size={16} strokeWidth={2} />
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sec.items.map(item => (
                        <span key={item} style={{
                          padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                          background: sec.color + '15', color: sec.color, border: `1px solid ${sec.color}25`,
                        }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Hydration + intestine notes */}
          <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Droplets size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: '#0891B2' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                <strong>Hidratação:</strong> mesmo sem fome, a água é obrigatória — 35–40 ml/kg. Tontura, dor de cabeça e fadiga muitas vezes são sinais de desidratação.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Leaf size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: '#059669' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                <strong>Intestino:</strong> priorize mamão, kiwi, feijão, legumes e água. Se necessário: Psyllium 5–10 g/dia.
              </p>
            </div>
          </div>

          {/* Main rule */}
          <div style={{
            padding: '14px 16px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.07), rgba(124,58,237,0.07))',
            border: '1px solid rgba(37,99,235,0.15)',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Regra mais importante
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Não tente comer como antes. Adapte o volume das refeições. <strong>Proteína, água e constância</strong> são mais importantes do que quantidade de comida.
            </p>
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={resetProfile}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
        }}
      >
        <RotateCcw size={12} strokeWidth={2.5} />
        Alterar sexo / Reiniciar plano
      </button>

      <div className="card-warning">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
          <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
            Plano elaborado por nutricionista para uso com Tirzepatida. Não substitui acompanhamento nutricional individualizado. Consulte seu profissional de saúde.
          </p>
        </div>
      </div>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 2px' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', margin: 0 }}>
        {label}
      </p>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}
