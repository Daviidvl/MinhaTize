import { useState, type ReactNode } from 'react'
import { Bell, Syringe, Dumbbell, GlassWater, Scale } from 'lucide-react'
import { type ReminderSettings as Settings, MAX_PER_DAY, loadReminderSettings, saveReminderSettings } from '../utils/reminderUtils'
import { getNotificationSupport, requestNotificationPermission } from '../utils/notifications'
import { isPushSupported, needsHomeScreenInstall } from '../utils/pushSync'

// A pessoa só liga ou desliga. O que é enviado, quantas vezes e em que horário
// é fixo e se ajusta sozinho ao uso do app (utils/reminderUtils.ts e usageUtils.ts).

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: '46px', height: '28px', borderRadius: '99px', border: 'none', padding: '3px', flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: checked ? 'flex-end' : 'flex-start',
        background: checked ? 'var(--cobalt)' : 'var(--line-strong)', transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(var(--shadow-rgb),0.25)' }} />
    </button>
  )
}

const TOPICS: { icon: ReactNode; label: string; sub: string }[] = [
  { icon: <Syringe size={16} strokeWidth={1.85} />,    label: 'Aplicação', sub: 'Véspera, dia e aplicação esquecida' },
  { icon: <Dumbbell size={16} strokeWidth={1.85} />,   label: 'Treino',    sub: 'Nos dias do seu plano' },
  { icon: <GlassWater size={16} strokeWidth={1.85} />, label: 'Água',      sub: 'Se você usa o registro de água' },
  { icon: <Scale size={16} strokeWidth={1.85} />,      label: 'Pesagem',   sub: 'No dia em que você costuma se pesar' },
]

export default function ReminderSettings() {
  const [s, setS]             = useState<Settings>(loadReminderSettings)
  const [support, setSupport] = useState(getNotificationSupport)

  function update(next: Settings) {
    setS(next)
    saveReminderSettings(next)
  }

  async function askPermission() {
    const result = await requestNotificationPermission()
    setSupport(result)
    if (result === 'granted') update({ notifications: true })
  }

  function toggle(on: boolean) {
    // Desligar remove a inscrição de push deste aparelho (useReminders → syncPush)
    update({ notifications: on })
    if (on && support === 'default') void askPermission()
  }

  const install = needsHomeScreenInstall()
  const blocked = install || support === 'denied' || support === 'unsupported' || !isPushSupported()
  const on      = s.notifications && !blocked
  const status =
    install ? 'No iPhone, adicione o MinhaTize à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.'
    : support === 'denied' ? 'Bloqueadas neste celular. Libere o MinhaTize nas configurações de notificação do aparelho.'
    : blocked ? 'Este navegador não recebe notificações.'
    : !s.notifications ? 'Desligadas. Os avisos continuam aparecendo no Início.'
    : support === 'default' ? 'Falta permitir neste celular.'
    : 'Ativas. Chegam mesmo com o app fechado.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={19} strokeWidth={1.75} color="var(--cobalt)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Notificações</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.45 }}>{status}</p>
          </div>
          <Switch checked={on} onChange={toggle} label="Notificações" disabled={blocked} />
        </div>

        {s.notifications && support === 'default' && !blocked && (
          <button className="btn-primary" onClick={askPermission} style={{ width: '100%', minHeight: '44px', fontSize: '14px' }}>
            Permitir notificações
          </button>
        )}
      </div>

      <p className="label-base" style={{ margin: '6px 0 0', paddingLeft: '4px' }}>O que você recebe</p>
      <div className="card" style={{ padding: '4px 0' }}>
        {TOPICS.map((t, i) => (
          <div key={t.label} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px',
            borderTop: i === 0 ? 'none' : '1px solid var(--line)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, color: 'var(--cobalt)',
              background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {t.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.label}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0', lineHeight: 1.4 }}>{t.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 4px', lineHeight: 1.55 }}>
        No máximo {MAX_PER_DAY} por dia, uma de manhã e outra no fim do dia, nos horários em que você costuma abrir o app.
        Nada é enviado entre 22h e 7h30. Se você já registrou, o aviso não chega.
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 4px', lineHeight: 1.55 }}>
        Os avisos são calculados no seu aparelho. O servidor recebe só o horário e o texto de cada um, nunca seu peso,
        dose ou sintomas. Eles não substituem a orientação do seu médico.
      </p>
    </div>
  )
}
