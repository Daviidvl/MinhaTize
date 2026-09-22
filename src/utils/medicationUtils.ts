import { DOSE_OPTIONS, MEDICATION_LABELS, UserProfile } from '../types'

export type DoseMode = 'fixed' | 'custom' | 'unknown'

// Fonte única de leitura do cadastro de medicamento — nenhuma outra tela deve
// reimplementar esta lógica ou indexar profile.medication/currentDose direto.

export function getMedicationLabel(profile: UserProfile): string {
  if (profile.medication === 'outro' && profile.medicationName?.trim()) {
    return profile.medicationName.trim()
  }
  return MEDICATION_LABELS[profile.medication]
}

export function getDoseValue(profile: UserProfile): number | null {
  return typeof profile.currentDose === 'number' && profile.currentDose > 0
    ? profile.currentDose
    : null
}

export function getDoseLabel(profile: UserProfile): string {
  const dose = getDoseValue(profile)
  return dose != null ? `${dose}mg` : 'Dose não informada'
}

export function hasPresentation(profile: UserProfile): boolean {
  return typeof profile.presentationMg === 'number' && profile.presentationMg > 0
    && typeof profile.presentationMl === 'number' && profile.presentationMl > 0
}

export function getPresentationLabel(profile: UserProfile): string | null {
  if (!hasPresentation(profile)) return null
  const mg = profile.presentationMg!.toString().replace('.', ',')
  const ml = profile.presentationMl!.toString().replace('.', ',')
  return `${mg}mg/${ml}mL`
}

export function getAppsLeft(profile: UserProfile): number | null {
  const dose = getDoseValue(profile)
  if (dose == null || !profile.stock) return null
  return Math.floor(profile.stock.amouleMg / dose) * profile.stock.ampouleCount
}

// Deriva o modo de edição de dose (grade fixa / manual / desconhecida) a partir
// de um perfil já salvo, para inicializar formulários de edição.
export function resolveDoseMode(profile: UserProfile): { mode: DoseMode; fixedValue: number; customValue: string } {
  const dose = getDoseValue(profile)
  if (dose == null) return { mode: 'unknown', fixedValue: DOSE_OPTIONS[0], customValue: '' }
  if (DOSE_OPTIONS.includes(dose)) return { mode: 'fixed', fixedValue: dose, customValue: '' }
  return { mode: 'custom', fixedValue: DOSE_OPTIONS[0], customValue: dose.toString() }
}
