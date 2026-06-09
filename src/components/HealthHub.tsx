import { useState } from 'react'
import FoodGuide from './FoodGuide'
import Weaning from './Weaning'
import SideEffects from './SideEffects'
import AntiPlato from './AntiPlato'
import Storage from './Storage'
import Exercise from './Exercise'
import { UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

type HealthTab = 'symptoms' | 'food' | 'exercise' | 'weaning' | 'supplementation' | 'antiplato' | 'storage'

// ── Symptom tips mapping ──────────────────────────────────────────────────────
const SYMPTOM_TIPS: Record<string, { emoji: string; title: string; tips: string[] }> = {
  nausea: {
    emoji: '🤢', title: 'Náusea',
    tips: [
      'Prefira 5–6 refeições pequenas em vez de grandes volumes',
      'Evite alimentos gordurosos, fritos ou muito condimentados',
      'Fique sentado por 30 minutos após comer',
      'Chá de gengibre é um aliado natural e eficaz',
    ],
  },
  vomiting: {
    emoji: '🤮', title: 'Vômito',
    tips: [
      'Priorize hidratação em pequenos goles frequentes',
      'Reintroduza alimentos gradualmente: arroz, banana, torrada',
      'Evite cheiros e temperaturas extremas que sejam gatilhos',
      'Repouso após as refeições pode reduzir o desconforto',
    ],
  },
  constipation: {
    emoji: '😣', title: 'Constipação',
    tips: [
      'Beba pelo menos 2L de água por dia — fundamental',
      'Ameixa, mamão e kiwi são aliados do trânsito intestinal',
      'Caminhadas leves de 20–30 min estimulam o intestino',
      'Aveia e fibras solúveis regularizam sem agravar desconforto',
    ],
  },
  diarrhea: {
    emoji: '🚽', title: 'Diarreia',
    tips: [
      'Hidratação é prioridade: água, água de coco, soro oral',
      'Prefira arroz, banana, maçã cozida e torrada temporariamente',
      'Evite laticínios, alimentos gordurosos e picantes',
      'Reduza fibras insolúveis (vegetais crus, cascas) até melhora',
    ],
  },
  reflux: {
    emoji: '🔥', title: 'Refluxo / Azia',
    tips: [
      'Espere ao menos 2h antes de deitar após comer',
      'Faça refeições menores e mais frequentes',
      'Eleve levemente a cabeceira da cama ao dormir',
      'Evite café, chocolate, alimentos cítricos e refrigerantes',
    ],
  },
  fatigue: {
    emoji: '😴', title: 'Fadiga',
    tips: [
      'Garanta 7–9 horas de sono de qualidade por noite',
      'Verifique a ingestão de proteínas (1,2–1,5g/kg de peso)',
      'Exercícios leves aumentam a disposição mais do que repouso total',
      'Não pule refeições mesmo sem fome — o corpo precisa de energia',
    ],
  },
  dizziness: {
    emoji: '💫', title: 'Tontura',
    tips: [
      'Levante-se devagar ao sair da cama ou de cadeiras',
      'Mantenha hidratação constante ao longo do dia',
      'Faça refeições regulares para evitar queda de glicemia',
      'Evite ambientes muito quentes e ficar de pé por longos períodos',
    ],
  },
  abdominal: {
    emoji: '🫃', title: 'Dor abdominal',
    tips: [
      'Coma devagar e mastigue bem — a digestão começa na boca',
      'Evite alimentos produtores de gás (feijão, repolho, brócolis cru)',
      'Compressa morna no abdômen pode aliviar o desconforto',
      'Anote o que comeu para identificar gatilhos específicos',
    ],
  },
  headache: {
    emoji: '🤕', title: 'Dor de cabeça',
    tips: [
      'Verifique sua hidratação — a GLP-1 pode reduzir a sensação de sede',
      'Faça refeições regulares, evitando jejuns prolongados',
      'Mantenha constante o consumo de cafeína (evite cortes abruptos)',
      'Descanso e redução de estresse contribuem muito',
    ],
  },
  appetite: {
    emoji: '🍽️', title: 'Falta de apetite',
    tips: [
      'Faça refeições programadas mesmo sem sentir fome',
      'Priorize proteínas e gorduras boas em porções pequenas',
      'Ovos, abacate e oleaginosas são densos em nutrientes',
      'Smoothies e vitaminas são opções práticas para quem não tem apetite',
    ],
  },
}


// ── Supplementation levels ────────────────────────────────────────────────────
const SUPP_LEVELS = [
  {
    level: 1,
    title: 'Essenciais',
    subtitle: 'Quase todo paciente',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.2)',
    badgeBg: 'rgba(5,150,105,0.12)',
    badgeColor: '#059669',
    iconBg: 'rgba(5,150,105,0.1)',
    iconColor: '#059669',
    items: [
      { icon: '🥩', name: 'Proteína Adequada',  detail: 'Whey, caseína ou fontes alimentares — 1,2–1,6g/kg' },
      { icon: '⚡', name: 'Creatina',           detail: '3–5g/dia — preserva e aumenta massa muscular' },
      { icon: '💊', name: 'Multivitamínico',    detail: 'Suporte geral de micronutrientes na restrição calórica' },
      { icon: '🌙', name: 'Magnésio',           detail: 'Qualidade do sono, cãibras e função muscular' },
    ],
    note: 'Esses são os suplementos mais frequentemente utilizados para ajudar na manutenção da massa magra, recuperação muscular e suporte nutricional durante o processo de emagrecimento.',
  },
  {
    level: 2,
    title: 'Importantes',
    subtitle: 'Guiados por exames',
    gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    bg: 'rgba(217,119,6,0.06)',
    border: 'rgba(217,119,6,0.2)',
    badgeBg: 'rgba(217,119,6,0.12)',
    badgeColor: '#D97706',
    iconBg: 'rgba(217,119,6,0.1)',
    iconColor: '#D97706',
    items: [
      { icon: '☀️', name: 'Vitamina D',  detail: 'Essencial para imunidade, ossos e humor' },
      { icon: '🔴', name: 'Vitamina B12', detail: 'Produção de energia e saúde neurológica' },
      { icon: '🩸', name: 'Ferro',       detail: 'Prevenção de anemia, especialmente em mulheres' },
      { icon: '🔧', name: 'Zinco',       detail: 'Sistema imune, cicatrização e metabolismo' },
    ],
    note: 'Esses nutrientes idealmente devem ser avaliados através de exames laboratoriais antes da utilização.',
  },
  {
    level: 3,
    title: 'Opcionais / Estéticos',
    subtitle: 'Conforme prioridade e orçamento',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    bg: 'rgba(124,58,237,0.05)',
    border: 'rgba(124,58,237,0.2)',
    badgeBg: 'rgba(124,58,237,0.1)',
    badgeColor: '#7C3AED',
    iconBg: 'rgba(124,58,237,0.1)',
    iconColor: '#7C3AED',
    items: [
      { icon: '🐟', name: 'Ômega 3',              detail: 'Anti-inflamatório e saúde cardiovascular' },
      { icon: '✨', name: 'Colágeno Hidrolisado',  detail: 'Pele, articulações e tecido conjuntivo' },
      { icon: '💅', name: 'Biotina',               detail: 'Cabelo, pele e unhas' },
    ],
    note: 'Podem ser utilizados em situações específicas, mas normalmente não possuem prioridade maior que os itens dos níveis anteriores.',
  },
]

function getMondayOf(d: Date) {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date.toISOString().split('T')[0]
}

// ── Section card definitions ──────────────────────────────────────────────────
const SECTION_CARDS: {
  id: HealthTab
  icon: string
  title: string
  subtitle: string
  gradient: string
  shadow: string
  accentColor: string
}[] = [
  {
    id: 'symptoms',
    icon: '🤢',
    title: 'Sintomas',
    subtitle: 'Registre e acompanhe efeitos colaterais',
    gradient: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
    shadow: '0 8px 24px rgba(5,150,105,0.28)',
    accentColor: '#059669',
  },
  {
    id: 'food',
    icon: '🥗',
    title: 'Alimentação',
    subtitle: 'Alimentos aliados e o que evitar',
    gradient: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)',
    shadow: '0 8px 24px rgba(217,119,6,0.28)',
    accentColor: '#D97706',
  },
  {
    id: 'exercise',
    icon: '🏃',
    title: 'Exercício',
    subtitle: 'Guia de treino com GLP-1',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    shadow: '0 8px 24px rgba(124,58,237,0.28)',
    accentColor: '#7C3AED',
  },
  {
    id: 'weaning',
    icon: '📉',
    title: 'Desmame',
    subtitle: 'Protocolo de interrupção gradual',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
    shadow: '0 8px 24px rgba(37,99,235,0.28)',
    accentColor: '#2563EB',
  },
  {
    id: 'supplementation',
    icon: '💊',
    title: 'Suplementação',
    subtitle: 'O que priorizar durante o tratamento',
    gradient: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)',
    shadow: '0 8px 24px rgba(15,118,110,0.28)',
    accentColor: '#0F766E',
  },
  {
    id: 'antiplato',
    icon: '🚧',
    title: 'Anti-Platô',
    subtitle: 'Identifique e desbloqueie seu platô',
    gradient: 'linear-gradient(135deg, #E11D48 0%, #9F1239 100%)',
    shadow: '0 8px 24px rgba(225,29,72,0.28)',
    accentColor: '#E11D48',
  },
  {
    id: 'storage',
    icon: '❄️',
    title: 'Armazenamento',
    subtitle: 'Como guardar sua medicação corretamente',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    shadow: '0 8px 24px rgba(14,165,233,0.28)',
    accentColor: '#0EA5E9',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function HealthHub({ profile, onUpdateProfile }: Props) {
  const [activeSection, setActiveSection] = useState<HealthTab | null>(null)

  // Current week's symptoms
  const thisWeek       = getMondayOf(new Date())
  const currentEntry   = profile.sideEffects?.find(e => e.date === thisWeek)
  const activeSymptoms = currentEntry?.symptoms.filter(s => s.intensity > 0) ?? []
  const maxIntensity   = activeSymptoms.length > 0
    ? Math.max(...activeSymptoms.map(s => s.intensity)) : 0

  const symptomBadge =
    maxIntensity === 0 ? { label: 'Sem sintomas', color: '#10B981', dot: '🟢' }
    : maxIntensity === 1 ? { label: `${activeSymptoms.length} leve${activeSymptoms.length > 1 ? 's' : ''}`, color: '#10B981', dot: '🟢' }
    : maxIntensity === 2 ? { label: `${activeSymptoms.length} moderado${activeSymptoms.length > 1 ? 's' : ''}`, color: '#F59E0B', dot: '🟡' }
    : { label: `${activeSymptoms.length} intenso${activeSymptoms.length > 1 ? 's' : ''}`, color: '#EF4444', dot: '🔴' }

  const currentCard = SECTION_CARDS.find(c => c.id === activeSection)

  // ── Section view ────────────────────────────────────────────────────────────
  if (activeSection !== null) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Back header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setActiveSection(null)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '38px', height: '38px', borderRadius: '12px',
              border: '1.5px solid var(--border-strong)',
              background: 'var(--surface)', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px', color: 'var(--text-secondary)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: currentCard?.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
              boxShadow: currentCard?.shadow,
            }}>
              {currentCard?.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                {currentCard?.title}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                {currentCard?.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Section content */}
        <div key={activeSection} className="fade-in">

          {/* ── SINTOMAS ───────────────────────────────────────────────── */}
          {activeSection === 'symptoms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SideEffects profile={profile} onUpdateProfile={onUpdateProfile} />

              {activeSymptoms.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                      Dicas para seus sintomas
                    </p>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  </div>

                  {activeSymptoms.map(s => {
                    const tip = SYMPTOM_TIPS[s.id]
                    if (!tip) return null
                    const intensityColor = s.intensity === 1 ? '#10B981' : s.intensity === 2 ? '#F59E0B' : '#EF4444'
                    const intensityLabel = s.intensity === 1 ? 'Leve' : s.intensity === 2 ? 'Moderado' : 'Intenso'
                    return (
                      <div key={s.id} style={{
                        borderRadius: '16px', overflow: 'hidden',
                        border: `1px solid ${intensityColor}25`,
                        background: 'var(--surface)',
                        boxShadow: 'var(--shadow-card)',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '12px 14px',
                          background: `${intensityColor}08`,
                          borderBottom: `1px solid ${intensityColor}20`,
                        }}>
                          <span style={{ fontSize: '20px' }}>{tip.emoji}</span>
                          <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', flex: 1, margin: 0 }}>
                            {tip.title}
                          </p>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px',
                            background: `${intensityColor}15`, color: intensityColor,
                          }}>
                            {intensityLabel}
                          </span>
                        </div>
                        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {tip.tips.map((t, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <span style={{
                                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                background: 'var(--primary-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '9px', fontWeight: 800, color: 'var(--primary)', marginTop: '1px',
                              }}>
                                {i + 1}
                              </span>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{t}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  <div className="card-warning">
                    <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
                      ⚕️ Estas dicas são educativas. Se os sintomas persistirem ou forem intensos, consulte o médico responsável pelo seu protocolo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ALIMENTAÇÃO ────────────────────────────────────────────── */}
          {activeSection === 'food' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeSymptoms.some(s => ['nausea', 'constipation', 'diarrhea'].includes(s.id)) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '12px',
                  background: 'rgba(245,158,11,0.07)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                  <p style={{ fontSize: '12px', color: '#B45309', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
                    Você tem sintomas digestivos esta semana. Priorize os alimentos da lista <strong>Aliados</strong> e evite os listados em <strong>Evitar</strong>.
                  </p>
                </div>
              )}
              <FoodGuide />
            </div>
          )}

          {/* ── EXERCÍCIO ──────────────────────────────────────────────── */}
          {activeSection === 'exercise' && <Exercise />}

          {/* ── DESMAME ────────────────────────────────────────────────── */}
          {activeSection === 'weaning' && (
            <Weaning profile={profile} />
          )}

          {/* ── SUPLEMENTAÇÃO ──────────────────────────────────────────── */}
          {activeSection === 'supplementation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {SUPP_LEVELS.map(lvl => (
                <div key={lvl.level} style={{
                  borderRadius: '20px', overflow: 'hidden',
                  border: `1.5px solid ${lvl.border}`,
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  {/* Level header */}
                  <div style={{
                    background: lvl.gradient,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: 'rgba(255,255,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 800, color: '#fff',
                    }}>
                      {lvl.level}
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '15px', color: '#fff', margin: 0, lineHeight: 1.2 }}>
                        {lvl.title}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0, marginTop: '2px' }}>
                        {lvl.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lvl.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '11px',
                        padding: '10px 12px', borderRadius: '12px',
                        background: lvl.bg,
                        border: `1px solid ${lvl.border}`,
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                          background: lvl.iconBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px',
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '3px', lineHeight: 1.4 }}>
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Support text */}
                    <div style={{
                      display: 'flex', gap: '8px', alignItems: 'flex-start',
                      padding: '10px 12px', borderRadius: '10px',
                      background: 'var(--surface-2)',
                    }}>
                      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>💡</span>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                        {lvl.note}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card-warning">
                <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
                  ⚕️ Esta seção possui caráter educativo e não substitui orientação médica ou nutricional. A necessidade de suplementação deve ser avaliada individualmente.
                </p>
              </div>
            </div>
          )}

          {/* ── ANTI-PLATÔ ─────────────────────────────────────────────── */}
          {activeSection === 'antiplato' && <AntiPlato />}

          {/* ── ARMAZENAMENTO ──────────────────────────────────────────── */}
          {activeSection === 'storage' && <Storage />}

        </div>
      </div>
    )
  }

  // ── Home grid view ───────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
          Saúde
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Seu painel de bem-estar
        </p>
      </div>

      {/* Symptom status banner */}
      <button
        onClick={() => setActiveSection('symptoms')}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', borderRadius: '16px',
          background: maxIntensity >= 3
            ? 'rgba(239,68,68,0.06)'
            : maxIntensity === 2
            ? 'rgba(245,158,11,0.06)'
            : 'var(--primary-light)',
          border: `1.5px solid ${maxIntensity >= 3 ? 'rgba(239,68,68,0.2)' : maxIntensity === 2 ? 'rgba(245,158,11,0.25)' : 'rgba(5,150,105,0.2)'}`,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <span style={{ fontSize: '22px' }}>{symptomBadge.dot}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
            Esta semana
          </p>
          <p style={{ fontSize: '12px', color: symptomBadge.color, fontWeight: 600, margin: 0, marginTop: '2px' }}>
            {symptomBadge.label}
          </p>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>Ver →</span>
      </button>

      {/* 2×3 card grid — all equal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {SECTION_CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => setActiveSection(card.id)}
            style={{
              background: card.gradient,
              borderRadius: '20px',
              padding: '20px 16px 18px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: card.shadow,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '130px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'transform 0.15s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{
              position: 'absolute', top: '-18px', right: '-18px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', pointerEvents: 'none',
            }} />

            <span style={{ fontSize: '32px', lineHeight: 1, display: 'block' }}>
              {card.icon}
            </span>

            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
                {card.title}
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.72)', margin: 0, marginTop: '4px', lineHeight: 1.4 }}>
                {card.subtitle}
              </p>
            </div>

            {card.id === 'symptoms' && activeSymptoms.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '99px',
                background: 'rgba(255,255,255,0.2)',
                fontSize: '10px', fontWeight: 700, color: '#fff',
                alignSelf: 'flex-start',
              }}>
                {symptomBadge.dot} {symptomBadge.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
