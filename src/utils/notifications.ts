// Permissão de notificações e número no ícone do app. O envio em si é feito
// pelo servidor de push — ver utils/pushSync.ts.

export type NotificationSupport = 'unsupported' | NotificationPermission

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// Precisa ser chamada direto de um toque do usuário: o iPhone recusa o pedido
// fora de um gesto e o Chrome passa a esconder o aviso de permissão.
export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (getNotificationSupport() === 'unsupported') return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

type BadgeNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

// Número no ícone do app instalado (Badging API — Android/desktop e iOS 16.4+ com o app na tela de início)
export function setAppBadge(count: number) {
  const nav = navigator as BadgeNavigator
  const p = count > 0 ? nav.setAppBadge?.(count) : nav.clearAppBadge?.()
  p?.catch(() => {})
}
