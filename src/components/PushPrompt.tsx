import { useState } from 'react'
import { BellRing, Smartphone, X } from 'lucide-react'
import { loadReminderSettings, saveReminderSettings } from '../utils/reminderUtils'
import { getNotificationSupport, requestNotificationPermission } from '../utils/notifications'
import { needsHomeScreenInstall } from '../utils/pushSync'

// id usado em useReminders para lembrar que o aviso foi dispensado
export const PUSH_PROMPT_ID = 'push-prompt'

interface Props {
  dismissed: boolean
  onDismiss: () => void
}

// As notificações vêm ligadas por padrão, mas o celular exige um toque em
// "Permitir". Este aviso aparece enquanto a permissão não foi pedida.
export default function PushPrompt({ dismissed, onDismiss }: Props) {
  const [support, setSupport] = useState(getNotificationSupport)

  if (dismissed || !loadReminderSettings().notifications) return null

  const install = needsHomeScreenInstall()
  if (!install && support !== 'default') return null

  async function enable() {
    const result = await requestNotificationPermission()
    setSupport(result)
    // Reaviso para o hook: com a permissão dada, ele faz a inscrição e envia a agenda
    if (result === 'granted') saveReminderSettings({ notifications: true })
  }

  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {install
          ? <Smartphone size={18} strokeWidth={1.75} color="var(--cobalt)" />
          : <BellRing size={18} strokeWidth={1.75} color="var(--cobalt)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
          Receba os lembretes no celular
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          {install
            ? 'No iPhone, adicione o MinhaTize à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.'
            : 'Aplicação, treino, água e pesagem. No máximo 2 por dia, mesmo com o app fechado.'}
        </p>
      </div>
      {!install && (
        <button className="btn-primary" onClick={enable} style={{ minHeight: '36px', padding: '0 14px', fontSize: '12px', flexShrink: 0 }}>
          Ativar
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Agora não"
        style={{
          width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
        }}
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
