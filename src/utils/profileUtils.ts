import type { SideEffectEntry, UserProfile } from '../types'
import { diffDays, getMondayOf, todayStr } from './dateUtils'

// Leituras derivadas do perfil — fonte única. Telas, avisos e lembretes usam
// estas funções em vez de refazer as contas (o que já fez valores divergirem).

// "Maria Clara Souza" → "MC"
export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// Peso mais recente: a última pesagem (o histórico é gravado em ordem de data);
// sem pesagens, o peso atual informado no cadastro ou, por fim, o inicial.
export function getCurrentWeight(profile: UserProfile): number {
  return profile.weightHistory.at(-1)?.weight ?? profile.currentWeight ?? profile.startWeight
}

export interface WeightProgress {
  current: number      // kg
  lost: number         // kg perdidos desde o início (negativo = ganho)
  toGoal: number       // kg que faltam para a meta
  hasGoal: boolean     // meta diferente do peso inicial
  pct: number          // 0–100, caminho percorrido até a meta
  reachedGoal: boolean
}

export function getWeightProgress(profile: UserProfile): WeightProgress {
  const current = getCurrentWeight(profile)
  const lost    = profile.startWeight - current
  const hasGoal = profile.startWeight !== profile.goalWeight
  return {
    current,
    lost,
    toGoal: current - profile.goalWeight,
    hasGoal,
    pct: hasGoal ? Math.min(100, Math.max(0, (lost / (profile.startWeight - profile.goalWeight)) * 100)) : 0,
    reachedGoal: hasGoal && current <= profile.goalWeight,
  }
}

// Dias de protocolo, contados em datas do calendário local (não em horas UTC)
export function protocolDays(profile: UserProfile, today = todayStr()): number {
  return diffDays(today, profile.startDate)
}

// Registro de sintomas da semana (segunda a domingo) que contém `date`
export function weekSideEffects(profile: UserProfile, date = new Date()): SideEffectEntry | undefined {
  const monday = getMondayOf(date)
  return profile.sideEffects?.find(e => e.date === monday)
}
