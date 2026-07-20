// ── Types ─────────────────────────────────────────────────────────────────────
export type Step = 'intro' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | 'result'
export type ProfileType = 'green' | 'yellow' | 'blue'

export interface Answers {
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string
  q6: string
  q7: string[]
  q8: string
}

export const STEP_ORDER: Step[] = ['1', '2', '3', '4', '5', '6', '7', '8']

export const NONE_SYMPTOM = 'Nenhum dos sintomas acima'
export const SEVERE_SYMPTOMS = [
  'Náusea persistente',
  'Vômitos',
  'Dor abdominal importante',
  'Dificuldade importante para se alimentar',
]

// ── Classification logic ──────────────────────────────────────────────────────
export function classify(a: Answers): ProfileType {
  const hasSevere = a.q7.some(s => SEVERE_SYMPTOMS.includes(s))
  if (hasSevere || a.q6 === 'Estou recuperando peso') return 'blue'

  const isGreen =
    a.q1 === 'Sim' &&
    (a.q2 === 'Entre 2 e 3 meses' || a.q2 === 'Mais de 3 meses') &&
    (a.q3 === 'Muito controlada' || a.q3 === 'Moderadamente controlada') &&
    (a.q4 === 'Bem estruturada' || a.q4 === 'Razoável') &&
    (a.q5 === 'Sim, 3 ou mais vezes por semana' || a.q5 === 'Eventualmente') &&
    a.q6 === 'Peso estabilizado' &&
    (a.q7.length === 0 || (a.q7.length === 1 && a.q7[0] === NONE_SYMPTOM))

  return isGreen ? 'green' : 'yellow'
}

// ── Tapering plans ────────────────────────────────────────────────────────────
export const TAPER_DOSES: Record<string, string[]> = {
  '15':   ['15 mg', '12,5 mg', '10 mg', '7,5 mg', '5 mg', '5 mg a cada 10 dias', '5 mg a cada 14 dias'],
  '12.5': ['12,5 mg', '10 mg', '7,5 mg', '5 mg', '5 mg a cada 10 dias', '5 mg a cada 14 dias'],
  '10':   ['10 mg', '7,5 mg', '5 mg', '5 mg a cada 10 dias', '5 mg a cada 14 dias'],
  '7.5':  ['7,5 mg', '5 mg', '5 mg a cada 10 dias', '5 mg a cada 14 dias'],
  '5':    ['5 mg semanal', '5 mg a cada 10 dias', '5 mg a cada 14 dias'],
  '2.5':  ['2,5 mg semanal', '2,5 mg a cada 10 dias', '2,5 mg a cada 14 dias'],
}

// ── Profile config ────────────────────────────────────────────────────────────
export const PROFILE_CONFIG = {
  green: {
    dot: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.25)',
    label: 'Boa prontidão para discutir o desmame',
    message: 'Você apresenta sinais favoráveis para discutir o desmame com seu médico.\n\nUma das estratégias mais utilizadas na prática clínica consiste em reduzir gradualmente a dose e, posteriormente, aumentar o intervalo entre as aplicações.',
  },
  yellow: {
    dot: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
    label: 'Ainda não é o momento ideal',
    message: 'Neste momento, pode ser mais interessante consolidar os hábitos, estabilizar os resultados e fortalecer a rotina alimentar e de exercícios antes de iniciar o desmame.',
  },
  blue: {
    dot: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.25)',
    label: 'Situações que merecem avaliação individual',
    message: 'Algumas situações exigem uma avaliação individualizada. Por isso, recomenda-se discutir os próximos passos diretamente com o médico responsável pelo acompanhamento.',
  },
}
