import { useState } from 'react'
import {
  Award, Calendar, Package, Settings, Zap, BarChart2, Scale, Flame, Dumbbell,
  Target, Lightbulb, AlertTriangle, Check, ChevronLeft, Shield,
  MessageCircle, Utensils, Bell,
} from 'lucide-react'
import { UserProfile } from '../types'
import ReminderSettings from './ReminderSettings'
import StockControl from './StockControl'
import ProfileEdit from './ProfileEdit'
import ProfileLegal from './ProfileLegal'
import Pharmacies from './Pharmacies'
import { StoreHome, StoreCategory } from './Store'
import { SLabel, LGroup, LDivider, LRow, SubHeader, WaIcon, openWA } from './ProfileShared'
import { LOJA_CATEGORIES } from '../data/lojaProducts'
import { loadReminderSettings } from '../utils/reminderUtils'
import { getAppsLeft, getDoseLabel, getMedicationLabel, isLowStock, stockMonths } from '../utils/medicationUtils'
import { getCurrentWeight, getInitials, protocolDays } from '../utils/profileUtils'

// Perfil: lista de atalhos (estilo iOS Settings) e as subtelas abertas por ela.
// Loja, Farmácias, edição e Legal vivem nos próprios arquivos.

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  onBack: () => void
  // Subtela aberta direto por um link interno, ex.: "stock" ou "loja:aplicacao"
  initialSection?: string
}

type ProfileSection = null | 'achievements' | 'stock' | 'reminders' | 'edit' | 'equipe' | 'suporte' | 'legal' | 'loja' | 'loja-categoria' | 'farmacias'

interface Achievement {
  id: string; icon: React.ReactNode; title: string; phrase: string; unlocked: boolean
}

function buildAchievements(profile: UserProfile): Achievement[] {
  const days    = protocolDays(profile)
  const lastW   = getCurrentWeight(profile)
  const lost    = profile.startWeight - lastW
  const entries = profile.weightHistory.length
  const reachedGoal = lastW <= profile.goalWeight && profile.goalWeight < profile.startWeight
  return [
    { id: 'start',  icon: <Zap size={26} strokeWidth={1.75} />,      title: 'Primeiro passo', phrase: 'Você deu o primeiro passo — o mais difícil de todos.',  unlocked: !!profile.name },
    { id: 'week1',  icon: <Calendar size={26} strokeWidth={1.75} />,  title: '1ª semana',      phrase: 'Uma semana inteira de comprometimento. Continue!',        unlocked: days >= 7 },
    { id: 'month1', icon: <Calendar size={26} strokeWidth={1.75} />,  title: '1 mês',          phrase: 'Um mês de protocolo. Os resultados estão chegando.',       unlocked: days >= 30 },
    { id: 'month2', icon: <Award size={26} strokeWidth={1.75} />,     title: '2 meses',        phrase: '60 dias. Você já criou um hábito real.',                   unlocked: days >= 60 },
    { id: 'track3', icon: <BarChart2 size={26} strokeWidth={1.75} />, title: 'Comprometido',   phrase: 'Monitorar é o segredo de quem chega lá.',                  unlocked: entries >= 3 },
    { id: 'lost2',  icon: <Scale size={26} strokeWidth={1.75} />,     title: '2kg a menos',    phrase: 'Os primeiros 2kg são os mais significativos.',             unlocked: lost >= 2 },
    { id: 'lost5',  icon: <Flame size={26} strokeWidth={1.75} />,     title: '5kg a menos',    phrase: 'Seu corpo está respondendo. 5kg é transformação.',         unlocked: lost >= 5 },
    { id: 'lost10', icon: <Dumbbell size={26} strokeWidth={1.75} />,  title: '10kg a menos',   phrase: '10kg! Uma conquista que muda a vida.',                     unlocked: lost >= 10 },
    { id: 'goal',   icon: <Target size={26} strokeWidth={1.75} />,    title: 'Meta atingida!', phrase: 'Meta atingida. Você é um exemplo de dedicação.',           unlocked: reachedGoal },
  ]
}

export default function ProfilePage({ profile, onUpdateProfile, onBack, initialSection }: Props) {
  // initialSection pode trazer uma categoria da Loja, ex.: "loja:aplicacao"
  const [initSection, initCategoria] = (initialSection ?? '').split(':')
  const deepCategoria = initSection === 'loja' && initCategoria && LOJA_CATEGORIES[initCategoria] ? initCategoria : null
  const [section, setSection] = useState<ProfileSection>(
    deepCategoria ? 'loja-categoria' : ((initSection || null) as ProfileSection),
  )
  const [lojaCategoria, setLojaCategoria] = useState<string | null>(deepCategoria)

  const initials     = getInitials(profile.name)
  const weeks        = Math.floor(protocolDays(profile) / 7)
  const totalLost    = profile.startWeight - getCurrentWeight(profile)
  const achievements = buildAchievements(profile)
  const unlocked     = achievements.filter(a => a.unlocked).length
  const appsLeft     = getAppsLeft(profile)
  const stockLow     = isLowStock(appsLeft)

  // ── Subtelas ────────────────────────────────────────────────────────────────
  if (section === 'achievements') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Conquistas" onBack={() => setSection(null)} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          {unlocked} de {achievements.length} desbloqueadas
        </p>
        <span className="badge badge-green">{Math.round((unlocked / achievements.length) * 100)}%</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {achievements.map(a => (
          <div key={a.id} style={{
            flexShrink: 0, width: '148px', padding: '16px 12px', borderRadius: '16px',
            border: `1.5px solid ${a.unlocked ? 'var(--sky)' : 'var(--border)'}`,
            background: a.unlocked ? 'var(--primary-light)' : 'var(--surface)',
            opacity: a.unlocked ? 1 : 0.5,
            boxShadow: a.unlocked ? '0 4px 16px rgba(var(--shadow-rgb),0.12)' : 'var(--shadow-card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px',
          }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: a.unlocked ? 'var(--primary-light)' : 'var(--surface-2)',
              border: `1px solid ${a.unlocked ? 'var(--sky)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: a.unlocked ? 'var(--primary)' : 'var(--text-muted)', opacity: a.unlocked ? 1 : 0.5,
            }}>{a.icon}</div>
            <p style={{ fontWeight: 800, fontSize: '12px', lineHeight: 1.3, margin: 0, color: a.unlocked ? 'var(--primary)' : 'var(--text-muted)' }}>{a.title}</p>
            <p style={{ fontSize: '10px', lineHeight: 1.4, margin: 0, color: a.unlocked ? 'var(--text-secondary)' : 'var(--text-muted)', fontStyle: a.unlocked ? 'italic' : 'normal' }}>
              {a.unlocked ? `"${a.phrase}"` : 'Continue para desbloquear'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  if (section === 'stock') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Estoque" onBack={() => setSection(null)} />
      <div style={{
        background: 'var(--g-hero)',
        borderRadius: '18px', padding: '18px 20px', color: '#fff', boxShadow: 'var(--shadow-green)',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Estoque disponível
        </p>
        <p style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1, letterSpacing: '1px', margin: '0 0 2px' }}>
          {appsLeft ?? '--'}
          {appsLeft != null && <span style={{ fontSize: '15px', opacity: 0.8, marginLeft: '6px' }}>{appsLeft === 1 ? 'aplicação' : 'aplicações'}</span>}
        </p>
        {appsLeft != null && (
          <p style={{ fontSize: '12px', opacity: 0.75, margin: '4px 0 14px' }}>
            ≈ {stockMonths(appsLeft)} {stockMonths(appsLeft) === 1 ? 'mês' : 'meses'} de tratamento
          </p>
        )}
        {appsLeft != null && (
          <>
            <div style={{ background: 'var(--track-on-dark)', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${Math.min(100, (appsLeft / 12) * 100)}%`, height: '100%', background: stockLow ? 'var(--amber-fill)' : 'var(--g-ring)', borderRadius: '99px', transition: 'width 0.9s ease' }} />
            </div>
            <p style={{ fontSize: '12px', opacity: 0.8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
              {stockLow ? <><AlertTriangle size={12} strokeWidth={2} />Estoque baixo — reponha em breve</> : <><Check size={12} strokeWidth={2.5} />Estoque confortável</>}
            </p>
          </>
        )}
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', flex: 1, margin: 0 }}>Informe suas ampolas</p>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '99px' }}>
            Dose: {getDoseLabel(profile)}
          </span>
        </div>
        <StockControl profile={profile} onUpdateProfile={onUpdateProfile} />
      </div>
      <div className="card-warning">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Lightbulb size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
          <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
            Mantenha ao menos <strong>4 semanas</strong> de estoque. O medicamento pode demorar alguns dias após o pedido.
          </p>
        </div>
      </div>
    </div>
  )

  if (section === 'reminders') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Notificações" onBack={() => setSection(null)} />
      <ReminderSettings />
    </div>
  )

  if (section === 'edit') return (
    <ProfileEdit profile={profile} onUpdateProfile={onUpdateProfile} onBack={() => setSection(null)} />
  )

  if (section === 'equipe') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Minha Equipe" onBack={() => setSection(null)} />
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
        Fale diretamente com nossa equipe de saúde via WhatsApp.
      </p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={20} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Nutricionista</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Plano alimentar personalizado</p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          Precisa de um plano alimentar personalizado ou deseja agendar uma consulta?
        </p>
        <button onClick={() => openWA('Olá! Gostaria de agendar uma consulta com a nutricionista.')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '13px 20px', background: 'var(--g-cta)',
          color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          <WaIcon size={18} /> Falar com a Nutricionista
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={20} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Educador Físico</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Ficha de treino personalizada</p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          Deseja uma ficha de treino personalizada ou atualizar seu plano atual?
        </p>
        <button onClick={() => openWA('Olá! Gostaria de solicitar uma nova ficha de treino com o educador físico.')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '13px 20px', background: 'var(--g-cta)',
          color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          <WaIcon size={18} /> Solicitar ficha de treino
        </button>
      </div>
    </div>
  )

  if (section === 'suporte') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SubHeader title="Suporte" onBack={() => setSection(null)} />
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '32px 20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'var(--ice)', color: 'var(--cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WaIcon size={30} />
        </div>
        <div>
          <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Precisa de ajuda?</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.55 }}>
            Nossa equipe está disponível via WhatsApp para tirar dúvidas sobre o app e o seu protocolo.
          </p>
        </div>
        <button onClick={() => openWA()} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '14px 20px', background: 'var(--g-cta)',
          color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          <WaIcon size={18} /> Abrir WhatsApp
        </button>
      </div>
    </div>
  )

  if (section === 'legal') return <ProfileLegal profile={profile} onBack={() => setSection(null)} />

  // Loja e Farmácias abrem direto do Início: o Voltar sai do Perfil
  if (section === 'loja') return (
    <StoreHome onBack={onBack} onCategory={id => { setLojaCategoria(id); setSection('loja-categoria') }} />
  )

  if (section === 'loja-categoria' && lojaCategoria) return (
    <StoreCategory categoryId={lojaCategoria} onBack={() => setSection('loja')} />
  )

  if (section === 'farmacias') return <Pharmacies onBack={onBack} />

  // ── Vista principal (lista estilo iOS Settings) ───────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Topo: back + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)',
        }}><ChevronLeft size={16} strokeWidth={1.75} /></button>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Perfil</h2>
      </div>

      {/* Hero card */}
      <div style={{
        background: 'var(--g-hero)',
        borderRadius: '20px', padding: '20px', color: '#fff',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: 'var(--shadow-blue)',
      }}>
        <div style={{
          width: '58px', height: '58px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 800, letterSpacing: '-1px',
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '18px', margin: 0, letterSpacing: '-0.3px' }}>{profile.name}</p>
          <p style={{ fontSize: '12px', opacity: 0.75, margin: '3px 0 0' }}>
            {getMedicationLabel(profile)} · {getDoseLabel(profile)}
          </p>
        </div>
        <button onClick={() => setSection('edit')} style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}><Settings size={15} strokeWidth={2} /></button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          { label: 'Perdido', value: totalLost > 0 ? `-${totalLost.toFixed(1)}kg` : '0kg', color: 'var(--teal-d)' },
          { label: 'Semanas', value: String(weeks), color: 'var(--primary)' },
          { label: 'Conquistas', value: `${unlocked}/${achievements.length}`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center', padding: '12px 6px',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
          }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Seção: Acompanhamento */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SLabel>Acompanhamento</SLabel>
        <LGroup>
          <LRow
            iconBg="var(--ice)"
            icon={<Award size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />}
            label="Conquistas"
            badge={`${unlocked}/${achievements.length}`}
            onClick={() => setSection('achievements')}
          />
          <LDivider />
          <LRow
            iconBg="var(--ice)"
            icon={<Package size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />}
            label="Estoque"
            value={stockLow ? <><AlertTriangle size={12} strokeWidth={2} color="var(--amber)" />Baixo</> : appsLeft != null ? `${appsLeft} aplic.` : undefined}
            onClick={() => setSection('stock')}
          />
          <LDivider />
          <LRow
            iconBg="var(--ice)"
            icon={<Bell size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />}
            label="Notificações"
            value={loadReminderSettings().notifications ? 'Ativadas' : 'Desativadas'}
            onClick={() => setSection('reminders')}
          />
        </LGroup>
      </div>

      {/* Seção: Minha Equipe */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SLabel>Minha Equipe</SLabel>
        <LGroup>
          <LRow
            iconBg="var(--ice)"
            icon={<Utensils size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />}
            label="Nutricionista"
            value="WhatsApp"
            onClick={() => setSection('equipe')}
          />
          <LDivider />
          <LRow
            iconBg="var(--ice)"
            icon={<Dumbbell size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />}
            label="Educador Físico"
            value="WhatsApp"
            onClick={() => setSection('equipe')}
          />
          <LDivider />
          <LRow
            iconBg="var(--ice)"
            icon={<MessageCircle size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />}
            label="Suporte"
            onClick={() => setSection('suporte')}
          />
        </LGroup>
      </div>

      {/* Seção: Legal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SLabel>Legal</SLabel>
        <LGroup>
          <LRow
            iconBg="var(--ice)"
            icon={<Shield size={18} strokeWidth={1.75} style={{ color: 'var(--cobalt)' }} />}
            label="Legal & Privacidade"
            onClick={() => setSection('legal')}
          />
        </LGroup>
      </div>

    </div>
  )
}
