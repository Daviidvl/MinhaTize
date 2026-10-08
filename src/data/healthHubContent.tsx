import {
  Activity, Utensils, Dumbbell, TrendingDown, Pill, Target, Package,
  Waves, AlertCircle, ArrowDown, Droplets,
  Flame, Battery, RotateCcw, Circle, Minus, X,
  Zap, Moon, Sun, Heart, Shield, Fish, Sparkles, Feather,
} from 'lucide-react'

export type HealthTab = 'symptoms' | 'food' | 'exercise' | 'weaning' | 'supplementation' | 'antiplato' | 'storage'

export const SECTION_ICON_MAP: Record<HealthTab, React.ReactNode> = {
  symptoms:        <Activity      size={26} strokeWidth={1.75} />,
  food:            <Utensils      size={26} strokeWidth={1.75} />,
  exercise:        <Dumbbell      size={26} strokeWidth={1.75} />,
  weaning:         <TrendingDown  size={26} strokeWidth={1.75} />,
  supplementation: <Pill          size={26} strokeWidth={1.75} />,
  antiplato:       <Target        size={26} strokeWidth={1.75} />,
  storage:         <Package       size={26} strokeWidth={1.75} />,
}

export const SECTION_ICON_SM: Record<HealthTab, React.ReactNode> = {
  symptoms:       <Activity      size={18} strokeWidth={1.75} />,
  food:           <Utensils      size={18} strokeWidth={1.75} />,
  exercise:       <Dumbbell      size={18} strokeWidth={1.75} />,
  weaning:        <TrendingDown  size={18} strokeWidth={1.75} />,
  supplementation:<Pill          size={18} strokeWidth={1.75} />,
  antiplato:      <Target        size={18} strokeWidth={1.75} />,
  storage:        <Package       size={18} strokeWidth={1.75} />,
}

// ── Symptom icon lookup ───────────────────────────────────────────────────────
export const SYMPTOM_ICON_MAP: Record<string, React.ReactNode> = {
  nausea:       <Waves       size={18} strokeWidth={1.75} />,
  vomiting:     <AlertCircle size={18} strokeWidth={1.75} />,
  constipation: <ArrowDown   size={18} strokeWidth={1.75} />,
  diarrhea:     <Droplets    size={18} strokeWidth={1.75} />,
  reflux:       <Flame       size={18} strokeWidth={1.75} />,
  fatigue:      <Battery     size={18} strokeWidth={1.75} />,
  dizziness:    <RotateCcw   size={18} strokeWidth={1.75} />,
  abdominal:    <Circle      size={18} strokeWidth={1.75} />,
  headache:     <Minus       size={18} strokeWidth={1.75} />,
  appetite:     <X           size={18} strokeWidth={1.75} />,
}

// ── Supplementation icon lookup ───────────────────────────────────────────────
export const SUPP_ICON_MAP: Record<string, React.ReactNode> = {
  'Proteína Adequada':   <Dumbbell size={18} strokeWidth={1.75} />,
  'Creatina':            <Zap      size={18} strokeWidth={1.75} />,
  'Multivitamínico':     <Pill     size={18} strokeWidth={1.75} />,
  'Magnésio':            <Moon     size={18} strokeWidth={1.75} />,
  'Vitamina D':          <Sun      size={18} strokeWidth={1.75} />,
  'Vitamina B12':        <Droplets size={18} strokeWidth={1.75} />,
  'Ferro':               <Heart    size={18} strokeWidth={1.75} />,
  'Zinco':               <Shield   size={18} strokeWidth={1.75} />,
  'Ômega 3':             <Fish     size={18} strokeWidth={1.75} />,
  'Colágeno Hidrolisado':<Sparkles size={18} strokeWidth={1.75} />,
  'Biotina':             <Feather  size={18} strokeWidth={1.75} />,
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
    gradient: 'var(--g-hero)',
    bg: 'var(--mist)',
    border: 'var(--line)',
    badgeBg: 'var(--ice)',
    badgeColor: 'var(--cobalt)',
    iconBg: 'var(--ice)',
    iconColor: 'var(--cobalt)',
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
    gradient: 'var(--g-hero)',
    bg: 'var(--mist)',
    border: 'var(--line)',
    badgeBg: 'var(--ice)',
    badgeColor: 'var(--cobalt)',
    iconBg: 'var(--ice)',
    iconColor: 'var(--cobalt)',
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
    gradient: 'var(--g-hero)',
    bg: 'var(--mist)',
    border: 'var(--line)',
    badgeBg: 'var(--ice)',
    badgeColor: 'var(--cobalt)',
    iconBg: 'var(--ice)',
    iconColor: 'var(--cobalt)',
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
  chipBg: string
}[] = [
  {
    id: 'symptoms',
    title: 'Sintomas',
    subtitle: 'Registre e acompanhe efeitos colaterais',
    gradient: 'var(--surface)',
    shadow: '0 8px 28px rgba(var(--shadow-rgb),0.10)',
    accentColor: 'var(--cobalt)',
    chipBg: 'var(--ice)',
  },
  {
    id: 'food',
    title: 'Alimentação',
    subtitle: 'Alimentos aliados e o que evitar',
    gradient: 'var(--surface)',
    shadow: '0 8px 28px rgba(var(--shadow-rgb),0.10)',
    accentColor: 'var(--cobalt)',
    chipBg: 'var(--ice)',
  },
  {
    id: 'exercise',
    title: 'Exercício',
    subtitle: 'Guia de treino com GLP-1',
    gradient: 'var(--surface)',
    shadow: '0 8px 28px rgba(var(--shadow-rgb),0.10)',
    accentColor: 'var(--cobalt)',
    chipBg: 'var(--ice)',
  },
  {
    id: 'weaning',
    title: 'Desmame',
    subtitle: 'Protocolo de interrupção gradual',
    gradient: 'var(--surface)',
    shadow: '0 8px 28px rgba(var(--shadow-rgb),0.10)',
    accentColor: 'var(--cobalt)',
    chipBg: 'var(--ice)',
  },
  {
    id: 'supplementation',
    title: 'Suplementação',
    subtitle: 'O que priorizar durante o tratamento',
    gradient: 'var(--surface)',
    shadow: '0 8px 28px rgba(var(--shadow-rgb),0.10)',
    accentColor: 'var(--cobalt)',
    chipBg: 'var(--ice)',
  },
  {
    id: 'antiplato',
    title: 'Platô',
    subtitle: 'Análise automática da sua evolução de peso',
    gradient: 'var(--surface)',
    shadow: '0 8px 28px rgba(var(--shadow-rgb),0.10)',
    accentColor: 'var(--teal-d)',
    chipBg: 'var(--teal-l)',
  },
  {
    id: 'storage',
    title: 'Armazenamento',
    subtitle: 'Como guardar sua medicação corretamente',
    gradient: 'var(--surface)',
    shadow: '0 8px 28px rgba(var(--shadow-rgb),0.10)',
    accentColor: 'var(--cobalt)',
    chipBg: 'var(--ice)',
  },
]
