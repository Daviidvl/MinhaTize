import { UserProfile } from '../types'
import { readJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'
import { todayStr } from './dateUtils'

export function exportAllData(profile: UserProfile) {
  const consent = readJSON<{ date?: string } | null>(STORAGE_KEYS.consent, null)
  const data = {
    exportMeta: { platform: 'MinhaTize', exportedAt: new Date().toISOString(), lgpd: 'Art. 18, V da Lei 13.709/2018 (LGPD)', consentDate: consent?.date ?? null },
    profile,
    foodLog: readJSON(STORAGE_KEYS.foodLog, null), diet: readJSON(STORAGE_KEYS.dietProfile, null),
    waterLog: readJSON(STORAGE_KEYS.waterLog, null),
    workout: readJSON(STORAGE_KEYS.workoutProfile, null),
    workoutLog: readJSON(STORAGE_KEYS.workoutLog, null),
    workoutChecks: readJSON(STORAGE_KEYS.workoutChecks, null), consent,
    reminders: readJSON(STORAGE_KEYS.reminders, null),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `minhatize-dados-${todayStr()}.json`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
