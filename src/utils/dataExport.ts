import { UserProfile } from '../types'
import { readJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'
import { readConsent } from './consent'
import { todayStr } from './dateUtils'

// Portabilidade (Art. 18, V da LGPD): todos os dados do usuário em um JSON baixado no aparelho
export function exportAllData(profile: UserProfile) {
  const consent = readConsent()
  const data = {
    exportMeta: { platform: 'MinhaTize', exportedAt: new Date().toISOString(), lgpd: 'Art. 18, V da Lei 13.709/2018 (LGPD)', consentDate: consent?.date ?? null },
    profile,
    foodLog: readJSON(STORAGE_KEYS.foodLog, null), diet: readJSON(STORAGE_KEYS.dietProfile, null),
    waterLog: readJSON(STORAGE_KEYS.waterLog, null),
    workout: readJSON(STORAGE_KEYS.workoutProfile, null),
    workoutLog: readJSON(STORAGE_KEYS.workoutLog, null),
    workoutChecks: readJSON(STORAGE_KEYS.workoutChecks, null),
    workoutHistory: readJSON(STORAGE_KEYS.workoutHistory, null), consent,
    reminders: readJSON(STORAGE_KEYS.reminders, null),
    library: readJSON(STORAGE_KEYS.library, null),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `minhatize-dados-${todayStr()}.json`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
