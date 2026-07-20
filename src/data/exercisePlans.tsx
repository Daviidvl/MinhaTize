import { Dumbbell, Activity, ArrowDown, Zap, Sparkles } from 'lucide-react'

export type Sex = 'M' | 'F'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Location = 'gym' | 'home'
export type WorkoutDays = 2 | 3 | 4 | 5

export interface WorkoutProfile {
  sex: Sex
  level: Level
  location: Location
  days: WorkoutDays
  preferredDays: number[]  // 0=Dom … 6=Sáb
}

export interface ExItem {
  name: string
  tip?: string
}

export interface WorkoutDay {
  label: string
  name: string
  color: string
  gym: ExItem[]
  home: ExItem[]
}

export const VOLUME = {
  beginner:     { sets: '2–3', reps: '12–15', rest: '60s',  tag: 'Iniciante',     tagBg: 'rgba(5,150,105,0.1)',   tagColor: '#047857' },
  intermediate: { sets: '3–4', reps: '8–12',  rest: '90s',  tag: 'Intermediário', tagBg: 'rgba(124,58,237,0.1)', tagColor: '#6D28D9' },
  advanced:     { sets: '4–5', reps: '6–10',  rest: '2min', tag: 'Avançado',      tagBg: 'rgba(220,38,38,0.1)',  tagColor: '#B91C1C' },
}

export const SPLIT_LABEL: Record<WorkoutDays, string> = {
  2: 'Full Body A/B',
  3: 'Divisão ABC',
  4: 'Divisão ABCD',
  5: 'Divisão ABCDE',
}

export type SplitKey = `${WorkoutDays}_${'M' | 'F'}`

export const SPLITS: Record<SplitKey, WorkoutDay[]> = {
  // ── 2 dias ────────────────────────────────────────────────────────────────
  '2_M': [
    {
      label: 'A', name: 'Empurrar + Core', color: '#059669',
      gym: [
        { name: 'Supino reto com barra', tip: 'Desça a barra até o peito' },
        { name: 'Desenvolvimento militar', tip: 'Core contraído, sem arquear lombar' },
        { name: 'Tríceps polia (corda)', tip: 'Cotovelos fixos ao lado do corpo' },
        { name: 'Leg press 45°', tip: 'Joelhos alinhados com os pés' },
        { name: 'Prancha abdominal', tip: '3 × 30–45s' },
      ],
      home: [
        { name: 'Flexão aberta (foco peitoral)', tip: 'Peito quase toca o chão' },
        { name: 'Flexão declinada (pés na cadeira)', tip: 'Foco no alto do peitoral' },
        { name: 'Tríceps banco', tip: 'Desça até 90° no cotovelo' },
        { name: 'Agachamento livre', tip: 'Calcanhar no chão, profundidade paralela' },
        { name: 'Prancha abdominal', tip: '3 × 30–45s' },
      ],
    },
    {
      label: 'B', name: 'Puxar + Posterior', color: '#7C3AED',
      gym: [
        { name: 'Puxador frontal (pegada aberta)', tip: 'Puxe pelo cotovelo, não pela mão' },
        { name: 'Remada curvada com barra', tip: 'Tronco a 45°, barra ao umbigo' },
        { name: 'Rosca direta com barra', tip: 'Cotovelos fixos' },
        { name: 'Levantamento terra romeno', tip: 'Quadril para trás, costas neutras' },
        { name: 'Panturrilha (step ou máquina)', tip: 'Amplitude completa' },
      ],
      home: [
        { name: 'Remada invertida (embaixo de mesa)', tip: 'Peito para a mesa, cotovelos atrás' },
        { name: 'Remada com elástico', tip: 'Puxe os cotovelos para trás' },
        { name: 'Rosca direta com halteres', tip: 'Supinação completa no topo' },
        { name: 'Stiff com halteres', tip: 'Sinta o alongamento dos isquiotibiais' },
        { name: 'Elevação de panturrilha unipodalhar', tip: 'Amplitude máxima' },
      ],
    },
  ],
  '2_F': [
    {
      label: 'A', name: 'Glúteos + Pernas', color: '#EC4899',
      gym: [
        { name: 'Hip thrust com barra', tip: 'Esprema o glúteo 2s no topo' },
        { name: 'Agachamento livre', tip: 'Profundidade paralela ou abaixo' },
        { name: 'Stiff com barra', tip: 'Quadril para trás, sinta glúteo e isquio' },
        { name: 'Abdução no cabo ou máquina', tip: 'Glúteo médio' },
        { name: 'Leg press (pegada alta e larga)', tip: 'Ativa mais o glúteo' },
      ],
      home: [
        { name: 'Agachamento livre', tip: 'Profundidade paralela' },
        { name: 'Agachamento búlgaro', tip: 'Pé traseiro na cadeira, desça reto' },
        { name: 'Ponte de glúteos unipodal', tip: 'Uma perna no ar, esprema no topo' },
        { name: 'Abdução com elástico (deitada)', tip: 'Elástico acima dos joelhos' },
        { name: 'Donkey kick com elástico', tip: 'Quadril estável, só mova a perna' },
      ],
    },
    {
      label: 'B', name: 'Superior + Core', color: '#7C3AED',
      gym: [
        { name: 'Supino inclinado com halteres', tip: 'Toque os halteres no peito' },
        { name: 'Puxador frontal', tip: 'Foco em puxar pelo cotovelo' },
        { name: 'Remada unilateral com halter', tip: 'Coluna neutra, costas paralelas' },
        { name: 'Desenvolvimento com halteres', tip: 'Não trave o cotovelo no topo' },
        { name: 'Prancha + abdominal bicicleta', tip: '3 × 20 lentos' },
      ],
      home: [
        { name: 'Flexão adaptada ou completa', tip: 'Progrida para flexão completa' },
        { name: 'Remada com elástico', tip: 'Cotovelos puxados para trás' },
        { name: 'Desenvolvimento com halteres', tip: 'Sentada ou em pé' },
        { name: 'Rosca alternada com halteres', tip: 'Supinação completa no topo' },
        { name: 'Abdominal bicicleta', tip: '3 × 20 (lento e controlado)' },
      ],
    },
  ],

  // ── 3 dias ────────────────────────────────────────────────────────────────
  '3_M': [
    {
      label: 'A', name: 'Peito + Tríceps', color: '#059669',
      gym: [
        { name: 'Supino reto com barra' },
        { name: 'Supino inclinado com halteres' },
        { name: 'Crossover no cabo' },
        { name: 'Tríceps polia (corda)' },
        { name: 'Tríceps francês com barra EZ' },
      ],
      home: [
        { name: 'Flexão aberta (peitoral)' },
        { name: 'Flexão inclinada (pés na cadeira)' },
        { name: 'Flexão diamante', tip: 'Mãos em triângulo — foco tríceps' },
        { name: 'Tríceps banco' },
        { name: 'Flexão archer (carga unilateral)', tip: 'Avançado' },
      ],
    },
    {
      label: 'B', name: 'Costas + Bíceps', color: '#7C3AED',
      gym: [
        { name: 'Puxador frontal (pegada aberta)' },
        { name: 'Remada curvada com barra' },
        { name: 'Remada unilateral com halter' },
        { name: 'Rosca direta com barra' },
        { name: 'Rosca martelo com halteres' },
      ],
      home: [
        { name: 'Pull-up na barra', tip: 'Use elástico de auxílio se necessário' },
        { name: 'Remada invertida (embaixo de mesa)' },
        { name: 'Remada com elástico (pegada aberta)' },
        { name: 'Rosca direta com halteres' },
        { name: 'Rosca martelo' },
      ],
    },
    {
      label: 'C', name: 'Pernas + Core', color: '#0EA5E9',
      gym: [
        { name: 'Agachamento livre com barra' },
        { name: 'Leg press 45°' },
        { name: 'Stiff com barra' },
        { name: 'Cadeira extensora' },
        { name: 'Panturrilha em pé (máquina)' },
      ],
      home: [
        { name: 'Agachamento livre' },
        { name: 'Agachamento búlgaro' },
        { name: 'Stiff com halteres' },
        { name: 'Avanço alternado' },
        { name: 'Panturrilha unipodalhar no step' },
      ],
    },
  ],
  '3_F': [
    {
      label: 'A', name: 'Glúteos + Isquios', color: '#EC4899',
      gym: [
        { name: 'Hip thrust com barra', tip: '2s no topo' },
        { name: 'Agachamento profundo com barra' },
        { name: 'Stiff com barra' },
        { name: 'Abdução no cabo ou máquina' },
        { name: 'Leg press pegada alta e larga' },
      ],
      home: [
        { name: 'Ponte de glúteos unipodal', tip: 'Uma perna no ar' },
        { name: 'Agachamento búlgaro' },
        { name: 'Stiff com halteres' },
        { name: 'Donkey kick com elástico' },
        { name: 'Abdução com elástico deitada' },
      ],
    },
    {
      label: 'B', name: 'Peito + Costas + Ombros', color: '#7C3AED',
      gym: [
        { name: 'Supino inclinado com halteres' },
        { name: 'Puxador frontal' },
        { name: 'Remada curvada com halteres' },
        { name: 'Desenvolvimento com halteres' },
        { name: 'Elevação lateral (ombro medial)' },
      ],
      home: [
        { name: 'Flexão adaptada ou completa' },
        { name: 'Remada invertida' },
        { name: 'Remada com elástico' },
        { name: 'Desenvolvimento com halteres' },
        { name: 'Elevação lateral com halteres leves' },
      ],
    },
    {
      label: 'C', name: 'Pernas + Core', color: '#059669',
      gym: [
        { name: 'Avanço com halteres' },
        { name: 'Cadeira flexora deitada' },
        { name: 'Cadeira extensora' },
        { name: 'Levantamento terra romeno' },
        { name: 'Prancha + abdominal bicicleta' },
      ],
      home: [
        { name: 'Avanço alternado' },
        { name: 'Agachamento sumô com halter' },
        { name: 'Elevação de quadril com elástico' },
        { name: 'Passada lateral (lateral lunge)' },
        { name: 'Prancha + abdominal bicicleta' },
      ],
    },
  ],

  // ── 4 dias ────────────────────────────────────────────────────────────────
  '4_M': [
    {
      label: 'A', name: 'Peito + Tríceps', color: '#059669',
      gym: [
        { name: 'Supino reto com barra' },
        { name: 'Supino inclinado com halteres' },
        { name: 'Crossover no cabo (baixo para cima)' },
        { name: 'Tríceps polia (corda)' },
        { name: 'Tríceps francês com halteres' },
      ],
      home: [
        { name: 'Flexão aberta' },
        { name: 'Flexão inclinada (pés na cadeira)' },
        { name: 'Flexão diamante (tríceps)' },
        { name: 'Tríceps banco' },
        { name: 'Flexão pike (ombros)', tip: 'Simula desenvolvimento' },
      ],
    },
    {
      label: 'B', name: 'Costas + Bíceps', color: '#7C3AED',
      gym: [
        { name: 'Puxador frontal (pegada aberta)' },
        { name: 'Remada curvada com barra' },
        { name: 'Remada cavalinho / T-bar' },
        { name: 'Rosca direta com barra' },
        { name: 'Rosca concentrada com halter' },
      ],
      home: [
        { name: 'Pull-up na barra' },
        { name: 'Remada invertida' },
        { name: 'Remada com elástico (pegada larga)' },
        { name: 'Rosca direta com halteres' },
        { name: 'Rosca martelo' },
      ],
    },
    {
      label: 'C', name: 'Pernas', color: '#0EA5E9',
      gym: [
        { name: 'Agachamento livre com barra' },
        { name: 'Leg press 45°' },
        { name: 'Stiff com barra' },
        { name: 'Cadeira extensora' },
        { name: 'Cadeira flexora deitada' },
      ],
      home: [
        { name: 'Agachamento livre' },
        { name: 'Agachamento búlgaro' },
        { name: 'Stiff unipodal com halter' },
        { name: 'Avanço alternado' },
        { name: 'Agachamento sumô com halter' },
      ],
    },
    {
      label: 'D', name: 'Ombros + Core', color: '#F59E0B',
      gym: [
        { name: 'Desenvolvimento militar com barra' },
        { name: 'Elevação lateral com halteres' },
        { name: 'Elevação frontal com anilha' },
        { name: 'Face pull no cabo' },
        { name: 'Prancha 3 × 45s' },
      ],
      home: [
        { name: 'Desenvolvimento com halteres' },
        { name: 'Elevação lateral com halteres' },
        { name: 'Elevação frontal com halteres' },
        { name: 'Flexão pike (ombros)' },
        { name: 'Prancha + rotação de tronco' },
      ],
    },
  ],
  '4_F': [
    {
      label: 'A', name: 'Glúteos', color: '#EC4899',
      gym: [
        { name: 'Hip thrust com barra', tip: '2s no topo' },
        { name: 'Agachamento profundo com barra' },
        { name: 'Abdução no cabo' },
        { name: 'Kickback no cabo' },
        { name: 'Stiff unipodal com halter' },
      ],
      home: [
        { name: 'Ponte de glúteos unipodal' },
        { name: 'Donkey kick com elástico' },
        { name: 'Abdução deitada com elástico' },
        { name: 'Agachamento búlgaro' },
        { name: 'Elevação de quadril com elástico' },
      ],
    },
    {
      label: 'B', name: 'Peito + Tríceps', color: '#059669',
      gym: [
        { name: 'Supino inclinado com halteres' },
        { name: 'Crossover no cabo' },
        { name: 'Tríceps polia (corda)' },
        { name: 'Tríceps banco com barra' },
        { name: 'Elevação lateral (finalizador)' },
      ],
      home: [
        { name: 'Flexão adaptada ou completa' },
        { name: 'Flexão inclinada (pés na cadeira)' },
        { name: 'Tríceps banco' },
        { name: 'Tríceps com halter (testa deitada)' },
        { name: 'Elevação lateral com halteres' },
      ],
    },
    {
      label: 'C', name: 'Pernas + Panturrilha', color: '#0EA5E9',
      gym: [
        { name: 'Leg press (pegada alta)' },
        { name: 'Stiff com barra' },
        { name: 'Cadeira flexora deitada' },
        { name: 'Cadeira extensora' },
        { name: 'Panturrilha em pé (máquina)' },
      ],
      home: [
        { name: 'Agachamento livre' },
        { name: 'Stiff com halteres' },
        { name: 'Avanço lateral (lateral lunge)' },
        { name: 'Agachamento sumô com halter' },
        { name: 'Panturrilha unipodalhar' },
      ],
    },
    {
      label: 'D', name: 'Costas + Bíceps', color: '#7C3AED',
      gym: [
        { name: 'Puxador frontal' },
        { name: 'Remada unilateral com halter' },
        { name: 'Remada curvada com halteres' },
        { name: 'Rosca direta com halteres' },
        { name: 'Rosca martelo' },
      ],
      home: [
        { name: 'Remada invertida' },
        { name: 'Remada com elástico' },
        { name: 'Pull-up assistida com elástico' },
        { name: 'Rosca direta com halteres' },
        { name: 'Rosca martelo' },
      ],
    },
  ],

  // ── 5 dias ────────────────────────────────────────────────────────────────
  '5_M': [
    {
      label: 'A', name: 'Peito', color: '#059669',
      gym: [
        { name: 'Supino reto com barra' },
        { name: 'Supino inclinado com halteres' },
        { name: 'Supino declinado' },
        { name: 'Crossover no cabo' },
        { name: 'Pull-over com halter' },
      ],
      home: [
        { name: 'Flexão aberta' },
        { name: 'Flexão inclinada (pés na cadeira)' },
        { name: 'Flexão declinada' },
        { name: 'Flexão com pausa no ponto de estiramento' },
        { name: 'Flexão pike (ombro/alto peito)' },
      ],
    },
    {
      label: 'B', name: 'Costas', color: '#7C3AED',
      gym: [
        { name: 'Barra fixa (pull-up)' },
        { name: 'Remada curvada com barra' },
        { name: 'Puxador frontal' },
        { name: 'Remada cavalinho / T-bar' },
        { name: 'Remada unilateral com halter' },
      ],
      home: [
        { name: 'Pull-up na barra (pegada aberta)' },
        { name: 'Pull-up com pegada supinada' },
        { name: 'Remada invertida (embaixo de mesa)' },
        { name: 'Remada com elástico (pegada aberta)' },
        { name: 'Superman deitado', tip: 'Ativa lombar e eretor da coluna' },
      ],
    },
    {
      label: 'C', name: 'Pernas', color: '#0EA5E9',
      gym: [
        { name: 'Agachamento livre com barra' },
        { name: 'Leg press 45°' },
        { name: 'Stiff com barra' },
        { name: 'Cadeira extensora' },
        { name: 'Cadeira flexora deitada' },
      ],
      home: [
        { name: 'Agachamento livre' },
        { name: 'Agachamento búlgaro' },
        { name: 'Stiff unipodal com halter' },
        { name: 'Avanço alternado' },
        { name: 'Agachamento sumô com halter' },
      ],
    },
    {
      label: 'D', name: 'Ombros', color: '#F59E0B',
      gym: [
        { name: 'Desenvolvimento militar com barra' },
        { name: 'Elevação lateral com halteres' },
        { name: 'Elevação frontal com anilha' },
        { name: 'Face pull no cabo' },
        { name: 'Encolhimento com halteres (trapézio)' },
      ],
      home: [
        { name: 'Desenvolvimento com halteres' },
        { name: 'Elevação lateral com halteres' },
        { name: 'Elevação frontal com halteres' },
        { name: 'Flexão pike' },
        { name: 'Encolhimento com halteres' },
      ],
    },
    {
      label: 'E', name: 'Bíceps + Tríceps', color: '#DC2626',
      gym: [
        { name: 'Rosca direta com barra' },
        { name: 'Rosca concentrada com halter' },
        { name: 'Tríceps polia (corda)' },
        { name: 'Tríceps francês com barra EZ' },
        { name: 'Rosca 21 (finalizador)' },
      ],
      home: [
        { name: 'Rosca direta com halteres' },
        { name: 'Rosca martelo' },
        { name: 'Tríceps banco' },
        { name: 'Flexão diamante' },
        { name: 'Rosca concentrada com halter' },
      ],
    },
  ],
  '5_F': [
    {
      label: 'A', name: 'Glúteos', color: '#EC4899',
      gym: [
        { name: 'Hip thrust com barra', tip: '2s no topo' },
        { name: 'Agachamento profundo com barra' },
        { name: 'Abdução no cabo' },
        { name: 'Kickback no cabo' },
        { name: 'Stiff unipodal com halter' },
      ],
      home: [
        { name: 'Ponte de glúteos unipodal' },
        { name: 'Donkey kick com elástico' },
        { name: 'Abdução deitada com elástico' },
        { name: 'Agachamento búlgaro' },
        { name: 'Elevação de quadril com elástico' },
      ],
    },
    {
      label: 'B', name: 'Pernas', color: '#0EA5E9',
      gym: [
        { name: 'Leg press (pegada alta)' },
        { name: 'Cadeira flexora deitada' },
        { name: 'Cadeira extensora' },
        { name: 'Avanço com halteres' },
        { name: 'Panturrilha em pé' },
      ],
      home: [
        { name: 'Agachamento livre' },
        { name: 'Avanço alternado' },
        { name: 'Agachamento sumô com halter' },
        { name: 'Agachamento lateral (cossack squat)' },
        { name: 'Panturrilha unipodalhar' },
      ],
    },
    {
      label: 'C', name: 'Peito + Costas', color: '#7C3AED',
      gym: [
        { name: 'Supino inclinado com halteres' },
        { name: 'Puxador frontal' },
        { name: 'Remada unilateral com halter' },
        { name: 'Crossover no cabo' },
        { name: 'Remada curvada com halteres' },
      ],
      home: [
        { name: 'Flexão adaptada ou completa' },
        { name: 'Remada invertida' },
        { name: 'Remada com elástico (pegada aberta)' },
        { name: 'Flexão inclinada (pés na cadeira)' },
        { name: 'Superman deitado' },
      ],
    },
    {
      label: 'D', name: 'Glúteos 2 + Isquios', color: '#F97316',
      gym: [
        { name: 'Levantamento terra romeno' },
        { name: 'Cadeira flexora deitada' },
        { name: 'Leg press pegada alta (foco isquio)' },
        { name: 'Ponte de glúteos no banco' },
        { name: 'Elevação de quadril unipodal' },
      ],
      home: [
        { name: 'Stiff com halteres' },
        { name: 'Ponte de glúteos com pés elevados' },
        { name: 'Elevação de quadril unipodal' },
        { name: 'Donkey kick (variação com isquio)' },
        { name: 'Stiff unipodal' },
      ],
    },
    {
      label: 'E', name: 'Ombros + Braços + Core', color: '#059669',
      gym: [
        { name: 'Desenvolvimento com halteres' },
        { name: 'Elevação lateral com halteres' },
        { name: 'Rosca direta com halteres' },
        { name: 'Tríceps polia (corda)' },
        { name: 'Prancha + abdominal bicicleta' },
      ],
      home: [
        { name: 'Desenvolvimento com halteres' },
        { name: 'Elevação lateral com halteres' },
        { name: 'Rosca direta com halteres' },
        { name: 'Tríceps banco' },
        { name: 'Prancha + abdominal bicicleta' },
      ],
    },
  ],
}

// ── Day icon map ─────────────────────────────────────────────────────────────
export const DAY_ICON_MAP: Record<string, React.ReactNode> = {
  A: <Dumbbell  size={18} strokeWidth={2} />,
  B: <Activity  size={18} strokeWidth={2} />,
  C: <ArrowDown size={18} strokeWidth={2} />,
  D: <Zap       size={18} strokeWidth={2} />,
  E: <Sparkles  size={18} strokeWidth={2} />,
}
