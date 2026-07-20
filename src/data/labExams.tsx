import {
  Zap, Heart, Activity, Droplets, Sun, FlaskConical, Thermometer,
} from 'lucide-react'
import { Sex } from '../types'

// ── Status type ──────────────────────────────────────────────────────────────
export type ExamStatus = 'normal' | 'low' | 'high'
export type CategoryId = 'metabolic' | 'lipid' | 'liver' | 'renal' | 'vitamins' | 'hormonal' | 'inflammation'

// ── Category definitions ─────────────────────────────────────────────────────
export interface Category {
  id: CategoryId
  title: string
  checkupLabel: string
}

export const CATEGORY_ICON: Record<CategoryId, React.ReactNode> = {
  metabolic:    <Zap          size={18} strokeWidth={2} />,
  lipid:        <Heart        size={18} strokeWidth={2} />,
  liver:        <Activity     size={18} strokeWidth={2} />,
  renal:        <Droplets     size={18} strokeWidth={2} />,
  vitamins:     <Sun          size={18} strokeWidth={2} />,
  hormonal:     <FlaskConical size={18} strokeWidth={2} />,
  inflammation: <Thermometer  size={18} strokeWidth={2} />,
}

export const CATEGORY_ICON_SM: Record<CategoryId, React.ReactNode> = {
  metabolic:    <Zap          size={14} strokeWidth={2} />,
  lipid:        <Heart        size={14} strokeWidth={2} />,
  liver:        <Activity     size={14} strokeWidth={2} />,
  renal:        <Droplets     size={14} strokeWidth={2} />,
  vitamins:     <Sun          size={14} strokeWidth={2} />,
  hormonal:     <FlaskConical size={14} strokeWidth={2} />,
  inflammation: <Thermometer  size={14} strokeWidth={2} />,
}

export const CATEGORIES: Category[] = [
  { id: 'metabolic',    title: 'Metabólico',            checkupLabel: 'Controle metabólico adequado'       },
  { id: 'lipid',        title: 'Perfil Lipídico',        checkupLabel: 'Perfil lipídico adequado'           },
  { id: 'liver',        title: 'Função Hepática',        checkupLabel: 'Função hepática preservada'         },
  { id: 'renal',        title: 'Função Renal',           checkupLabel: 'Função renal preservada'            },
  { id: 'vitamins',     title: 'Vitaminas e Nutrientes', checkupLabel: 'Vitaminas e nutrientes adequados'   },
  { id: 'hormonal',     title: 'Hormonal',               checkupLabel: 'Perfil hormonal adequado'           },
  { id: 'inflammation', title: 'Inflamação',             checkupLabel: 'Marcadores inflamatórios normais'   },
]

// ── Exam definitions ─────────────────────────────────────────────────────────
export interface ExamDef {
  id: string
  name: string
  unit: string
  category: CategoryId
  refDisplay: string | ((sex?: Sex) => string)
  step?: number
  sexDependent?: boolean
  getStatus: (v: number, sex?: Sex) => ExamStatus
  interpret: (v: number, status: ExamStatus, sex?: Sex) => string
}

export const EXAMS: ExamDef[] = [
  // ── METABÓLICO ───
  {
    id: 'glicemia', name: 'Glicemia em Jejum', unit: 'mg/dL', category: 'metabolic',
    refDisplay: '70 – 99 mg/dL', step: 1,
    getStatus: v => v < 70 ? 'low' : v > 99 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Glicemia em jejum dentro da faixa de referência, indicando controle glicêmico adequado.'
      : s === 'low'
        ? 'Glicemia em jejum abaixo da faixa de referência. Valores reduzidos podem indicar hipoglicemia e merecem avaliação médica.'
        : 'Glicemia em jejum acima da faixa de referência. Valores elevados podem indicar pré-diabetes ou diabetes. Converse com seu médico.',
  },
  {
    id: 'hba1c', name: 'Hemoglobina Glicada (HbA1c)', unit: '%', category: 'metabolic',
    refDisplay: '4,0 – 5,6%', step: 0.1,
    getStatus: v => v < 4 ? 'low' : v > 5.6 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Hemoglobina glicada dentro da faixa normal, indicando bom controle do açúcar nos últimos 2–3 meses.'
      : s === 'high'
        ? 'A hemoglobina glicada está acima da faixa considerada normal pela plataforma. Isso pode indicar alteração no controle glicêmico e merece acompanhamento profissional.'
        : 'HbA1c abaixo da faixa de referência. Converse com seu médico.',
  },
  {
    id: 'insulina', name: 'Insulina de Jejum', unit: 'µUI/mL', category: 'metabolic',
    refDisplay: '2 – 25 µUI/mL', step: 0.1,
    getStatus: v => v < 2 ? 'low' : v > 25 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Insulina de jejum dentro da faixa de referência.'
      : s === 'high'
        ? 'Insulina elevada em jejum pode estar associada à resistência à insulina. Converse com seu médico para avaliação.'
        : 'Insulina de jejum abaixo da faixa de referência. Converse com seu médico.',
  },
  {
    id: 'homa_ir', name: 'HOMA-IR', unit: '', category: 'metabolic',
    refDisplay: '< 2,5', step: 0.01,
    getStatus: v => v > 2.5 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'HOMA-IR dentro da faixa aceitável, sugerindo sensibilidade à insulina adequada.'
      : 'HOMA-IR elevado pode indicar resistência à insulina. Converse com seu médico para avaliação e orientação.',
  },
  // ── LIPÍDICO ───
  {
    id: 'colesterol', name: 'Colesterol Total', unit: 'mg/dL', category: 'lipid',
    refDisplay: '< 200 mg/dL (desejável)', step: 1,
    getStatus: v => v < 200 ? 'normal' : 'high',
    interpret: (v, s) => s === 'normal'
      ? 'Colesterol total dentro do nível desejável.'
      : v <= 239
        ? 'Colesterol total entre 200–239 mg/dL (moderadamente alto). Converse com seu médico sobre hábitos de vida e acompanhamento.'
        : 'Colesterol total acima de 239 mg/dL (alto). Valores elevados estão associados a maior risco cardiovascular. Acompanhamento médico é recomendado.',
  },
  {
    id: 'ldl', name: 'LDL', unit: 'mg/dL', category: 'lipid',
    refDisplay: '< 100 mg/dL (ótimo)', step: 1,
    getStatus: v => v < 100 ? 'normal' : 'high',
    interpret: (v, s) => s === 'normal'
      ? 'LDL (colesterol "ruim") no nível ótimo, associado a menor risco cardiovascular.'
      : v < 130
        ? 'LDL entre 100–129 mg/dL (quase ideal). Ainda aceitável para a maioria sem fatores de risco. Converse com seu médico.'
        : v < 160
          ? 'LDL entre 130–159 mg/dL (moderadamente alto). Converse com seu médico sobre intervenções de estilo de vida.'
          : v < 190
            ? 'LDL entre 160–189 mg/dL (alto). Avaliação médica é recomendada.'
            : 'LDL acima de 189 mg/dL (muito alto). Acompanhamento médico especializado é recomendado.',
  },
  {
    id: 'hdl', name: 'HDL', unit: 'mg/dL', category: 'lipid',
    refDisplay: sex => sex === 'male' ? '> 40 mg/dL' : '> 50 mg/dL',
    sexDependent: true, step: 1,
    getStatus: (v, sex) => v < (sex === 'male' ? 40 : 50) ? 'low' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'HDL (colesterol "bom") dentro da faixa desejável, indicando proteção cardiovascular adequada.'
      : 'HDL abaixo da faixa recomendada. Níveis baixos de HDL estão associados a maior risco cardiovascular. Exercício físico regular contribui para elevar o HDL.',
  },
  {
    id: 'triglicerideos', name: 'Triglicerídeos', unit: 'mg/dL', category: 'lipid',
    refDisplay: '< 150 mg/dL', step: 1,
    getStatus: v => v < 150 ? 'normal' : 'high',
    interpret: (v, s) => s === 'normal'
      ? 'Triglicerídeos dentro da faixa normal.'
      : v < 200
        ? 'Triglicerídeos entre 150–199 mg/dL (limítrofe). Converse com seu médico sobre hábitos alimentares e exercício físico.'
        : v < 500
          ? 'Triglicerídeos entre 200–499 mg/dL (alto). Valores elevados estão associados a risco cardiovascular e metabólico. Acompanhamento médico é recomendado.'
          : 'Triglicerídeos acima de 500 mg/dL (muito alto). Avaliação médica imediata é recomendada.',
  },
  // ── HEPÁTICO ───
  {
    id: 'alt', name: 'ALT (TGP)', unit: 'U/L', category: 'liver',
    refDisplay: '10 – 40 U/L', step: 1,
    getStatus: v => v < 10 ? 'low' : v > 40 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'ALT dentro da faixa de referência, sugerindo função hepática preservada.'
      : s === 'high'
        ? 'ALT acima da faixa de referência. Elevações podem indicar sobrecarga ou lesão hepática. Avalie com seu médico.'
        : 'ALT abaixo da faixa de referência. Converse com seu médico.',
  },
  {
    id: 'ast', name: 'AST (TGO)', unit: 'U/L', category: 'liver',
    refDisplay: '10 – 40 U/L', step: 1,
    getStatus: v => v < 10 ? 'low' : v > 40 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'AST dentro da faixa de referência, sugerindo função hepática preservada.'
      : s === 'high'
        ? 'AST acima da faixa de referência. Elevações podem indicar sobrecarga ou lesão hepática. Avalie com seu médico.'
        : 'AST abaixo da faixa de referência. Converse com seu médico.',
  },
  {
    id: 'bilirrubina', name: 'Bilirrubina Total', unit: 'mg/dL', category: 'liver',
    refDisplay: '0,1 – 1,2 mg/dL', step: 0.1,
    getStatus: v => v < 0.1 ? 'low' : v > 1.2 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Bilirrubina total dentro da faixa de referência.'
      : s === 'high'
        ? 'Bilirrubina total elevada pode indicar alterações hepáticas ou hemolíticas. Avalie com seu médico.'
        : 'Bilirrubina total abaixo da faixa. Converse com seu médico.',
  },
  // ── RENAL ───
  {
    id: 'creatinina', name: 'Creatinina', unit: 'mg/dL', category: 'renal',
    refDisplay: '0,7 – 1,3 mg/dL', step: 0.1,
    getStatus: v => v < 0.7 ? 'low' : v > 1.3 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Creatinina dentro da faixa de referência, sugerindo função renal adequada.'
      : s === 'high'
        ? 'Creatinina acima da faixa de referência. Elevações podem indicar redução da função renal. Converse com seu médico.'
        : 'Creatinina abaixo da faixa de referência. Converse com seu médico.',
  },
  {
    id: 'ureia', name: 'Ureia', unit: 'mg/dL', category: 'renal',
    refDisplay: '8 – 20 mg/dL', step: 1,
    getStatus: v => v < 8 ? 'low' : v > 20 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Ureia dentro da faixa de referência.'
      : s === 'high'
        ? 'Ureia acima da faixa de referência. Valores elevados podem indicar redução da função renal ou aumento do catabolismo proteico. Avalie com seu médico.'
        : 'Ureia abaixo da faixa. Pode estar associada a ingestão proteica reduzida.',
  },
  {
    id: 'egfr', name: 'eGFR', unit: 'mL/min/1,73m²', category: 'renal',
    refDisplay: '≥ 90 mL/min/1,73m²', step: 1,
    getStatus: v => v < 90 ? 'low' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Taxa de filtração glomerular estimada adequada, indicando função renal preservada.'
      : 'eGFR abaixo do valor de referência pode indicar redução da função renal. Avaliação médica é recomendada.',
  },
  // ── VITAMINAS ───
  {
    id: 'vitamina_d', name: 'Vitamina D (25-OH)', unit: 'ng/mL', category: 'vitamins',
    refDisplay: '30 – 60 ng/mL', step: 0.1,
    getStatus: v => v < 30 ? 'low' : v > 60 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Vitamina D dentro da faixa de referência, indicando níveis adequados.'
      : s === 'low'
        ? 'A vitamina D está abaixo da faixa de referência utilizada pela plataforma. Níveis reduzidos podem estar associados a menor exposição solar, ingestão inadequada ou outras condições clínicas. Converse com seu profissional de saúde para avaliação individual.'
        : 'Vitamina D acima da faixa de referência. Níveis muito elevados podem indicar toxicidade. Avalie com seu médico.',
  },
  {
    id: 'vitamina_b12', name: 'Vitamina B12', unit: 'pg/mL', category: 'vitamins',
    refDisplay: '200 – 800 pg/mL', step: 1,
    getStatus: v => v < 200 ? 'low' : v > 800 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Vitamina B12 dentro da faixa de referência.'
      : s === 'low'
        ? 'Vitamina B12 abaixo da faixa de referência. Deficiência pode estar associada a sintomas neurológicos e anemia. Converse com seu médico.'
        : 'Vitamina B12 acima da faixa de referência. Valores muito elevados merecem investigação médica.',
  },
  {
    id: 'ferritina', name: 'Ferritina', unit: 'ng/mL', category: 'vitamins',
    refDisplay: sex => sex === 'male' ? '24 – 336 ng/mL' : '24 – 307 ng/mL',
    sexDependent: true, step: 1,
    getStatus: (v, sex) => v < 24 ? 'low' : v > (sex === 'male' ? 336 : 307) ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Ferritina dentro da faixa de referência, indicando reservas de ferro adequadas.'
      : s === 'low'
        ? 'Ferritina abaixo da faixa de referência. Pode indicar redução das reservas de ferro, que pode estar associada a sintomas como fadiga. Avalie com seu médico.'
        : 'Ferritina elevada pode estar associada a inflamação, sobrecarga de ferro ou outras condições. Avalie com seu médico.',
  },
  {
    id: 'ferro', name: 'Ferro', unit: 'µg/dL', category: 'vitamins',
    refDisplay: '50 – 150 µg/dL', step: 1,
    getStatus: v => v < 50 ? 'low' : v > 150 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Ferro sérico dentro da faixa de referência.'
      : s === 'low'
        ? 'Ferro sérico abaixo da faixa de referência. Pode estar associado a anemia ferropriva. Converse com seu médico.'
        : 'Ferro sérico acima da faixa de referência. Avalie com seu médico.',
  },
  {
    id: 'magnesio', name: 'Magnésio', unit: 'mEq/L', category: 'vitamins',
    refDisplay: '1,6 – 2,6 mEq/L', step: 0.01,
    getStatus: v => v < 1.6 ? 'low' : v > 2.6 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Magnésio dentro da faixa de referência.'
      : s === 'low'
        ? 'Magnésio abaixo da faixa de referência. Deficiência pode estar associada a cãibras, fraqueza e outros sintomas. Converse com seu médico.'
        : 'Magnésio acima da faixa de referência. Avalie com seu médico.',
  },
  {
    id: 'zinco', name: 'Zinco', unit: 'µg/dL', category: 'vitamins',
    refDisplay: '75 – 140 µg/dL', step: 1,
    getStatus: v => v < 75 ? 'low' : v > 140 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Zinco dentro da faixa de referência.'
      : s === 'low'
        ? 'Zinco abaixo da faixa de referência. Deficiência pode afetar imunidade e cicatrização. Converse com seu médico.'
        : 'Zinco acima da faixa de referência. Avalie com seu médico.',
  },
  {
    id: 'acido_folico', name: 'ácido Fólico', unit: 'ng/mL', category: 'vitamins',
    refDisplay: '1,8 – 9 ng/mL', step: 0.1,
    getStatus: v => v < 1.8 ? 'low' : v > 9 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'ácido fólico dentro da faixa de referência.'
      : s === 'low'
        ? 'ácido fólico abaixo da faixa de referência. Deficiência pode estar associada a anemia e outros efeitos. Converse com seu médico.'
        : 'ácido fólico acima da faixa de referência. Avalie com seu médico.',
  },
  // ── HORMONAL ───
  {
    id: 'tsh', name: 'TSH', unit: 'µUI/mL', category: 'hormonal',
    refDisplay: '0,5 – 4,0 µUI/mL', step: 0.01,
    getStatus: v => v < 0.5 ? 'low' : v > 4.0 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'TSH dentro da faixa de referência, sugerindo função tireoidiana adequada.'
      : s === 'low'
        ? 'TSH abaixo da faixa de referência. Isso pode estar associado a hipertireoidismo. Avalie com seu médico endocrinologista.'
        : 'TSH acima da faixa de referência. Isso pode indicar hipotireoidismo. Converse com seu médico para avaliação.',
  },
  {
    id: 't4_livre', name: 'T4 Livre', unit: 'ng/dL', category: 'hormonal',
    refDisplay: '0,8 – 1,8 ng/dL', step: 0.01,
    getStatus: v => v < 0.8 ? 'low' : v > 1.8 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'T4 livre dentro da faixa de referência, sugerindo função tireoidiana preservada.'
      : s === 'low'
        ? 'T4 livre abaixo da faixa de referência. Pode estar associado a hipotireoidismo. Avalie com seu médico.'
        : 'T4 livre acima da faixa de referência. Pode estar associado a hipertireoidismo. Avalie com seu médico.',
  },
  {
    id: 't4_total', name: 'T4 Total', unit: 'µg/dL', category: 'hormonal',
    refDisplay: '5 – 12 µg/dL', step: 0.1,
    getStatus: v => v < 5 ? 'low' : v > 12 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'T4 total dentro da faixa de referência.'
      : s === 'low'
        ? 'T4 total abaixo da faixa de referência. Avalie com seu médico endocrinologista.'
        : 'T4 total acima da faixa de referência. Avalie com seu médico endocrinologista.',
  },
  {
    id: 't3_livre', name: 'T3 Livre', unit: 'pg/mL', category: 'hormonal',
    refDisplay: '2,3 – 4,2 pg/mL', step: 0.01,
    getStatus: v => v < 2.3 ? 'low' : v > 4.2 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'T3 livre dentro da faixa de referência.'
      : s === 'low'
        ? 'T3 livre abaixo da faixa de referência. Avalie com seu médico endocrinologista.'
        : 'T3 livre acima da faixa de referência. Avalie com seu médico endocrinologista.',
  },
  {
    id: 't3_total', name: 'T3 Total', unit: 'ng/dL', category: 'hormonal',
    refDisplay: '80 – 180 ng/dL', step: 1,
    getStatus: v => v < 80 ? 'low' : v > 180 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'T3 total dentro da faixa de referência.'
      : s === 'low'
        ? 'T3 total abaixo da faixa de referência. Avalie com seu médico endocrinologista.'
        : 'T3 total acima da faixa de referência. Avalie com seu médico endocrinologista.',
  },
  {
    id: 'cortisol', name: 'Cortisol', unit: 'µg/dL', category: 'hormonal',
    refDisplay: '6 – 23 µg/dL', step: 0.1,
    getStatus: v => v < 6 ? 'low' : v > 23 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Cortisol dentro da faixa de referência.'
      : s === 'low'
        ? 'Cortisol abaixo da faixa de referência. Pode indicar insuficiência adrenal. Avalie com seu médico.'
        : 'Cortisol acima da faixa de referência. Pode estar associado a estresse crônico ou outras condições. Avalie com seu médico.',
  },
  {
    id: 'testosterona', name: 'Testosterona Total', unit: 'ng/dL', category: 'hormonal',
    refDisplay: sex => sex === 'male' ? '291 – 1100 ng/dL' : '18 – 54 ng/dL',
    sexDependent: true, step: 1,
    getStatus: (v, sex) => {
      const [min, max] = sex === 'male' ? [291, 1100] : [18, 54]
      return v < min ? 'low' : v > max ? 'high' : 'normal'
    },
    interpret: (_, s, sex) => s === 'normal'
      ? `Testosterona total dentro da faixa de referência${sex ? ' para o seu sexo' : ''}.`
      : s === 'low'
        ? 'Testosterona abaixo da faixa de referência. Pode estar associada a sintomas como fadiga e alterações de humor. Avalie com seu médico.'
        : 'Testosterona acima da faixa de referência. Avalie com seu médico.',
  },
  {
    id: 'estradiol', name: 'Estradiol (E2)', unit: 'pg/mL', category: 'hormonal',
    refDisplay: sex => sex === 'male' ? 'Varia – consulte seu laudo' : '30 – 120 pg/mL (fase folicular)',
    sexDependent: true, step: 1,
    getStatus: (v, sex) => sex === 'male' ? 'normal' : v < 30 ? 'low' : v > 120 ? 'high' : 'normal',
    interpret: (_, s, sex) => sex === 'male'
      ? 'A referência de estradiol em homens varia conforme o laboratório e contexto clínico. Avalie com seu médico.'
      : s === 'normal'
        ? 'Estradiol dentro da faixa de referência para fase folicular utilizada pela plataforma.'
        : s === 'low'
          ? 'Estradiol abaixo da faixa de referência para fase folicular. Avalie com seu médico ginecologista ou endocrinologista.'
          : 'Estradiol acima da faixa de referência para fase folicular. Avalie com seu médico.',
  },
  {
    id: 'lh', name: 'LH', unit: 'mIU/mL', category: 'hormonal',
    refDisplay: sex => sex === 'male' ? '1,5 – 9,3 mIU/mL' : '1,9 – 12,5 mIU/mL (fase folicular)',
    sexDependent: true, step: 0.1,
    getStatus: (v, sex) => {
      const [min, max] = sex === 'male' ? [1.5, 9.3] : [1.9, 12.5]
      return v < min ? 'low' : v > max ? 'high' : 'normal'
    },
    interpret: (_, s) => s === 'normal'
      ? 'LH dentro da faixa de referência utilizada pela plataforma.'
      : s === 'low'
        ? 'LH abaixo da faixa de referência. Avalie com seu médico endocrinologista ou ginecologista.'
        : 'LH acima da faixa de referência. Avalie com seu médico.',
  },
  {
    id: 'fsh', name: 'FSH', unit: 'mIU/mL', category: 'hormonal',
    refDisplay: sex => sex === 'male' ? '1 – 12 mIU/mL' : '2 – 10 mIU/mL (fase folicular)',
    sexDependent: true, step: 0.1,
    getStatus: (v, sex) => {
      const [min, max] = sex === 'male' ? [1, 12] : [2, 10]
      return v < min ? 'low' : v > max ? 'high' : 'normal'
    },
    interpret: (_, s) => s === 'normal'
      ? 'FSH dentro da faixa de referência utilizada pela plataforma.'
      : s === 'low'
        ? 'FSH abaixo da faixa de referência. Avalie com seu médico endocrinologista ou ginecologista.'
        : 'FSH acima da faixa de referência. Avalie com seu médico.',
  },
  {
    id: 'prolactina', name: 'Prolactina', unit: 'ng/mL', category: 'hormonal',
    refDisplay: '< 20 ng/mL', step: 0.1,
    getStatus: v => v > 20 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Prolactina dentro da faixa de referência.'
      : 'Prolactina acima da faixa de referência. Elevações podem ter diversas causas e merecem avaliação médica.',
  },
  // ── INFLAMAÇÃO ───
  {
    id: 'pcr', name: 'PCR', unit: 'mg/dL', category: 'inflammation',
    refDisplay: '< 0,9 mg/dL', step: 0.01,
    getStatus: v => v > 0.9 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'PCR dentro da faixa de referência, sem indicação de inflamação significativa.'
      : 'PCR acima da faixa de referência, o que pode indicar processo inflamatório ou infeccioso. Avalie com seu médico.',
  },
  {
    id: 'pcr_us', name: 'PCR Ultrassensível', unit: 'mg/L', category: 'inflammation',
    refDisplay: '< 1,0 mg/L', step: 0.1,
    getStatus: v => v > 1.0 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'PCR ultrassensível dentro da faixa, associado a menor risco cardiovascular.'
      : 'PCR ultrassensível elevada está associada a maior risco cardiovascular. Converse com seu médico.',
  },
  {
    id: 'vhs', name: 'VHS', unit: 'mm/h', category: 'inflammation',
    refDisplay: sex => sex === 'male' ? '0 – 15 mm/h' : '0 – 20 mm/h',
    sexDependent: true, step: 1,
    getStatus: (v, sex) => v > (sex === 'male' ? 15 : 20) ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'VHS dentro da faixa de referência para seu sexo.'
      : 'VHS acima da faixa de referência. Valores elevados podem indicar processo inflamatório, infeccioso ou outras condições. Avalie com seu médico.',
  },
]

// ── Status helpers ───────────────────────────────────────────────────────────
export const STATUS_LABEL: Record<ExamStatus, string> = { normal: 'Normal', low: 'Baixo', high: 'Alto' }

export const STATUS_COLOR: Record<ExamStatus, string> = {
  normal: 'var(--primary)',
  low:    '#B45309',
  high:   '#DC2626',
}

export const STATUS_BG: Record<ExamStatus, string> = {
  normal: 'var(--primary-light)',
  low:    'rgba(245,158,11,0.1)',
  high:   'rgba(239,68,68,0.08)',
}

export const STATUS_BORDER: Record<ExamStatus, string> = {
  normal: 'rgba(16,185,129,0.2)',
  low:    'rgba(245,158,11,0.2)',
  high:   'rgba(239,68,68,0.2)',
}
