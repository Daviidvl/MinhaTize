import { useState } from 'react'
import { Activity, AlertCircle, Shield, Leaf, Droplets, ListChecks, RefreshCw } from 'lucide-react'
import {
  type DietSex, INFO_F, INFO_M, PRINCIPLES, LOW_SIGNS, TOLERATED, LOW_PRIORITIES,
} from '../data/foodPlans'
import { ExpandCard, FoodChips, PlateOrder, SectionLabel } from './FoodShared'

const FONT = 'Inter, -apple-system, sans-serif'

interface Props {
  sex: DietSex
  dailyKcal: number
  proteinRange: string
  goalWeight: number
  waterRange: string
  onChangePlan: () => void
}

// Guia: conteúdo educativo do plano, em blocos que abrem sob demanda
export default function FoodInfo({ sex, dailyKcal, proteinRange, goalWeight, waterRange, onChangePlan }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (id: string) => setOpen(o => (o === id ? null : id))
  const info = sex === 'F' ? INFO_F : INFO_M

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Seu plano */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Seu plano</p>
            <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '3px 0 0', letterSpacing: '-0.3px' }}>
              Plano {sex === 'F' ? 'Feminino' : 'Masculino'} · 30 dias
            </p>
          </div>
          <button onClick={onChangePlan} style={{
            display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
            padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: FONT,
          }}>
            <RefreshCw size={12} strokeWidth={2} />
            Trocar
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Energia',  value: `${dailyKcal.toLocaleString('pt-BR')} kcal` },
            { label: 'Proteína', value: proteinRange },
            { label: 'Água',     value: waterRange },
          ].map(m => (
            <div key={m.label} style={{ padding: '10px', borderRadius: '12px', background: 'var(--surface-2)' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{m.label}</p>
              <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.2px' }}>{m.value}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Proteína: 1,6–2,0 g por kg do peso-alvo ({goalWeight} kg). Café, almoço e jantar são obrigatórios; lanches e ceia completam a proteína do dia.
        </p>
        <PlateOrder />
      </div>

      {/* Alimentos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SectionLabel>Alimentos e substituições</SectionLabel>
        {info.map(item => (
          <ExpandCard key={item.id} Icon={item.Icon} label={item.label} note={item.note} open={open === item.id} onToggle={() => toggle(item.id)}>
            <FoodChips items={item.items} />
          </ExpandCard>
        ))}
        <ExpandCard Icon={Activity} label="Princípios do plano" open={open === 'principios'} onToggle={() => toggle('principios')}>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {PRINCIPLES[sex].map(p => (
              <li key={p} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p}</li>
            ))}
          </ul>
        </ExpandCard>
      </div>

      {/* Pouca fome */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SectionLabel>Semanas de pouca fome</SectionLabel>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '-2px 2px 2px', lineHeight: 1.5 }}>
          Quando a fome diminui, o objetivo não é forçar grandes refeições, e sim comer menos volume com mais densidade. Use o modo <strong style={{ color: 'var(--text-secondary)' }}>Pouca fome</strong> na aba Hoje.
        </p>
        <ExpandCard Icon={AlertCircle} label="Sinais de pouca fome" open={open === 'sinais'} onToggle={() => toggle('sinais')}>
          <FoodChips items={LOW_SIGNS} />
        </ExpandCard>
        <ExpandCard Icon={Shield} label="Alimentos melhor tolerados" open={open === 'tolerados'} onToggle={() => toggle('tolerados')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {TOLERATED.map(g => (
              <div key={g.label}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{g.label}</p>
                <FoodChips items={g.items} />
              </div>
            ))}
          </div>
        </ExpandCard>
        <ExpandCard Icon={Leaf} label="Intestino" note="Se necessário: psyllium 5 g, podendo chegar a 10 g/dia." open={open === 'intestino'} onToggle={() => toggle('intestino')}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Com pouca fome costuma entrar menos fibra. Priorize diariamente:
          </p>
          <FoodChips tone="positive" items={['Mamão', 'Kiwi', 'Feijão', 'Legumes', 'Água']} />
        </ExpandCard>
        <ExpandCard Icon={Droplets} label="Hidratação" open={open === 'hidra'} onToggle={() => toggle('hidra')}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Mesmo sem fome, a água continua obrigatória: <strong>35–40 ml por kg de peso.</strong>
          </p>
          <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-line)' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)', margin: '0 0 2px' }}>Tontura, dor de cabeça ou fadiga?</p>
            <p style={{ fontSize: '12px', color: 'var(--amber)', margin: 0, lineHeight: 1.4 }}>Muitas vezes o problema é desidratação, não falta de comida.</p>
          </div>
        </ExpandCard>
        <ExpandCard Icon={ListChecks} label="Prioridades da estratégia" open={open === 'prioridades'} onToggle={() => toggle('prioridades')}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {LOW_PRIORITIES.map((item, i) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--ice)', color: 'var(--cobalt)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800,
                }}>{i + 1}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item}</span>
              </li>
            ))}
          </ol>
        </ExpandCard>

        <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'var(--red-bg)', border: '1.5px solid var(--red-line)' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 6px' }}>Regra mais importante</p>
          <p style={{ fontSize: '12px', color: 'var(--red)', margin: 0, lineHeight: 1.55 }}>
            Em semanas de pouca fome por causa da tirzepatida, não tente comer como antes. Adapte o volume das refeições. Proteína, água e constância importam mais do que quantidade de comida.
          </p>
        </div>
      </div>
    </div>
  )
}
