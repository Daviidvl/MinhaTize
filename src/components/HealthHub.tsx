import { useState } from 'react'
import {
  Activity, Utensils, Dumbbell, TrendingDown, Pill, Target, Package,
  ChevronLeft, ChevronRight, Waves, AlertCircle, ArrowDown, Droplets,
  Flame, Battery, RotateCcw, Circle, Minus, X, Lightbulb,
  Zap, Moon, Sun, Heart, Shield, Fish, Sparkles, Feather, Info,
} from 'lucide-react'
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
  initialSection?: string
}

type HealthTab = 'symptoms' | 'food' | 'exercise' | 'weaning' | 'supplementation' | 'antiplato' | 'storage'

// ── Icon colors para lista premium ────────────────────────────────────────────
const ICON_ACCENT: Record<HealthTab, { bg: string; color: string }> = {
  symptoms:        { bg: 'rgba(245,158,11,0.10)',  color: '#F59E0B' },
  food:            { bg: 'rgba(16,185,129,0.10)',  color: '#10B981' },
  exercise:        { bg: 'rgba(59,130,246,0.10)',  color: '#3B82F6' },
  weaning:         { bg: 'rgba(107,114,128,0.10)', color: '#6B7280' },
  supplementation: { bg: 'rgba(13,148,136,0.10)',  color: '#0D9488' },
  antiplato:       { bg: 'rgba(139,92,246,0.10)',  color: '#8B5CF6' },
  storage:         { bg: 'rgba(14,165,233,0.10)',  color: '#0EA5E9' },
}

const SECTION_ICON_LIST: Record<HealthTab, React.ReactNode> = {
  symptoms:        <Activity      size={20} strokeWidth={2} color={ICON_ACCENT.symptoms.color} />,
  food:            <Utensils      size={20} strokeWidth={2} color={ICON_ACCENT.food.color} />,
  exercise:        <Dumbbell      size={20} strokeWidth={2} color={ICON_ACCENT.exercise.color} />,
  weaning:         <TrendingDown  size={20} strokeWidth={2} color={ICON_ACCENT.weaning.color} />,
  supplementation: <Pill          size={20} strokeWidth={2} color={ICON_ACCENT.supplementation.color} />,
  antiplato:       <Target        size={20} strokeWidth={2} color={ICON_ACCENT.antiplato.color} />,
  storage:         <Package       size={20} strokeWidth={2} color={ICON_ACCENT.storage.color} />,
}

const SECTION_ICON_SM: Record<HealthTab, React.ReactNode> = {
  symptoms:       <Activity      size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  food:           <Utensils      size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  exercise:       <Dumbbell      size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  weaning:        <TrendingDown  size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  supplementation:<Pill          size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  antiplato:      <Target        size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  storage:        <Package       size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
}

// ── Symptom icon lookup ───────────────────────────────────────────────────────
const SYMPTOM_ICON_MAP: Record<string, React.ReactNode> = {
  nausea:       <Waves       size={18} strokeWidth={2} />,
  vomiting:     <AlertCircle size={18} strokeWidth={2} />,
  constipation: <ArrowDown   size={18} strokeWidth={2} />,
  diarrhea:     <Droplets    size={18} strokeWidth={2} />,
  reflux:       <Flame       size={18} strokeWidth={2} />,
  fatigue:      <Battery     size={18} strokeWidth={2} />,
  dizziness:    <RotateCcw   size={18} strokeWidth={2} />,
  abdominal:    <Circle      size={18} strokeWidth={2} />,
  headache:     <Minus       size={18} strokeWidth={2} />,
  appetite:     <X           size={18} strokeWidth={2} />,
}

// ── Supplementation icon lookup ───────────────────────────────────────────────
const SUPP_ICON_MAP: Record<string, React.ReactNode> = {
  'Proteína Adequada':   <Dumbbell size={18} strokeWidth={2} />,
  'Creatina':            <Zap      size={18} strokeWidth={2} />,
  'Multivitamínico':     <Pill     size={18} strokeWidth={2} />,
  'Magnésio':            <Moon     size={18} strokeWidth={2} />,
  'Vitamina D':          <Sun      size={18} strokeWidth={2} />,
  'Vitamina B12':        <Droplets size={18} strokeWidth={2} />,
  'Ferro':               <Heart    size={18} strokeWidth={2} />,
  'Zinco':               <Shield   size={18} strokeWidth={2} />,
  'Ômega 3':             <Fish     size={18} strokeWidth={2} />,
  'Colágeno Hidrolisado':<Sparkles size={18} strokeWidth={2} />,
  'Biotina':             <Feather  size={18} strokeWidth={2} />,
}

// ── Symptom tips mapping ──────────────────────────────────────────────────────
const SYMPTOM_TIPS: Record<string, { title: string; tips: string[] }> = {
  nausea: {
    title: 'Náusea',
    tips: [
      'Prefira 5–6 refeições pequenas em vez de grandes volumes',
      'Evite alimentos gordurosos, fritos ou muito condimentados',
      'Fique sentado por 30 minutos após comer',
      'Chá de gengibre é um aliado natural e eficaz',
    ],
  },
  vomiting: {
    title: 'Vômito',
    tips: [
      'Priorize hidratação em pequenos goles frequentes',
      'Reintroduza alimentos gradualmente: arroz, banana, torrada',
      'Evite cheiros e temperaturas extremas que sejam gatilhos',
      'Repouso após as refeições pode reduzir o desconforto',
    ],
  },
  constipation: {
    title: 'Constipação',
    tips: [
      'Beba pelo menos 2L de água por dia é fundamental',
      'Ameixa, mamão e kiwi são aliados do trânsito intestinal',
      'Caminhadas leves de 20–30 min estimulam o intestino',
      'Aveia e fibras solúveis regularizam sem agravar desconforto',
    ],
  },
  diarrhea: {
    title: 'Diarreia',
    tips: [
      'Hidratação é prioridade: água, água de coco, soro oral',
      'Prefira arroz, banana, maçã cozida e torrada temporariamente',
      'Evite laticínios, alimentos gordurosos e picantes',
      'Reduza fibras insolúveis (vegetais crus, cascas) até melhora',
    ],
  },
  reflux: {
    title: 'Refluxo / Azia',
    tips: [
      'Espere ao menos 2h antes de deitar após comer',
      'Faça refeições menores e mais frequentes',
      'Eleve levemente a cabeceira da cama ao dormir',
      'Evite café, chocolate, alimentos cítricos e refrigerantes',
    ],
  },
  fatigue: {
    title: 'Fadiga',
    tips: [
      'Garanta 7–9 horas de sono de qualidade por noite',
      'Verifique a ingestão de proteínas (1,2–1,5g/kg de peso)',
      'Exercícios leves aumentam a disposição mais do que repouso total',
      'Não pule refeições mesmo sem fome é o corpo precisa de energia',
    ],
  },
  dizziness: {
    title: 'Tontura',
    tips: [
      'Levante-se devagar ao sair da cama ou de cadeiras',
      'Mantenha hidratação constante ao longo do dia',
      'Faça refeições regulares para evitar queda de glicemia',
      'Evite ambientes muito quentes e ficar de pé por longos períodos',
    ],
  },
  abdominal: {
    title: 'Dor abdominal',
    tips: [
      'Coma devagar e mastigue bem é a digestão começa na boca',
      'Evite alimentos produtores de gás (feijão, repolho, brócolis cru)',
      'Compressa morna no abdômen pode aliviar o desconforto',
      'Anote o que comeu para identificar gatilhos específicos',
    ],
  },
  headache: {
    title: 'Dor de cabeça',
    tips: [
      'Verifique sua hidratação é a GLP-1 pode reduzir a sensação de sede',
      'Faça refeições regulares, evitando jejuns prolongados',
      'Mantenha constante o consumo de cafeína (evite cortes abruptos)',
      'Descanso e redução de estresse contribuem muito',
    ],
  },
  appetite: {
    title: 'Falta de apetite',
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
    gradient: 'linear-gradient(150deg, #065F46 0%, #047857 100%)',
    bg: 'rgba(5,150,105,0.05)',
    border: 'rgba(5,150,105,0.18)',
    badgeBg: 'rgba(5,150,105,0.10)',
    badgeColor: '#059669',
    iconBg: 'rgba(5,150,105,0.10)',
    iconColor: '#059669',
    items: [
      { name: 'Proteína Adequada',  detail: 'Whey, caseína ou fontes alimentares é 1,2–1,6g/kg' },
      { name: 'Creatina',           detail: '3–5g/dia é preserva e aumenta massa muscular' },
      { name: 'Multivitamínico',    detail: 'Suporte geral de micronutrientes na restrição calórica' },
      { name: 'Magnésio',           detail: 'Qualidade do sono, cãibras e função muscular' },
    ],
    note: 'Esses são os suplementos mais frequentemente utilizados para ajudar na manutenção da massa magra, recuperação muscular e suporte nutricional durante o processo de emagrecimento.',
  },
  {
    level: 2,
    title: 'Importantes',
    subtitle: 'Guiados por exames',
    gradient: 'linear-gradient(150deg, #92400E 0%, #B45309 100%)',
    bg: 'rgba(180,83,9,0.05)',
    border: 'rgba(180,83,9,0.18)',
    badgeBg: 'rgba(180,83,9,0.10)',
    badgeColor: '#B45309',
    iconBg: 'rgba(180,83,9,0.10)',
    iconColor: '#B45309',
    items: [
      { name: 'Vitamina D',  detail: 'Essencial para imunidade, ossos e humor' },
      { name: 'Vitamina B12', detail: 'Produção de energia e saúde neurológica' },
      { name: 'Ferro',       detail: 'Prevenção de anemia, especialmente em mulheres' },
      { name: 'Zinco',       detail: 'Sistema imune, cicatrização e metabolismo' },
    ],
    note: 'Esses nutrientes idealmente devem ser avaliados através de exames laboratoriais antes da utilização.',
  },
  {
    level: 3,
    title: 'Opcionais / Estéticos',
    subtitle: 'Conforme prioridade e orçamento',
    gradient: 'linear-gradient(150deg, #4C1D95 0%, #5B21B6 100%)',
    bg: 'rgba(91,33,182,0.05)',
    border: 'rgba(91,33,182,0.18)',
    badgeBg: 'rgba(91,33,182,0.10)',
    badgeColor: '#7C3AED',
    iconBg: 'rgba(91,33,182,0.10)',
    iconColor: '#7C3AED',
    items: [
      { name: 'Ômega 3',              detail: 'Anti-inflamatório e saúde cardiovascular' },
      { name: 'Colágeno Hidrolisado',  detail: 'Pele, articulações e tecido conjuntivo' },
      { name: 'Biotina',               detail: 'Cabelo, pele e unhas' },
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
  title: string
  subtitle: string
  gradient: string
  shadow: string
  accentColor: string
}[] = [
  {
    id: 'symptoms',
    title: 'Sintomas',
    subtitle: 'Registre e acompanhe efeitos colaterais',
    gradient: 'linear-gradient(145deg, #0D1520 0%, #090F18 100%)',
    shadow: '0 4px 20px rgba(0,0,0,0.30)',
    accentColor: '#3B82F6',
  },
  {
    id: 'food',
    title: 'Alimentação',
    subtitle: 'Alimentos aliados e o que evitar',
    gradient: 'linear-gradient(145deg, #0A1A11 0%, #060D08 100%)',
    shadow: '0 4px 20px rgba(0,0,0,0.30)',
    accentColor: '#22C55E',
  },
  {
    id: 'exercise',
    title: 'Exercício',
    subtitle: 'Guia de treino com GLP-1',
    gradient: 'linear-gradient(145deg, #0C1A15 0%, #080F0B 100%)',
    shadow: '0 4px 20px rgba(0,0,0,0.30)',
    accentColor: '#4ADE80',
  },
  {
    id: 'weaning',
    title: 'Desmame',
    subtitle: 'Protocolo de interrupção gradual',
    gradient: 'linear-gradient(145deg, #131318 0%, #0D0D12 100%)',
    shadow: '0 4px 20px rgba(0,0,0,0.30)',
    accentColor: '#94A3B8',
  },
  {
    id: 'supplementation',
    title: 'Suplementação',
    subtitle: 'O que priorizar durante o tratamento',
    gradient: 'linear-gradient(145deg, #0A1A18 0%, #06100F 100%)',
    shadow: '0 4px 20px rgba(0,0,0,0.30)',
    accentColor: '#2DD4BF',
  },
  {
    id: 'antiplato',
    title: 'Anti-Platô',
    subtitle: 'Identifique e desbloqueie seu platô',
    gradient: 'linear-gradient(145deg, #12091E 0%, #0C0713 100%)',
    shadow: '0 4px 20px rgba(0,0,0,0.30)',
    accentColor: '#A78BFA',
  },
  {
    id: 'storage',
    title: 'Armazenamento',
    subtitle: 'Como guardar sua medicação corretamente',
    gradient: 'linear-gradient(145deg, #0B1522 0%, #080E18 100%)',
    shadow: '0 4px 20px rgba(0,0,0,0.30)',
    accentColor: '#38BDF8',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function HealthHub({ profile, onUpdateProfile, initialSection }: Props) {
  const [activeSection, setActiveSection] = useState<HealthTab | null>(
    (initialSection as HealthTab) ?? null
  )

  const thisWeek       = getMondayOf(new Date())
  const currentEntry   = profile.sideEffects?.find(e => e.date === thisWeek)
  const activeSymptoms = currentEntry?.symptoms.filter(s => s.intensity > 0) ?? []
  const maxIntensity   = activeSymptoms.length > 0
    ? Math.max(...activeSymptoms.map(s => s.intensity)) : 0

  const symptomBadge =
    maxIntensity === 0 ? { label: 'Sem sintomas', color: '#10B981', dotColor: '#10B981' }
    : maxIntensity === 1 ? { label: `${activeSymptoms.length} leve${activeSymptoms.length > 1 ? 's' : ''}`, color: '#10B981', dotColor: '#10B981' }
    : maxIntensity === 2 ? { label: `${activeSymptoms.length} moderado${activeSymptoms.length > 1 ? 's' : ''}`, color: '#F59E0B', dotColor: '#F59E0B' }
    : { label: `${activeSymptoms.length} intenso${activeSymptoms.length > 1 ? 's' : ''}`, color: '#EF4444', dotColor: '#EF4444' }

  const currentCard = SECTION_CARDS.find(c => c.id === activeSection)

  // ── Section view ────────────────────────────────────────────────────────────
  if (activeSection !== null) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Sticky back header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          paddingTop: '4px', paddingBottom: '12px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          marginBottom: '4px',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
            <button
              onClick={() => setActiveSection(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: 'var(--primary)', fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Saúde</span>
            </button>
            <ChevronRight size={12} strokeWidth={2} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {currentCard?.title}
            </span>
          </div>

          {/* Section title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              background: currentCard?.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: currentCard?.shadow,
            }}>
              {activeSection && SECTION_ICON_SM[activeSection]}
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
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                            background: `${intensityColor}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: intensityColor,
                          }}>
                            {SYMPTOM_ICON_MAP[s.id]}
                          </div>
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
                      <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
                        Estas dicas são educativas. Se os sintomas persistirem ou forem intensos, consulte o médico responsável pelo seu protocolo.
                      </p>
                    </div>
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
                  <Lightbulb size={16} strokeWidth={2} style={{ flexShrink: 0, color: '#B45309' }} />
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
                      background: 'rgba(255,255,255,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 800, color: '#fff',
                    }}>
                      {lvl.level}
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '15px', color: '#fff', margin: 0, lineHeight: 1.2 }}>
                        {lvl.title}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.72)', margin: 0, marginTop: '2px' }}>
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
                          color: lvl.iconColor,
                        }}>
                          {SUPP_ICON_MAP[item.name]}
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
                      <Lightbulb size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-muted)' }} />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                        {lvl.note}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card-warning">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
                  <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
                    Esta seção possui caráter educativo e não substitui orientação médica ou nutricional. A necessidade de suplementação deve ser avaliada individualmente.
                  </p>
                </div>
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

  // ── Home list view ───────────────────────────────────────────────────────────
  const GROUPS: { label: string; ids: HealthTab[] }[] = [
    { label: 'Nutrição & Movimento',   ids: ['food', 'exercise', 'weaning'] },
    { label: 'Suporte ao Protocolo',   ids: ['supplementation', 'antiplato'] },
    { label: 'Gestão',                 ids: ['storage'] },
  ]

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ paddingBottom: '2px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.6px' }}>
          Saúde
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
          Seu painel de bem-estar
        </p>
      </div>

      {/* Banner de sintomas */}
      <button
        onClick={() => setActiveSection('symptoms')}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 18px', borderRadius: '20px',
          background: 'var(--surface)',
          border: `1px solid ${maxIntensity >= 3 ? 'rgba(239,68,68,0.20)' : maxIntensity === 2 ? 'rgba(245,158,11,0.22)' : 'var(--border)'}`,
          boxShadow: 'var(--shadow-card)', fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
          background: maxIntensity >= 3 ? 'rgba(239,68,68,0.08)' : maxIntensity === 2 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
          border: `1px solid ${maxIntensity >= 3 ? 'rgba(239,68,68,0.14)' : maxIntensity === 2 ? 'rgba(245,158,11,0.14)' : 'rgba(16,185,129,0.14)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={20} strokeWidth={2} color={maxIntensity >= 3 ? '#EF4444' : maxIntensity === 2 ? '#F59E0B' : '#10B981'} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
            Sintomas desta semana
          </p>
          <p style={{ fontSize: '12px', color: symptomBadge.color, fontWeight: 600, margin: '3px 0 0' }}>
            {symptomBadge.label}
          </p>
        </div>
        <ChevronRight size={16} strokeWidth={2} color="var(--text-muted)" />
      </button>

      {/* Grupos de seções */}
      {GROUPS.map(group => {
        const cards = group.ids.map(id => SECTION_CARDS.find(c => c.id === id)!).filter(Boolean)
        return (
          <div key={group.label}>
            <p style={{
              fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.09em',
              margin: '0 0 10px 4px', fontFamily: 'Inter, sans-serif',
            }}>
              {group.label}
            </p>
            <div style={{
              borderRadius: '20px', overflow: 'hidden',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}>
              {cards.map((card, i) => (
                <button
                  key={card.id}
                  onClick={() => setActiveSection(card.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px',
                    borderBottom: i < cards.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'transparent', border: 'none', borderRadius: 0,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s', fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onTouchStart={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    background: ICON_ACCENT[card.id].bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {SECTION_ICON_LIST[card.id]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                      {card.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
                      {card.subtitle}
                    </p>
                  </div>
                  <ChevronRight size={15} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )
      })}

    </div>
  )
}
