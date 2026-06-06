import { useState } from 'react'
import { UserProfile, Sex } from '../types'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
}

// ── Status type ──────────────────────────────────────────────────────────────
type ExamStatus = 'normal' | 'low' | 'high'
type CategoryId = 'metabolic' | 'lipid' | 'liver' | 'renal' | 'vitamins' | 'hormonal' | 'inflammation'

// ── Category definitions ─────────────────────────────────────────────────────
interface Category {
  id: CategoryId
  icon: string
  title: string
  checkupLabel: string
}

const CATEGORIES: Category[] = [
  { id: 'metabolic',    icon: '🩸', title: 'Metabólico',            checkupLabel: 'Controle metabólico adequado'       },
  { id: 'lipid',        icon: '💊', title: 'Perfil Lipídico',        checkupLabel: 'Perfil lipídico adequado'           },
  { id: 'liver',        icon: '🫁', title: 'Função Hepática',        checkupLabel: 'Função hepática preservada'         },
  { id: 'renal',        icon: '💧', title: 'Função Renal',           checkupLabel: 'Função renal preservada'            },
  { id: 'vitamins',     icon: '🌿', title: 'Vitaminas e Nutrientes', checkupLabel: 'Vitaminas e nutrientes adequados'   },
  { id: 'hormonal',     icon: '⚗️', title: 'Hormonal',               checkupLabel: 'Perfil hormonal adequado'           },
  { id: 'inflammation', icon: '🌡️', title: 'Inflamação',             checkupLabel: 'Marcadores inflamatórios normais'   },
]

// ── Exam definitions ─────────────────────────────────────────────────────────
interface ExamDef {
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

const EXAMS: ExamDef[] = [
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
    id: 'acido_folico', name: 'Ácido Fólico', unit: 'ng/mL', category: 'vitamins',
    refDisplay: '1,8 – 9 ng/mL', step: 0.1,
    getStatus: v => v < 1.8 ? 'low' : v > 9 ? 'high' : 'normal',
    interpret: (_, s) => s === 'normal'
      ? 'Ácido fólico dentro da faixa de referência.'
      : s === 'low'
        ? 'Ácido fólico abaixo da faixa de referência. Deficiência pode estar associada a anemia e outros efeitos. Converse com seu médico.'
        : 'Ácido fólico acima da faixa de referência. Avalie com seu médico.',
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
    refDisplay: sex => sex === 'male' ? 'Varia — consulte seu laudo' : '30 – 120 pg/mL (fase folicular)',
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
const STATUS_LABEL: Record<ExamStatus, string> = { normal: '✓ Normal', low: '↓ Baixo', high: '↑ Alto' }

const STATUS_COLOR: Record<ExamStatus, string> = {
  normal: 'var(--primary)',
  low:    '#B45309',
  high:   '#DC2626',
}

const STATUS_BG: Record<ExamStatus, string> = {
  normal: 'var(--primary-light)',
  low:    'rgba(245,158,11,0.1)',
  high:   'rgba(239,68,68,0.08)',
}

const STATUS_BORDER: Record<ExamStatus, string> = {
  normal: 'rgba(16,185,129,0.2)',
  low:    'rgba(245,158,11,0.2)',
  high:   'rgba(239,68,68,0.2)',
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Laboratory({ profile, onUpdateProfile }: Props) {
  const sex = profile.sex

  const [innerTab, setInnerTab] = useState<'exams' | 'analysis'>('exams')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['metabolic']))

  // Local input state — synced to profile on blur
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const r of profile.labResults ?? []) {
      map[r.examId] = String(r.value)
    }
    return map
  })

  // ── Persistence ──────────────────────────────────────────────────────────
  function commitValue(examId: string, raw: string) {
    const value = parseFloat(raw)
    const rest  = (profile.labResults ?? []).filter(r => r.examId !== examId)
    if (!raw || isNaN(value)) {
      onUpdateProfile({ ...profile, labResults: rest })
    } else {
      const date = new Date().toISOString().split('T')[0]
      onUpdateProfile({ ...profile, labResults: [...rest, { examId, value, date }] })
    }
  }

  function clearExam(examId: string) {
    setInputs(p => ({ ...p, [examId]: '' }))
    commitValue(examId, '')
  }

  // ── Computed results ─────────────────────────────────────────────────────
  const savedResults = profile.labResults ?? []

  const filledExams = EXAMS.flatMap(exam => {
    const saved = savedResults.find(r => r.examId === exam.id)
    if (!saved) return []
    return [{ exam, value: saved.value, status: exam.getStatus(saved.value, sex) }]
  })

  const abnormal = filledExams.filter(r => r.status !== 'normal')

  const priority: 'none' | 'green' | 'yellow' | 'red' =
    filledExams.length === 0 ? 'none'
    : abnormal.length === 0  ? 'green'
    : abnormal.length <= 3   ? 'yellow'
    : 'red'

  // ── Checkup items ────────────────────────────────────────────────────────
  const checkupItems = CATEGORIES.flatMap(cat => {
    const catResults = filledExams.filter(r => r.exam.category === cat.id)
    if (catResults.length === 0) return []
    const catAbnormal = catResults.filter(r => r.status !== 'normal')
    if (catAbnormal.length === 0) {
      return [{ ok: true, text: cat.checkupLabel }]
    }
    return catAbnormal.map(r => ({
      ok: false,
      text: `${r.exam.name} ${r.status === 'low' ? 'abaixo' : 'acima'} da referência`,
    }))
  })

  // ── Download ─────────────────────────────────────────────────────────────
  function downloadList() {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const statusColor: Record<ExamStatus, string> = {
      normal: '#059669', low: '#B45309', high: '#DC2626',
    }
    const statusLabel: Record<ExamStatus, string> = {
      normal: '✓ Normal', low: '↓ Baixo', high: '↑ Alto',
    }

    const sections = CATEGORIES.map(cat => {
      const catExams = EXAMS.filter(e => e.category === cat.id)
      const rows = catExams.map(exam => {
        const ref = typeof exam.refDisplay === 'function'
          ? (sex
              ? exam.refDisplay(sex)
              : `F: ${exam.refDisplay('female')} · M: ${exam.refDisplay('male')}`)
          : exam.refDisplay
        const raw    = inputs[exam.id]
        const value  = raw ? parseFloat(raw) : null
        const status = value !== null ? exam.getStatus(value, sex) : null
        const valueCell = value !== null
          ? `<span style="font-weight:700;color:${statusColor[status!]}">${raw} ${exam.unit}</span>`
          : `<span style="color:#9ca3af">—</span>`
        const statusCell = status !== null
          ? `<span style="font-weight:700;color:${statusColor[status]}">${statusLabel[status]}</span>`
          : `<span style="color:#d1d5db">—</span>`
        return `<tr>
          <td>${exam.name}</td>
          <td>${valueCell}</td>
          <td>${ref}</td>
          <td>${statusCell}</td>
        </tr>`
      }).join('')

      return `
        <h2>${cat.icon} ${cat.title}</h2>
        <table>
          <thead><tr><th>Exame</th><th>Resultado</th><th>Referência (plataforma)</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`
    }).join('')

    const filledCount = Object.values(inputs).filter(v => v !== '').length

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Resultados de Exames — Minha Tize</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;max-width:820px;margin:0 auto;padding:24px;color:#111;line-height:1.5}
    h1{color:#059669;font-size:22px;margin-bottom:2px}
    .sub{color:#6b7280;font-size:12px;margin-bottom:28px}
    h2{color:#374151;font-size:15px;border-bottom:2px solid #e5e7eb;padding-bottom:5px;margin-top:24px;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-bottom:4px;font-size:12px}
    thead tr{background:#f0fdf4}
    th{text-align:left;padding:7px 10px;font-size:10px;color:#374151;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
    td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:#fafafa}
    .disc{font-size:11px;color:#6b7280;border-top:2px solid #e5e7eb;padding-top:14px;margin-top:28px;line-height:1.6}
    @media print{body{padding:12px}h2{page-break-before:auto}table{page-break-inside:avoid}}
  </style>
</head>
<body>
  <h1>🧪 Minha Tize — Resultados de Exames</h1>
  <p class="sub">Gerado em ${today} · ${filledCount} exame${filledCount !== 1 ? 's' : ''} preenchido${filledCount !== 1 ? 's' : ''} · Leve ao seu médico, nutricionista ou laboratório</p>
  ${sections}
  <div class="disc">
    <strong>Aviso importante:</strong> A Minha Tize não substitui avaliação médica. Os valores de referência são gerais, baseados em literatura científica, e podem variar entre laboratórios, métodos analíticos, equipamentos, sexo, idade e contexto clínico. Sempre que houver divergência entre a plataforma e o laudo laboratorial, prevalece o valor de referência informado pelo laboratório. Esta plataforma fornece apenas orientação educativa — não realiza diagnóstico, não sugere tratamento, não sugere medicamentos e não sugere suplementação específica.
  </div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  // ── Toggle category ──────────────────────────────────────────────────────
  function toggleCat(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Laboratório</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Insira seus resultados e receba orientações educativas
          </p>
        </div>
        {priority !== 'none' && (
          <div style={{
            flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%',
            background: priority === 'green' ? 'var(--primary-light)' : priority === 'yellow' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
            border: `2px solid ${priority === 'green' ? 'var(--primary)' : priority === 'yellow' ? '#F59E0B' : '#EF4444'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          }}>
            {priority === 'green' ? '🟢' : priority === 'yellow' ? '🟡' : '🔴'}
          </div>
        )}
      </div>

      {/* Priority banner */}
      {priority !== 'none' && (
        <div style={{
          padding: '10px 14px', borderRadius: '11px', fontWeight: 700, fontSize: '13px',
          background: priority === 'green' ? 'var(--primary-light)' : priority === 'yellow' ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${priority === 'green' ? 'rgba(16,185,129,0.2)' : priority === 'yellow' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: priority === 'green' ? 'var(--primary)' : priority === 'yellow' ? '#B45309' : '#DC2626',
        }}>
          {priority === 'green' && '✅ Todos os exames analisados dentro da referência'}
          {priority === 'yellow' && `⚠️ ${abnormal.length} alteração${abnormal.length > 1 ? 'ões' : ''} identificada${abnormal.length > 1 ? 's' : ''} — veja a análise`}
          {priority === 'red'    && `🔴 Múltiplas alterações identificadas — discuta com seu médico`}
        </div>
      )}

      {/* Sex notice */}
      {!sex && EXAMS.some(e => e.sexDependent && savedResults.some(r => r.examId === e.id)) && (
        <div className="card-warning">
          <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
            ℹ️ Você tem exames que dependem do sexo para referência. Configure o sexo no seu <strong>Perfil → Editar</strong> para uma análise mais precisa.
          </p>
        </div>
      )}

      {/* Inner tabs */}
      <div style={{
        display: 'flex', gap: '5px',
        background: 'var(--surface-2)', borderRadius: '14px', padding: '4px',
      }}>
        {([
          { id: 'exams'    as const, label: '📋 Exames'    },
          { id: 'analysis' as const, label: `📊 Análise${filledExams.length > 0 ? ` (${filledExams.length})` : ''}` },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setInnerTab(t.id)}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none',
              background: innerTab === t.id ? 'var(--primary)' : 'transparent',
              color: innerTab === t.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: innerTab === t.id ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── EXAMES TAB ──────────────────────────────────────────────── */}
      {innerTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Download — only when all exams filled */}
          {(() => {
            const filled = EXAMS.filter(e => inputs[e.id] && inputs[e.id] !== '').length
            const total  = EXAMS.length
            const allDone = filled === total
            return allDone ? (
              <button
                onClick={downloadList}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                📄 Baixar PDF com Resultados
              </button>
            ) : (
              <div style={{
                padding: '14px 16px', borderRadius: '14px',
                background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                    📄 Baixar PDF com Resultados
                  </p>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                    {filled}/{total}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '99px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px', background: 'var(--primary)',
                    width: `${(filled / total) * 100}%`, transition: 'width 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Preencha todos os {total} exames para liberar o PDF
                </p>
              </div>
            )
          })()}

          {/* Disclaimer */}
          <div className="card-warning">
            <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
              ⚠️ Os valores de referência são gerais e podem variar entre laboratórios, métodos e contexto clínico. Quando houver divergência, prevalece o valor do seu laudo. A plataforma <strong>não realiza diagnóstico</strong>.
            </p>
          </div>

          {/* Categories */}
          {CATEGORIES.map(cat => {
            const catExams   = EXAMS.filter(e => e.category === cat.id)
            const isOpen     = expanded.has(cat.id)
            const filledCnt  = catExams.filter(e => {
              const v = inputs[e.id]
              return v !== '' && v !== undefined && !isNaN(parseFloat(v))
            }).length

            return (
              <div key={cat.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Category toggle */}
                <button
                  onClick={() => toggleCat(cat.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                      {cat.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {filledCnt}/{catExams.length} preenchidos
                    </p>
                  </div>
                  {filledCnt > 0 && (
                    <span className="badge badge-green" style={{ marginRight: '4px' }}>{filledCnt}</span>
                  )}
                  <span style={{
                    fontSize: '11px', color: 'var(--text-muted)',
                    transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none',
                    display: 'inline-block',
                  }}>▼</span>
                </button>

                {/* Exam fields */}
                {isOpen && (
                  <div style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                  }}>
                    {catExams.map(exam => {
                      const val    = inputs[exam.id] ?? ''
                      const parsed = parseFloat(val)
                      const hasVal = val !== '' && !isNaN(parsed)
                      const status = hasVal ? exam.getStatus(parsed, sex) : null
                      const refTxt = typeof exam.refDisplay === 'function'
                        ? exam.refDisplay(sex)
                        : exam.refDisplay

                      return (
                        <div key={exam.id} style={{ paddingTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                                {exam.name}
                              </p>
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Ref: {refTxt}
                              </p>
                            </div>
                            {status && (
                              <span style={{
                                flexShrink: 0, fontSize: '10px', fontWeight: 700,
                                padding: '3px 8px', borderRadius: '99px',
                                background: STATUS_BG[status], color: STATUS_COLOR[status],
                              }}>
                                {STATUS_LABEL[status]}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="number"
                              className="input-field"
                              placeholder={exam.unit ? `Valor em ${exam.unit}` : 'Valor'}
                              value={val}
                              step={exam.step ?? 0.1}
                              inputMode="decimal"
                              onChange={e => setInputs(p => ({ ...p, [exam.id]: e.target.value }))}
                              onBlur={e  => commitValue(exam.id, e.target.value)}
                              style={{ flex: 1 }}
                            />
                            {hasVal && (
                              <button
                                onClick={() => clearExam(exam.id)}
                                style={{
                                  width: '42px', flexShrink: 0, borderRadius: '9px',
                                  border: '1px solid var(--border)', background: 'var(--surface-2)',
                                  cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >×</button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─── ANÁLISE TAB ─────────────────────────────────────────────── */}
      {innerTab === 'analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {filledExams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '44px', marginBottom: '12px' }}>🧪</p>
              <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                Nenhum exame preenchido
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                Vá em "Exames" e insira seus resultados
              </p>
            </div>
          ) : (
            <>
              {/* Interpretations per category */}
              {CATEGORIES.map(cat => {
                const catResults = filledExams.filter(r => r.exam.category === cat.id)
                if (catResults.length === 0) return null

                return (
                  <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{
                      fontWeight: 700, fontSize: '11px', color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0,
                    }}>
                      {cat.icon} {cat.title}
                    </p>

                    {catResults.map(({ exam, value, status }) => (
                      <div key={exam.id} style={{
                        padding: '12px 14px', borderRadius: '13px',
                        background: status === 'normal' ? 'var(--surface)' : STATUS_BG[status] + '4d',
                        border: `1px solid ${STATUS_BORDER[status]}`,
                        boxShadow: 'var(--shadow-card)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px', gap: '8px' }}>
                          <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', margin: 0, minWidth: 0 }}>
                            {exam.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: STATUS_COLOR[status] }}>
                              {value}{exam.unit ? ` ${exam.unit}` : ''}
                            </span>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                              background: STATUS_BG[status], color: STATUS_COLOR[status],
                            }}>
                              {STATUS_LABEL[status]}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                          {exam.interpret(value, status, sex)}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* Checkup Minha Tize */}
              <div style={{
                background: 'linear-gradient(135deg, var(--surface), var(--surface-2))',
                border: '1px solid var(--border)', borderRadius: '18px', padding: '18px 20px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <p style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '14px' }}>
                  🏥 Seu Checkup Minha Tize
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {checkupItems.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '8px 11px', borderRadius: '10px',
                      background: item.ok ? 'var(--primary-light)' : 'rgba(245,158,11,0.07)',
                    }}>
                      <span style={{ fontSize: '14px', lineHeight: 1.4, flexShrink: 0 }}>
                        {item.ok ? '✔' : '⚠'}
                      </span>
                      <p style={{
                        fontSize: '13px', fontWeight: 600, margin: 0,
                        color: item.ok ? 'var(--primary)' : '#92400E',
                        lineHeight: 1.4,
                      }}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.5 }}>
                  Recomenda-se discutir estes resultados com seu médico ou nutricionista.
                </p>
              </div>

              {/* Disclaimer */}
              <div className="card-warning">
                <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.65 }}>
                  ⚠️ <strong>Aviso importante:</strong> A Minha Tize não substitui avaliação médica. Os valores de referência são gerais e podem variar entre laboratórios, métodos analíticos, equipamentos, sexo, idade e contexto clínico. Quando houver divergência entre a plataforma e o laudo laboratorial, prevalece o valor de referência informado pelo laboratório. Esta ferramenta fornece apenas orientação educativa — não realiza diagnóstico, não sugere tratamento, medicamentos ou suplementação específica.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
