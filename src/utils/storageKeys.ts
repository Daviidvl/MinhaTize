// Registro central das chaves de localStorage usadas no app — evita strings
// soltas re-digitadas (e potencialmente divergentes) em cada componente.
export const STORAGE_KEYS = {
  profile: 'tizetrack_profile',
  token: 'tizetrack_token',
  // Impressão digital (hash) do token dono dos dados deste aparelho — ver utils/token.ts
  owner: 'tizetrack_owner',
  theme: 'minha-tize-theme',
  consent: 'tizetrack_consent',
  workoutProfile: 'tizetrack_workout',
  workoutLog: 'tizetrack_workout_log',
  workoutChecks: 'tizetrack_workout_checks',
  dietProfile: 'tizetrack_diet',
  foodLog: 'tizetrack_food_log',
  waterLog: 'tizetrack_water_log',
  sideEffects: 'tizetrack_side_effects',
  diary: 'tizetrack_diary',
} as const

// Chaves de dados do usuário apagadas em "Resetar todos os dados" (ProfilePage).
// Não inclui STORAGE_KEYS.token (o acesso ao app é mantido) nem STORAGE_KEYS.consent
// (removida separadamente, apenas no fluxo de revogação de consentimento).
export const USER_DATA_KEYS: string[] = [
  STORAGE_KEYS.profile,
  STORAGE_KEYS.foodLog,
  STORAGE_KEYS.waterLog,
  STORAGE_KEYS.dietProfile,
  STORAGE_KEYS.workoutProfile,
  STORAGE_KEYS.workoutLog,
  STORAGE_KEYS.workoutChecks,
  STORAGE_KEYS.sideEffects,
  STORAGE_KEYS.diary,
]
