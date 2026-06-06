import { useState } from 'react'
import FoodGuide from './FoodGuide'
import Weaning from './Weaning'
import SideEffects from './SideEffects'
import { UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

type HealthTab = 'symptoms' | 'food' | 'exercise' | 'weaning' | 'supplementation'

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

// ── Exercise guide content ────────────────────────────────────────────────────
const EXERCISE_CATS = [
  {
    id: 'strength',
    icon: '💪',
    title: 'Musculação',
    badge: 'Prioridade #1',
    badgeColor: 'var(--primary)',
    badgeBg: 'var(--primary-light)',
    accent: 'var(--primary)',
    accentBg: 'rgba(5,150,105,0.07)',
    accentBorder: 'rgba(5,150,105,0.2)',
    freq: '2–3x por semana',
    summary: 'Preservar massa muscular é a prioridade durante o emagrecimento com GLP-1.',
    tips: [
      { icon: '🎯', text: 'Foque nos grandes grupos musculares: pernas, costas, peito e ombros' },
      { icon: '📈', text: 'Progrida a carga gradualmente — 2–5% a mais quando conseguir completar todas as séries' },
      { icon: '⏱️', text: 'Séries: 3–4 séries de 8–12 repetições por exercício' },
      { icon: '🔁', text: 'Exemplos: agachamento, levantamento terra, supino, remada, rosca, tríceps' },
      { icon: '💤', text: 'Descanse 48h o mesmo grupo muscular entre os treinos' },
    ],
  },
  {
    id: 'cardio',
    icon: '🏃',
    title: 'Cardio',
    badge: 'Prioridade #2',
    badgeColor: '#7C3AED',
    badgeBg: 'rgba(124,58,237,0.1)',
    accent: '#7C3AED',
    accentBg: 'rgba(124,58,237,0.05)',
    accentBorder: 'rgba(124,58,237,0.2)',
    freq: '150 min/semana',
    summary: 'Saúde cardiovascular e potencialização dos resultados.',
    tips: [
      { icon: '🎯', text: 'Meta: 150 min/semana de intensidade moderada (OMS)' },
      { icon: '🚶', text: 'Caminhada rápida, bicicleta e natação são as melhores opções' },
      { icon: '📈', text: 'Comece com 20–30 min, 3x/semana e progrida gradualmente' },
      { icon: '❤️', text: 'Intensidade moderada: consegue falar, mas não cantar' },
      { icon: '🤢', text: 'Em dias de náusea: 15 min de caminhada leve já é suficiente' },
    ],
  },
  {
    id: 'mobility',
    icon: '🧘',
    title: 'Mobilidade',
    badge: 'Diariamente',
    badgeColor: '#F59E0B',
    badgeBg: 'rgba(245,158,11,0.1)',
    accent: '#F59E0B',
    accentBg: 'rgba(245,158,11,0.05)',
    accentBorder: 'rgba(245,158,11,0.2)',
    freq: '10–15 min/dia',
    summary: 'Reduz dores, melhora postura e auxilia a recuperação muscular.',
    tips: [
      { icon: '🌅', text: 'Inclua 10–15 min de alongamento após os treinos ou ao acordar' },
      { icon: '🧘', text: 'Yoga e pilates são excelentes opções — reduzem estresse também' },
      { icon: '🔄', text: 'Trabalhe mobilidade de quadril, coluna torácica e ombros' },
      { icon: '😴', text: 'Melhora a qualidade do sono, que é fundamental no protocolo' },
    ],
  },
]

const WEEKLY_SCHEDULE = [
  { day: 'Seg', activity: '💪', label: 'Força',   color: 'var(--primary)', bg: 'var(--primary-light)' },
  { day: 'Ter', activity: '🏃', label: 'Cardio',  color: '#7C3AED',        bg: 'rgba(124,58,237,0.1)' },
  { day: 'Qua', activity: '🧘', label: 'Mobil.',  color: '#F59E0B',        bg: 'rgba(245,158,11,0.1)' },
  { day: 'Qui', activity: '💪', label: 'Força',   color: 'var(--primary)', bg: 'var(--primary-light)' },
  { day: 'Sex', activity: '🏃', label: 'Cardio',  color: '#7C3AED',        bg: 'rgba(124,58,237,0.1)' },
  { day: 'Sáb', activity: '💪', label: 'Força',   color: 'var(--primary)', bg: 'var(--primary-light)' },
  { day: 'Dom', activity: '😌', label: 'Repouso', color: 'var(--text-muted)', bg: 'var(--surface-2)'  },
]

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
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function HealthHub({ profile, onUpdateProfile }: Props) {
  const [activeSection, setActiveSection] = useState<HealthTab | null>(null)
  const [expandedEx, setExpandedEx]       = useState<Set<string>>(new Set(['strength']))

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
          {activeSection === 'exercise' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
                borderRadius: '20px', padding: '18px 20px', color: '#fff',
                boxShadow: 'var(--shadow-green)',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  Por que se exercitar com GLP-1?
                </p>
                <p style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '10px' }}>
                  Exercício protege sua massa muscular durante o emagrecimento
                </p>
                <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
                  A perda de peso rápida pode incluir massa magra. Movimentar-se preserva o metabolismo, melhora resultados e o bem-estar geral.
                </p>
              </div>

              <div className="card">
                <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  📅 Sugestão de semana
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {WEEKLY_SCHEDULE.map(d => (
                    <div key={d.day} style={{
                      textAlign: 'center', padding: '8px 4px', borderRadius: '10px',
                      background: d.bg, border: `1px solid ${d.color}25`,
                    }}>
                      <p style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>{d.day}</p>
                      <span style={{ fontSize: '16px', display: 'block', marginBottom: '3px' }}>{d.activity}</span>
                      <p style={{ fontSize: '7px', fontWeight: 700, color: d.color, lineHeight: 1.2 }}>{d.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Tipos de treino
              </p>

              {EXERCISE_CATS.map(cat => {
                const isOpen = expandedEx.has(cat.id)
                return (
                  <div key={cat.id} style={{
                    borderRadius: '16px', overflow: 'hidden',
                    border: `1.5px solid ${isOpen ? cat.accentBorder : 'var(--border)'}`,
                    background: isOpen ? cat.accentBg : 'var(--surface)',
                    transition: 'all 0.2s', boxShadow: 'var(--shadow-card)',
                  }}>
                    <button
                      onClick={() => setExpandedEx(prev => {
                        const next = new Set(prev)
                        if (next.has(cat.id)) next.delete(cat.id)
                        else next.add(cat.id)
                        return next
                      })}
                      style={{
                        width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                        textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                        background: `${cat.accent}18`, border: `1px solid ${cat.accent}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      }}>
                        {cat.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{cat.title}</p>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: cat.badgeBg, color: cat.badgeColor }}>
                            {cat.badge}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{cat.freq} · {cat.summary}</p>
                      </div>
                      <span style={{
                        fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0,
                        transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block',
                      }}>▼</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${cat.accentBorder}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cat.tips.map((tip, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '9px 11px', borderRadius: '10px',
                            background: 'var(--surface)', border: `1px solid ${cat.accentBorder}`,
                          }}>
                            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{tip.icon}</span>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{tip.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                  💡 Dicas práticas
                </p>
                {[
                  { icon: '💧', text: 'Hidratação: aumente a ingestão de água nos dias de treino' },
                  { icon: '🥩', text: 'Proteína pós-treino: 20–30g auxilia na recuperação muscular' },
                  { icon: '😴', text: 'Sono: ao menos 7h para que o corpo recupere e recomponha' },
                  { icon: '🤢', text: 'Sintomas? Caminhada leve de 15 min já é válida e benéfica' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>{t.icon}</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{t.text}</p>
                  </div>
                ))}
              </div>

              <div className="card-warning">
                <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
                  ⚕️ Consulte um profissional de educação física para um programa personalizado. Em caso de dores intensas ou sintomas durante o exercício, interrompa e avalie com seu médico.
                </p>
              </div>
            </div>
          )}

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

      {/* Card grid: 2×2 + last card full width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {SECTION_CARDS.map(card => {
          const isWide = card.id === 'supplementation'
          return (
            <button
              key={card.id}
              onClick={() => setActiveSection(card.id)}
              style={{
                gridColumn: isWide ? '1 / -1' : undefined,
                background: card.gradient,
                borderRadius: '20px',
                padding: isWide ? '18px 20px' : '20px 16px 18px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: card.shadow,
                display: 'flex',
                flexDirection: isWide ? 'row' : 'column',
                alignItems: isWide ? 'center' : undefined,
                gap: isWide ? '16px' : '10px',
                minHeight: isWide ? '72px' : '130px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {/* Decorative circle */}
              <div style={{
                position: 'absolute', top: '-18px', right: '-18px',
                width: isWide ? '100px' : '80px', height: isWide ? '100px' : '80px',
                borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                pointerEvents: 'none',
              }} />

              <span style={{
                fontSize: isWide ? '28px' : '32px',
                lineHeight: 1, display: 'block', flexShrink: 0,
              }}>
                {card.icon}
              </span>

              <div style={{ flex: isWide ? 1 : undefined, minWidth: 0 }}>
                <p style={{ fontSize: isWide ? '14px' : '15px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
                  {card.title}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.72)', margin: 0, marginTop: '4px', lineHeight: 1.4 }}>
                  {card.subtitle}
                </p>
              </div>

              {/* Sintomas card: show live badge */}
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

              {/* Supplementation: right arrow */}
              {isWide && (
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>→</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
