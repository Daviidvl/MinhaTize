import {
  Activity, Utensils, Dumbbell, TrendingDown, Pill, Target, Package,
  Waves, AlertCircle, ArrowDown, Droplets,
  Flame, Battery, RotateCcw, Circle, Minus, X,
  Zap, Moon, Sun, Heart, Shield, Fish, Sparkles, Feather,
} from 'lucide-react'

export type HealthTab = 'symptoms' | 'food' | 'exercise' | 'weaning' | 'supplementation' | 'antiplato' | 'storage'

export const SECTION_ICON_MAP: Record<HealthTab, React.ReactNode> = {
  symptoms:        <Activity      size={26} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  food:            <Utensils      size={26} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  exercise:        <Dumbbell      size={26} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  weaning:         <TrendingDown  size={26} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  supplementation: <Pill          size={26} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  antiplato:       <Target        size={26} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  storage:         <Package       size={26} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
}

export const SECTION_ICON_SM: Record<HealthTab, React.ReactNode> = {
  symptoms:       <Activity      size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  food:           <Utensils      size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  exercise:       <Dumbbell      size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  weaning:        <TrendingDown  size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  supplementation:<Pill          size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  antiplato:      <Target        size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
  storage:        <Package       size={18} strokeWidth={2} color="rgba(255,255,255,0.95)" />,
}

// ── Symptom icon lookup ───────────────────────────────────────────────────────
export const SYMPTOM_ICON_MAP: Record<string, React.ReactNode> = {
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
export const SUPP_ICON_MAP: Record<string, React.ReactNode> = {
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
export const SYMPTOM_TIPS: Record<string, { title: string; tips: string[] }> = {
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
      'Garanta ao menos 7–8h de sono por noite',
      'Mantenha hidratação e ingestão proteica adequadas',
      'Pequenas caminhadas ao ar livre ajudam a energizar',
      'Evite treinos muito intensos em dias de cansaço extremo',
    ],
  },
  dizziness: {
    title: 'Tontura',
    tips: [
      'Levante-se devagar, especialmente ao sair da cama',
      'Mantenha boa hidratação e ingestão de sódio adequada',
      'Evite ficar muito tempo em jejum prolongado',
      'Se persistir, converse com seu médico sobre pressão arterial',
    ],
  },
  abdominal: {
    title: 'Dor Abdominal',
    tips: [
      'Evite refeições muito volumosas de uma vez',
      'Reduza alimentos gordurosos e ultraprocessados',
      'Aplique calor local suave se o desconforto for leve',
      'Procure atendimento se a dor for intensa ou persistente',
    ],
  },
  headache: {
    title: 'Dor de Cabeça',
    tips: [
      'Mantenha-se bem hidratado ao longo do dia',
      'Evite jejuns prolongados entre as refeições',
      'Garanta sono de qualidade e regularidade nos horários',
      'Se frequente, converse com seu médico',
    ],
  },
  appetite: {
    title: 'Falta de Apetite',
    tips: [
      'Priorize proteínas e gorduras boas em porções pequenas',
      'Ovos, abacate e oleaginosas são densos em nutrientes',
      'Smoothies e vitaminas são opções práticas para quem não tem apetite',
    ],
  },
}

// ── Supplementation levels ────────────────────────────────────────────────────
export const SUPP_LEVELS = [
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

export function getMondayOf(d: Date) {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date.toISOString().split('T')[0]
}

// ── Section card definitions ──────────────────────────────────────────────────
export const SECTION_CARDS: {
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
    gradient: 'linear-gradient(150deg, #1E4D6B 0%, #0F3347 100%)',
    shadow: '0 8px 28px rgba(30,77,107,0.35)',
    accentColor: '#1E4D6B',
  },
  {
    id: 'food',
    title: 'Alimentação',
    subtitle: 'Alimentos aliados e o que evitar',
    gradient: 'linear-gradient(150deg, #16653A 0%, #0E4A29 100%)',
    shadow: '0 8px 28px rgba(22,101,58,0.35)',
    accentColor: '#16653A',
  },
  {
    id: 'exercise',
    title: 'Exercício',
    subtitle: 'Guia de treino com GLP-1',
    gradient: 'linear-gradient(150deg, #132D22 0%, #0C1F18 100%)',
    shadow: '0 8px 28px rgba(12,31,24,0.50)',
    accentColor: '#22C55E',
  },
  {
    id: 'weaning',
    title: 'Desmame',
    subtitle: 'Protocolo de interrupção gradual',
    gradient: 'linear-gradient(150deg, #374151 0%, #1F2937 100%)',
    shadow: '0 8px 28px rgba(55,65,81,0.40)',
    accentColor: '#374151',
  },
  {
    id: 'supplementation',
    title: 'Suplementação',
    subtitle: 'O que priorizar durante o tratamento',
    gradient: 'linear-gradient(150deg, #0F766E 0%, #0A5952 100%)',
    shadow: '0 8px 28px rgba(15,118,110,0.35)',
    accentColor: '#0F766E',
  },
  {
    id: 'antiplato',
    title: 'Anti-Platô',
    subtitle: 'Identifique e desbloqueie seu platô',
    gradient: 'linear-gradient(150deg, #5B21B6 0%, #3E1480 100%)',
    shadow: '0 8px 28px rgba(91,33,182,0.35)',
    accentColor: '#5B21B6',
  },
  {
    id: 'storage',
    title: 'Armazenamento',
    subtitle: 'Como guardar sua medicação corretamente',
    gradient: 'linear-gradient(150deg, #0369A1 0%, #024F7B 100%)',
    shadow: '0 8px 28px rgba(3,105,161,0.35)',
    accentColor: '#0369A1',
  },
]
