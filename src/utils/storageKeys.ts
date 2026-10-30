// Registro central das chaves de localStorage usadas no app — evita strings
// soltas re-digitadas (e potencialmente divergentes) em cada componente.
export const STORAGE_KEYS = {
  profile: 'tizetrack_profile',
  token: 'tizetrack_token',
  // Impressão digital (hash) do token dono dos dados deste aparelho — ver utils/token.ts
  owner: 'tizetrack_owner',
  // Prova assinada pelo servidor que libera o app offline — ver utils/accessProof.ts
  accessProof: 'tizetrack_access_proof',
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
  // Preferências de lembretes e o registro do que já foi avisado/dispensado — ver utils/reminderUtils.ts
  reminders: 'tizetrack_reminders',
  remindersState: 'tizetrack_reminders_state',
  // Dia fixado para o aviso único "cadastre seu estoque" — ver utils/reminderUtils.ts
  stockNudge: 'tizetrack_stock_nudge',
  // Horários em que o app foi aberto (últimos 30 dias) — ver utils/usageUtils.ts
  usage: 'tizetrack_usage',
  // Assinatura da última agenda de push enviada ao servidor — ver utils/pushSync.ts
  pushSync: 'tizetrack_push_sync',
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
  STORAGE_KEYS.reminders,
  STORAGE_KEYS.remindersState,
  STORAGE_KEYS.stockNudge,
  STORAGE_KEYS.usage,
  STORAGE_KEYS.pushSync,
]
