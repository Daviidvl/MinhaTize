// Registro central das chaves de localStorage usadas no app — evita strings
// soltas re-digitadas (e potencialmente divergentes) em cada componente.
export const STORAGE_KEYS = {
  profile: 'tizetrack_profile',
  token: 'tizetrack_token',
  theme: 'minha-tize-theme',
  consent: 'tizetrack_consent',
  antiPlatoPlan: 'tizetrack_antiplato',
  workoutProfile: 'tizetrack_workout',
  workoutLog: 'tizetrack_workout_log',
  dietProfile: 'tizetrack_diet',
  foodLog: 'tizetrack_food_log',
  sideEffects: 'tizetrack_side_effects',
  diary: 'tizetrack_diary',
} as const

// Chaves de dados do usuário apagadas em "Resetar todos os dados" (ProfilePage).
// Não inclui STORAGE_KEYS.token (o acesso ao app é mantido) nem STORAGE_KEYS.consent
// (removida separadamente, apenas no fluxo de revogação de consentimento).
export const USER_DATA_KEYS: string[] = [
  STORAGE_KEYS.profile,
  STORAGE_KEYS.foodLog,
  STORAGE_KEYS.dietProfile,
  STORAGE_KEYS.antiPlatoPlan,
  STORAGE_KEYS.workoutProfile,
  STORAGE_KEYS.workoutLog,
  STORAGE_KEYS.sideEffects,
  STORAGE_KEYS.diary,
]
