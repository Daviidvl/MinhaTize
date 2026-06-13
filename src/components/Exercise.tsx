import { useState } from 'react'
import {
  Dumbbell, Activity, ArrowDown, Zap, Sparkles,
  Droplets, Moon, Waves, Lightbulb, Info,
  RotateCcw, ChevronDown, BarChart2, Check, Flame,
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
  preferredDays: number[]  // 0=Dom … 6=Sáb
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
const LOG_KEY     = 'tizetrack_workout_log'

const DAY_INITIALS  = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DAY_NAMES     = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_FULL      = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getWeekDays(): Date[] {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function calcStreak(log: string[]): number {
  if (log.length === 0) return 0
  let streak = 0
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  sunday.setHours(0, 0, 0, 0)

  for (let w = 0; w <= 52; w++) {
    const weekStart = new Date(sunday)
    weekStart.setDate(sunday.getDate() - w * 7)
    let done = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      if (d > now) continue
      if (log.includes(toDateStr(d))) done++
    }
    if (done > 0) streak++
    else if (w > 0) break
  }
  return streak
}

function getMotivation(done: number, target: number, streak: number): string {
  if (streak >= 12) return 'Três meses seguidos. Isso é transformação de verdade.'
  if (streak >= 8)  return `${streak} semanas sem parar. Você é extraordinária!`
  if (streak >= 4)  return `${streak} semanas de constância. O hábito já está formado.`
  if (streak >= 2)  return `${streak} semanas seguidas. Continue assim.`
  if (done === 0)   return 'A primeira marcação da semana faz toda a diferença.'
  if (done > target) return 'Além da meta. Que dedicação essa semana.'
  if (done >= target) return 'Meta da semana batida. Você arrasou.'
  if (done === 1)   return 'Primeiro treino da semana. Ótimo começo.'
  if (done === 2)   return 'Dois treinos marcados. Você está no ritmo!'
  if (done === target - 1) return 'Falta só um treino para bater a meta da semana.'
  return `${done} treinos essa semana. Siga em frente.`
}

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
        border: active ? '2px solid #22C55E' : '1.5px solid var(--border)',
        background: active ? 'rgba(34,197,94,0.12)' : 'var(--surface-2)',
        color: active ? '#22C55E' : 'var(--text-secondary)',
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

  const formComplete = !!(
    form.sex && form.level && form.location && form.days &&
    form.preferredDays?.length === form.days
  )

  function togglePreferredDay(idx: number) {
    setForm(f => {
      const prev = f.preferredDays ?? []
      const next = prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
      return { ...f, preferredDays: next }
    })
  }

  const [workoutLog, setWorkoutLog] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') }
    catch { return [] }
  })

  function toggleLog(date: string) {
    setWorkoutLog(prev => {
      const next = prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
      localStorage.setItem(LOG_KEY, JSON.stringify(next))
      return next
    })
  }

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
          background: 'linear-gradient(155deg, #0C1F18 0%, #132D22 60%, #0F2219 100%)',
          borderRadius: '20px', padding: '18px 20px', color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
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

          {/* Dias da semana */}
          {form.days && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                Quais dias você costuma treinar?
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Selecione exatamente <strong>{form.days}</strong> dia{form.days > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                {DAY_NAMES.map((name, idx) => {
                  const sel = (form.preferredDays ?? []).includes(idx)
                  const full = (form.preferredDays ?? []).length >= form.days! && !sel
                  return (
                    <button
                      key={idx}
                      onClick={() => !full && togglePreferredDay(idx)}
                      style={{
                        flex: 1, paddingTop: '8px', paddingBottom: '8px',
                        borderRadius: '10px', cursor: full ? 'not-allowed' : 'pointer',
                        fontFamily: "Inter, -apple-system, sans-serif",
                        fontWeight: 700, fontSize: '11px',
                        border: sel ? '2px solid #22C55E' : '1.5px solid var(--border)',
                        background: sel ? 'rgba(34,197,94,0.12)' : 'var(--surface-2)',
                        color: sel ? '#22C55E' : full ? 'var(--text-muted)' : 'var(--text-secondary)',
                        opacity: full ? 0.45 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              {(form.preferredDays?.length ?? 0) > 0 && (form.preferredDays?.length ?? 0) < form.days && (
                <p style={{ fontSize: '11px', color: '#22C55E', marginTop: '7px' }}>
                  {form.days - (form.preferredDays?.length ?? 0)} dia{form.days - (form.preferredDays?.length ?? 0) > 1 ? 's' : ''} restante{form.days - (form.preferredDays?.length ?? 0) > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={saveProfile}
            disabled={!formComplete}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 800, fontSize: '15px',
              cursor: formComplete ? 'pointer' : 'not-allowed',
              background: formComplete ? 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)' : 'var(--surface-3)',
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
        background: 'linear-gradient(155deg, #0C1F18 0%, #132D22 60%, #0F2219 100%)',
        borderRadius: '20px', padding: '18px 20px', color: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden',
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

      {/* Weekly calendar */}
      {(() => {
        const preferred   = profile!.preferredDays ?? []
        const weekDays    = getWeekDays()
        const todayStr    = toDateStr(new Date())
        const doneThisWeek = weekDays.filter(d => workoutLog.includes(toDateStr(d))).length
        const streak       = calcStreak(workoutLog)

        return (
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Flame size={14} strokeWidth={2} style={{ color: '#22C55E', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Semana de treino
              </p>
            </div>

            {/* Day circles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              {weekDays.map((d, i) => {
                const ds       = toDateStr(d)
                const isPref   = preferred.includes(d.getDay())
                const isDone   = workoutLog.includes(ds)
                const isToday  = ds === todayStr
                let bg        = isPref ? 'var(--surface-2)' : 'transparent'
                let border    = isPref ? '1.5px solid var(--border)' : '1px dashed var(--border)'
                let color     = isPref ? 'var(--text-secondary)' : 'var(--text-muted)'
                let showCheck = false
                let pulsing   = false

                if (isDone) {
                  bg = '#22C55E'; border = '1.5px solid #22C55E'
                  color = '#fff'; showCheck = true
                } else if (isToday) {
                  border = '2px solid #22C55E'; color = '#22C55E'
                  bg = 'transparent'; pulsing = true
                }

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => toggleLog(ds)}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: bg, border, color,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "Inter, -apple-system, sans-serif",
                        animation: pulsing ? 'pulse-ring 1.8s ease-in-out infinite' : 'none',
                        transition: 'all 0.18s', flexShrink: 0,
                      }}
                    >
                      {showCheck
                        ? <Check size={16} strokeWidth={3} />
                        : <span style={{ fontSize: '12px', fontWeight: 700 }}>{DAY_INITIALS[i]}</span>
                      }
                    </button>
                    <span style={{
                      width: '4px', height: '4px', borderRadius: '50%', display: 'block',
                      background: isPref ? '#22C55E' : 'transparent',
                      opacity: isDone ? 0 : 0.6,
                    }} />
                  </div>
                )
              })}
            </div>

            {/* Stats */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doneThisWeek}</span>
              {doneThisWeek === 1 ? ' treino' : ' treinos'} essa semana
              {streak > 0 && (
                <>
                  {' · '}
                  <span style={{ fontWeight: 700, color: '#22C55E' }}>{streak}</span>
                  {streak === 1 ? ' semana consecutiva' : ' semanas consecutivas'}
                </>
              )}
            </p>

            {/* Motivational message */}
            <div style={{
              padding: '9px 12px', borderRadius: '12px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {getMotivation(doneThisWeek, profile!.days, streak)}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Volume info */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
          <BarChart2 size={14} strokeWidth={2} style={{ color: '#22C55E', flexShrink: 0 }} />
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
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#22C55E', margin: 0 }}>{item.value}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day cards */}
      {(() => {
        const sorted = [...(profile!.preferredDays ?? [])].sort((a, b) => a - b)
        return splitDays.map((day, dayIdx) => {
        const isOpen = expandedDays.has(day.label)
        const exercises = profile!.location === 'gym' ? day.gym : day.home
        const dayName = sorted[dayIdx] !== undefined ? DAY_FULL[sorted[dayIdx]] : null
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
                  {dayName && <span style={{ color: day.color, fontWeight: 700 }}>{dayName} · </span>}
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
      })
      })()}

      {/* Tips */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Lightbulb size={14} strokeWidth={2} style={{ color: '#22C55E', flexShrink: 0 }} />
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
