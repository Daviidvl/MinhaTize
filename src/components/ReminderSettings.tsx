import { useState, type ReactNode, type CSSProperties } from 'react'
import { Bell, CalendarPlus, Syringe, Package, HeartPulse, GlassWater, Dumbbell, Scale, EyeOff, Moon } from 'lucide-react'
import { UserProfile, WEEK_DAYS, WEEK_DAYS_FULL } from '../types'
import { type ReminderSettings as Settings, loadReminderSettings, saveReminderSettings } from '../utils/reminderUtils'
import { getNotificationSupport, requestNotificationPermission } from '../utils/notifications'
import { isPushSupported, needsHomeScreenInstall } from '../utils/pushSync'
import { buildReminderCalendar, downloadCalendar } from '../utils/calendarExport'

interface Props {
  profile: UserProfile
}

const WATER_INTERVALS = [1, 2, 3]

// "Todo domingo", "Toda segunda"…
function everyWeekday(day: number): string {
  return `${day === 0 || day === 6 ? 'Todo' : 'Toda'} ${WEEK_DAYS_FULL[day].toLowerCase()}`
}

// ── Peças de formulário ──────────────────────────────────────────────────────
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: '42px', height: '24px', borderRadius: '99px', border: 'none', padding: '2px', flexShrink: 0,
        cursor: 'pointer', display: 'flex', justifyContent: checked ? 'flex-end' : 'flex-start',
        background: checked ? 'var(--cobalt)' : 'var(--line-strong)', transition: 'background 0.2s',
      }}
    >
      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(var(--shadow-rgb),0.25)' }} />
    </button>
  )
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span className="label-base">{label}</span>
      <input
        type="time" className="input-field" value={value}
        onChange={e => e.target.value && onChange(e.target.value)}
        style={{ minHeight: '44px' }}
      />
    </label>
  )
}

const chip = (active: boolean): CSSProperties => ({
  flex: 1, minWidth: 0, padding: '9px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
  background: active ? 'var(--g-cta)' : 'var(--surface-2)',
  color: active ? '#fff' : 'var(--text-primary)', fontWeight: 700, fontSize: '12px',
  fontFamily: 'Inter, -apple-system, sans-serif', transition: 'all 0.15s',
  outline: active ? 'none' : '1px solid var(--border)',
})

function IconChip({ children }: { children: ReactNode }) {
  return (
    <div style={{
      width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
      background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</div>
  )
}

function ToggleRow({ icon, label, sub, checked, onChange, children }: {
  icon: ReactNode; label: string; sub: string; checked: boolean; onChange: (v: boolean) => void; children?: ReactNode
}) {
  return (
    <div style={{ padding: '13px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <IconChip>{icon}</IconChip>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>{sub}</p>
        </div>
        <Switch checked={checked} onChange={onChange} label={label} />
      </div>
      {checked && children && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', paddingLeft: '46px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--line)', margin: '0 14px' }} />
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '4px 0 0', paddingLeft: '4px' }}>
      {children}
    </p>
  )
}

const ic = (Icon: typeof Bell) => <Icon size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />

// ── Tela ─────────────────────────────────────────────────────────────────────
export default function ReminderSettings({ profile }: Props) {
  const [s, setS]             = useState<Settings>(loadReminderSettings)
  const [support, setSupport] = useState(getNotificationSupport)
  const [calMsg, setCalMsg]   = useState<string | null>(null)

  function update(next: Settings) {
    setS(next)
    saveReminderSettings(next)
  }

  function patch<K extends 'application' | 'water' | 'weighIn' | 'workout' | 'stock' | 'postDose'>(k: K, v: Partial<Settings[K]>) {
    update({ ...s, [k]: { ...s[k], ...v } })
  }

  function toggleNotifications(on: boolean) {
    // Desligar remove a inscrição de push deste aparelho (useReminders → syncPush)
    update({ ...s, notifications: on })
    if (on && support === 'default') void askPermission()
  }

  async function askPermission() {
    const result = await requestNotificationPermission()
    setSupport(result)
    if (result === 'granted') saveReminderSettings({ ...loadReminderSettings(), notifications: true })
  }

  function exportCalendar() {
    const ics = buildReminderCalendar(profile, s)
    if (!ics) {
      setCalMsg('Ative a aplicação ou a pesagem (e defina o dia da aplicação no perfil) para gerar a agenda.')
      return
    }
    downloadCalendar(ics)
    setCalMsg('Arquivo baixado. Abra-o para adicionar os eventos à agenda do celular.')
  }

  const appDay  = profile.applicationDay
  const install = needsHomeScreenInstall()
  const blocked = install || support === 'denied' || support === 'unsupported' || !isPushSupported()
  const notifSub =
    install ? 'No iPhone, adicione o MinhaTize à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.'
    : support === 'denied' ? 'Bloqueadas neste celular. Libere o MinhaTize nas configurações de notificação do aparelho.'
    : blocked ? 'Este navegador não recebe notificações.'
    : !s.notifications ? 'Desligadas. Você ainda vê os lembretes no Início.'
    : support === 'default' ? 'Falta permitir neste celular.'
    : 'Chegam mesmo com o app fechado.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Notificações ── */}
      <SectionLabel>Neste aparelho</SectionLabel>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <ToggleRow
          icon={ic(Bell)}
          label="Notificações no celular"
          sub={notifSub}
          checked={s.notifications && !blocked}
          onChange={blocked ? () => {} : toggleNotifications}
        >
          {support === 'default' && (
            <button className="btn-primary" onClick={askPermission} style={{ width: '100%', minHeight: '44px', fontSize: '14px' }}>
              Permitir notificações
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <EyeOff size={14} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Modo discreto</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
                Na tela bloqueada aparece só "Você tem um lembrete", sem citar dose ou medicamento.
              </p>
            </div>
            <Switch checked={s.discreet} onChange={v => update({ ...s, discreet: v })} label="Modo discreto" />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Moon size={14} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
              Silêncio
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <TimeField label="De" value={s.quietFrom} onChange={v => update({ ...s, quietFrom: v })} />
              <TimeField label="Até" value={s.quietTo} onChange={v => update({ ...s, quietTo: v })} />
            </div>
          </div>
        </ToggleRow>
      </div>

      {/* ── O que lembrar ── */}
      <SectionLabel>O que lembrar</SectionLabel>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <ToggleRow
          icon={ic(Syringe)}
          label="Aplicação"
          sub={appDay !== undefined ? `${everyWeekday(appDay)}, e avisa se não for registrada` : 'Defina o dia da aplicação em Editar perfil'}
          checked={s.application.enabled}
          onChange={v => patch('application', { enabled: v })}
        >
          <TimeField label="Horário" value={s.application.time} onChange={v => patch('application', { time: v })} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Avisar na véspera, às 20h</p>
            <Switch checked={s.application.eveBefore} onChange={v => patch('application', { eveBefore: v })} label="Avisar na véspera" />
          </div>
        </ToggleRow>
        <Divider />
        <ToggleRow
          icon={ic(Package)}
          label="Estoque baixo"
          sub="Quando restarem menos de 4 aplicações"
          checked={s.stock.enabled}
          onChange={v => patch('stock', { enabled: v })}
        />
        <Divider />
        <ToggleRow
          icon={ic(HeartPulse)}
          label="Como você está"
          sub="1 a 2 dias depois da aplicação, para registrar efeitos colaterais"
          checked={s.postDose.enabled}
          onChange={v => patch('postDose', { enabled: v })}
        />
        <Divider />
        <ToggleRow
          icon={ic(GlassWater)}
          label="Água"
          sub="Só quando você estiver atrás da meta para o horário"
          checked={s.water.enabled}
          onChange={v => patch('water', { enabled: v })}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <TimeField label="De" value={s.water.from} onChange={v => patch('water', { from: v })} />
            <TimeField label="Até" value={s.water.to} onChange={v => patch('water', { to: v })} />
          </div>
          <div>
            <span className="label-base">No máximo a cada</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {WATER_INTERVALS.map(h => (
                <button key={h} style={chip(s.water.everyHours === h)} onClick={() => patch('water', { everyHours: h })}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </ToggleRow>
        <Divider />
        <ToggleRow
          icon={ic(Dumbbell)}
          label="Treino"
          sub="Nos dias de treino do seu plano, se ainda não foi feito"
          checked={s.workout.enabled}
          onChange={v => patch('workout', { enabled: v })}
        >
          <TimeField label="Horário" value={s.workout.time} onChange={v => patch('workout', { time: v })} />
        </ToggleRow>
        <Divider />
        <ToggleRow
          icon={ic(Scale)}
          label="Pesagem semanal"
          sub={`${everyWeekday(s.weighIn.weekday)}, se o peso do dia não foi registrado`}
          checked={s.weighIn.enabled}
          onChange={v => patch('weighIn', { enabled: v })}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            {WEEK_DAYS.map((d, i) => (
              <button key={d} style={{ ...chip(s.weighIn.weekday === i), fontSize: '11px' }} onClick={() => patch('weighIn', { weekday: i })}>
                {d}
              </button>
            ))}
          </div>
          <TimeField label="Horário" value={s.weighIn.time} onChange={v => patch('weighIn', { time: v })} />
        </ToggleRow>
      </div>

      {/* ── Agenda ── */}
      <SectionLabel>Também na agenda</SectionLabel>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <IconChip>{ic(CalendarPlus)}</IconChip>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agenda do celular</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
              Coloca a aplicação semanal, a pesagem e a data de reposição do estoque na agenda do Google ou da Apple.
              Útil se as notificações não estiverem disponíveis neste celular.
            </p>
          </div>
        </div>
        <button className="btn-ghost" onClick={exportCalendar} style={{ width: '100%', minHeight: '44px', gap: '8px' }}>
          <CalendarPlus size={16} strokeWidth={1.75} />
          Adicionar à agenda
        </button>
        {calMsg && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{calMsg}</p>
        )}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 4px', lineHeight: 1.5 }}>
        Os lembretes são calculados no seu aparelho. Para as notificações chegarem com o app fechado, o servidor recebe
        só o horário e o texto de cada aviso, nunca seu peso, dose ou sintomas. Eles não substituem a orientação do seu médico.
      </p>
    </div>
  )
}
