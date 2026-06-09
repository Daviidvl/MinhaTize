import { useState } from 'react'
import {
  Dumbbell, Activity, ArrowDown, Zap, Sparkles,
  Droplets, Moon, Waves, Lightbulb, Info,
  RotateCcw, ChevronDown, BarChart2,
} from 'lucide-react'

type Sex = 'M' | 'F'
type Level = 'beginner' | 'intermediate' | 'advanced'
type Location = 'gym' | 'home'
type WorkoutDays = 2 | 3 | 4 | 5

interface WorkoutProfile {
  sex: Sex
  level: Level
  location: Location
  days: WorkoutDays
}

interface ExItem {
  name: string
  tip?: string
}

interface WorkoutDay {
  label: string
  name: string
  color: string
  gym: ExItem[]
  home: ExItem[]
}

const STORAGE_KEY = 'tizetrack_workout'

const VOLUME = {
  beginner:     { sets: '2–3', reps: '12–15', rest: '60s',  tag: 'Iniciante',     tagBg: 'rgba(5,150,105,0.1)',   tagColor: '#047857' },
  intermediate: { sets: '3–4', reps: '8–12',  rest: '90s',  tag: 'Intermediário', tagBg: 'rgba(124,58,237,0.1)', tagColor: '#6D28D9' },
  advanced:     { sets: '4–5', reps: '6–10',  rest: '2min', tag: 'Avançado',      tagBg: 'rgba(220,38,38,0.1)',  tagColor: '#B91C1C' },
}

const SPLIT_LABEL: Record<WorkoutDays, string> = {
  2: 'Full Body A/B',
  3: 'Divisão ABC',
  4: 'Divisão ABCD',
  5: 'Divisão ABCDE',
}

type SplitKey = `${WorkoutDays}_${'M' | 'F'}`

const SPLITS: Record<SplitKey, WorkoutDay[]> = {
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
const DAY_ICON_MAP: Record<string, React.ReactNode> = {
  A: <Dumbbell  size={18} strokeWidth={2} />,
  B: <Activity  size={18} strokeWidth={2} />,
  C: <ArrowDown size={18} strokeWidth={2} />,
  D: <Zap       size={18} strokeWidth={2} />,
  E: <Sparkles  size={18} strokeWidth={2} />,
}

// ── Small helpers ────────────────────────────────────────────────────────────

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: '12px', cursor: 'pointer',
        fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 700, fontSize: '13px',
        border: active ? '2px solid var(--primary)' : '1.5px solid var(--border)',
        background: active ? 'var(--primary-light)' : 'var(--surface-2)',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Exercise() {
  const [profile, setProfile] = useState<WorkoutProfile | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') }
    catch { return null }
  })

  const [form, setForm] = useState<Partial<WorkoutProfile>>(profile ?? {})
  const [showForm, setShowForm] = useState(profile === null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['A']))

  const formComplete = !!(form.sex && form.level && form.location && form.days)

  function saveProfile() {
    if (!formComplete) return
    const p = form as WorkoutProfile
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    setProfile(p)
    setShowForm(false)
    setExpandedDays(new Set(['A']))
  }

  function resetProfile() {
    localStorage.removeItem(STORAGE_KEY)
    setProfile(null)
    setForm({})
    setShowForm(true)
  }

  function toggleDay(label: string) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const splitDays = profile
    ? SPLITS[`${profile.days}_${profile.sex}` as SplitKey]
    : []
  const vol = profile ? VOLUME[profile.level] : null

  // ── Render: form ──────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
          borderRadius: '20px', padding: '18px 20px', color: '#fff',
          boxShadow: 'var(--shadow-green)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Avaliação de treino
          </p>
          <p style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '8px' }}>
            Treino personalizado para o seu perfil
          </p>
          <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
            Responda as perguntas abaixo e receba um plano adequado ao seu nível, dias disponíveis e local de treino.
          </p>
        </div>

        {/* Form card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Sexo */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Sexo biológico
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill active={form.sex === 'M'} onClick={() => setForm(f => ({ ...f, sex: 'M' }))}>Masculino</Pill>
              <Pill active={form.sex === 'F'} onClick={() => setForm(f => ({ ...f, sex: 'F' }))}>Feminino</Pill>
            </div>
          </div>

          {/* Nível */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Nível de experiência
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill active={form.level === 'beginner'}     onClick={() => setForm(f => ({ ...f, level: 'beginner' }))}>Iniciante</Pill>
              <Pill active={form.level === 'intermediate'} onClick={() => setForm(f => ({ ...f, level: 'intermediate' }))}>Intermediário</Pill>
              <Pill active={form.level === 'advanced'}     onClick={() => setForm(f => ({ ...f, level: 'advanced' }))}>Avançado</Pill>
            </div>
          </div>

          {/* Local */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Local de treino
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill active={form.location === 'gym'}  onClick={() => setForm(f => ({ ...f, location: 'gym' }))}>Academia</Pill>
              <Pill active={form.location === 'home'} onClick={() => setForm(f => ({ ...f, location: 'home' }))}>Em casa</Pill>
            </div>
          </div>

          {/* Dias */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              Dias disponíveis por semana
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([2, 3, 4, 5] as WorkoutDays[]).map(d => (
                <Pill key={d} active={form.days === d} onClick={() => setForm(f => ({ ...f, days: d }))}>
                  {d}×
                </Pill>
              ))}
            </div>
            {form.days && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '7px' }}>
                {form.days === 2 && 'Full Body A/B — treinar dias alternados (ex: Seg e Qui)'}
                {form.days === 3 && 'Divisão ABC — cada grupo muscular 1× por semana'}
                {form.days === 4 && 'Divisão ABCD — mais volume, boa frequência por grupo'}
                {form.days === 5 && 'Divisão ABCDE — foco máximo por músculo por sessão'}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={saveProfile}
            disabled={!formComplete}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 800, fontSize: '15px',
              cursor: formComplete ? 'pointer' : 'not-allowed',
              background: formComplete ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' : 'var(--surface-3)',
              color: formComplete ? '#fff' : 'var(--text-muted)',
              opacity: formComplete ? 1 : 0.6,
              transition: 'all 0.2s',
              boxShadow: formComplete ? 'var(--shadow-green)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Dumbbell size={16} strokeWidth={2.5} />
            Gerar Meu Plano
          </button>
        </div>

        <div className="card-warning">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
            <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
              Os treinos são sugestões educativas e não substituem a orientação de um educador físico. Em caso de dores ou sintomas durante o exercício, interrompa e consulte seu médico.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: plan ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Plan header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #0D9488 100%)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: 'var(--shadow-green)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Seu plano personalizado
        </p>
        <p style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '10px' }}>
          {profile!.days}× por semana · {SPLIT_LABEL[profile!.days]}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            profile!.sex === 'M' ? 'Masculino' : 'Feminino',
            vol!.tag,
            profile!.location === 'gym' ? 'Academia' : 'Em casa',
          ].map(tag => (
            <span key={tag} style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px',
              background: 'rgba(255,255,255,0.18)', color: '#fff',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Volume info */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
          <BarChart2 size={14} strokeWidth={2} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Volume recomendado</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Séries', value: vol!.sets },
            { label: 'Repetições', value: vol!.reps },
            { label: 'Descanso', value: vol!.rest },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--surface-2)', borderRadius: '10px', padding: '8px',
              textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{item.value}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day cards */}
      {splitDays.map(day => {
        const isOpen = expandedDays.has(day.label)
        const exercises = profile!.location === 'gym' ? day.gym : day.home
        return (
          <div key={day.label} style={{
            borderRadius: '16px', overflow: 'hidden',
            border: `1.5px solid ${isOpen ? `${day.color}30` : 'var(--border)'}`,
            background: isOpen ? `${day.color}06` : 'var(--surface)',
            transition: 'all 0.2s', boxShadow: 'var(--shadow-card)',
          }}>
            <button
              onClick={() => toggleDay(day.label)}
              style={{
                width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                textAlign: 'left', fontFamily: "Inter, -apple-system, sans-serif",
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: `${day.color}18`, border: `1px solid ${day.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '2px', color: day.color,
              }}>
                {DAY_ICON_MAP[day.label] ?? <Dumbbell size={18} strokeWidth={2} />}
                <span style={{ fontSize: '9px', fontWeight: 900, color: day.color, letterSpacing: '0.05em' }}>
                  {day.label}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                  Treino {day.label} — {day.name}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {exercises.length} exercícios · {vol!.sets} séries
                </p>
              </div>
              <span style={{
                flexShrink: 0, color: 'var(--text-muted)',
                transition: 'transform 0.2s', display: 'inline-flex',
                transform: isOpen ? 'rotate(180deg)' : 'none',
              }}><ChevronDown size={16} strokeWidth={2} /></span>
            </button>

            {isOpen && (
              <div style={{
                padding: '0 14px 14px',
                borderTop: `1px solid ${day.color}20`,
                display: 'flex', flexDirection: 'column', gap: '7px',
              }}>
                {exercises.map((ex, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '9px 12px', borderRadius: '11px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <span style={{
                      minWidth: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                      background: `${day.color}20`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '10px', fontWeight: 900,
                      color: day.color, marginTop: '1px',
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {ex.name}
                      </p>
                      {ex.tip && (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start', marginTop: '3px' }}>
                          <Lightbulb size={11} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-muted)' }} />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>{ex.tip}</p>
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: day.color,
                      background: `${day.color}15`, padding: '2px 7px', borderRadius: '99px',
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {vol!.sets}×{vol!.reps.split('–')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Tips */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Lightbulb size={14} strokeWidth={2} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>Dicas práticas</p>
        </div>
        {[
          { icon: <Droplets size={14} strokeWidth={2} />, text: 'Hidratação: aumente a ingestão de água nos dias de treino' },
          { icon: <Dumbbell size={14} strokeWidth={2} />, text: 'Proteína pós-treino: 20–30g auxilia na recuperação muscular' },
          { icon: <Moon     size={14} strokeWidth={2} />, text: 'Sono: ao menos 7h para o corpo recuperar e recompor a massa' },
          { icon: <Waves    size={14} strokeWidth={2} />, text: 'Sintomas de GLP-1? Caminhada leve de 15 min já é válida e benéfica' },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
            <span style={{ flexShrink: 0, marginTop: '1px' }}>{t.icon}</span>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{t.text}</p>
          </div>
        ))}
      </div>

      {/* Refazer */}
      <button
        onClick={resetProfile}
        style={{
          width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)',
          background: 'var(--surface-2)', cursor: 'pointer',
          fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 700, fontSize: '13px',
          color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        }}
      >
        <RotateCcw size={14} strokeWidth={2} />
        Refazer avaliação
      </button>

      <div className="card-warning">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
          <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
            Os treinos são sugestões educativas e não substituem a orientação de um educador físico. Em caso de dores ou sintomas durante o exercício, interrompa e consulte seu médico.
          </p>
        </div>
      </div>
    </div>
  )
}
