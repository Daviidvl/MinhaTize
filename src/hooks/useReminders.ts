import { useEffect, useMemo, useState } from 'react'
import { UserProfile } from '../types'
import {
  type ReminderState,
  getDueReminders, readReminderContext, loadReminderSettings, loadReminderState, saveReminderState,
  pruneReminderState, REMINDERS_CHANGED_EVENT,
} from '../utils/reminderUtils'
import { recordAppOpen } from '../utils/usageUtils'
import { setAppBadge } from '../utils/notifications'
import { syncPush } from '../utils/pushSync'
import { todayStr } from '../utils/dateUtils'

const TICK_MS = 60_000
// Junta vários registros seguidos (ex.: três copos d'água) num envio só
const SYNC_DEBOUNCE_MS = 3_000

// Recalcula os lembretes do dia a cada minuto, ao voltar para o app e quando a
// configuração ou um registro muda (REMINDERS_CHANGED_EVENT), e mantém a agenda
// de notificações do servidor em dia.
export function useReminders(profile: UserProfile, enabled: boolean) {
  const [tick, setTick]   = useState(0)
  const [state, setState] = useState<ReminderState>(loadReminderState)

  useEffect(() => {
    const bump = () => setTick(t => t + 1)
    const id = window.setInterval(bump, TICK_MS)
    window.addEventListener(REMINDERS_CHANGED_EVENT, bump)
    document.addEventListener('visibilitychange', bump)
    return () => {
      window.clearInterval(id)
      window.removeEventListener(REMINDERS_CHANGED_EVENT, bump)
      document.removeEventListener('visibilitychange', bump)
    }
  }, [])

  // Horário em que o app é aberto: é com ele que as notificações aprendem as janelas de envio
  useEffect(() => {
    if (!enabled) return
    const record = () => { if (document.visibilityState === 'visible') recordAppOpen() }
    record()
    document.addEventListener('visibilitychange', record)
    return () => document.removeEventListener('visibilitychange', record)
  }, [enabled])

  const { settings, reminders } = useMemo(() => {
    const s = loadReminderSettings()
    return { settings: s, reminders: enabled ? getDueReminders(readReminderContext(profile)) : [] }
    // tick força o recálculo: os dados de água/treino e o horário vêm de fora do React
  }, [profile, enabled, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => reminders.filter(r => !state.dismissed[r.id]), [reminders, state])

  useEffect(() => {
    if (enabled) setAppBadge(visible.length)
  }, [visible, enabled])

  useEffect(() => {
    if (!enabled) return
    const id = window.setTimeout(() => { void syncPush(profile, settings, state) }, SYNC_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [profile, settings, state, enabled])

  function dismiss(id: string) {
    const today = todayStr()
    const next  = pruneReminderState({ dismissed: { ...state.dismissed, [id]: today } }, today)
    saveReminderState(next)
    setState(next)
  }

  return { reminders: visible, settings, dismiss, isDismissed: (id: string) => !!state.dismissed[id] }
}
