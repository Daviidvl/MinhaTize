import { useState, useEffect, useRef } from 'react'
import LoginScreen from './components/LoginScreen'
import { getStoredToken, clearToken, checkToken, claimLocalData, hasOfflineAccess } from './utils/token'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import { PUSH_PROMPT_ID } from './components/PushPrompt'
import ProgressHub from './components/ProgressHub'
import Calculator from './components/Calculator'
import HealthHub from './components/HealthHub'
import Laboratory from './components/Laboratory'
import ProfilePage from './components/ProfilePage'
import ProfileSetup from './components/ProfileSetup'
import ConsentGate, { hasConsent } from './components/ConsentGate'
import LegalPage, { isLegalDoc, type LegalDoc } from './components/LegalPage'
import Footer from './components/Footer'
import { useDarkMode } from './hooks/useDarkMode'
import { useReminders } from './hooks/useReminders'
import { loadReminderSettings } from './utils/reminderUtils'
import { requestNotificationPermission } from './utils/notifications'
import { disablePush } from './utils/pushSync'
import { readJSON, writeJSON, readRaw } from './utils/storage'
import { STORAGE_KEYS } from './utils/storageKeys'
import { Tab, UserProfile } from './types'
import { todayStr } from './utils/dateUtils'

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  medication: 'tirzepatida',
  startWeight: 90,
  goalWeight: 70,
  height: 170,
  startDate: todayStr(),
  currentDose: 2.5,
  applicationDay: new Date().getDay(),
  weightHistory: [],
  diary: [],
  sideEffects: [],
}

function loadProfile(): UserProfile {
  const stored = readJSON<Partial<UserProfile> | null>(STORAGE_KEYS.profile, null)
  return stored ? { ...DEFAULT_PROFILE, ...stored } : DEFAULT_PROFILE
}

// Link interno "?tab=health&section=symptoms" — usado ao tocar num lembrete
const TABS: Tab[] = ['dashboard', 'progress', 'health', 'calculator', 'profile', 'laboratory']

function readDeepLink(search: string): { tab: Tab; section: string | null } | null {
  const p   = new URLSearchParams(search)
  const tab = p.get('tab') as Tab | null
  return tab && TABS.includes(tab) ? { tab, section: p.get('section') } : null
}

// ── Inline SVG nav icons ─────────────────────────────────────────────────────
function NavIcon({ tabId }: { tabId: Tab }) {
  const s = {
    width: 18, height: 18,
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
  }

  switch (tabId) {
    case 'dashboard':
      return (
        <svg {...s}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    case 'progress':
      return (
        <svg {...s}>
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
      )
    case 'health':
      return (
        <svg {...s}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      )
    case 'calculator':
      return (
        <svg {...s}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      )
    case 'laboratory':
      return (
        <svg {...s}>
          <path d="M10 2v7.527a2 2 0 01-.211.896L4.72 20.55a1 1 0 00.9 1.45h12.76a1 1 0 00.9-1.45l-5.069-10.127A2 2 0 0114 9.527V2"/>
          <line x1="8.5" y1="2" x2="15.5" y2="2"/>
        </svg>
      )
    default:
      return null
  }
}

const NAV_TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard',  label: 'Início'   },
  { id: 'progress',   label: 'Progresso'},
  { id: 'health',     label: 'Saúde'    },
  { id: 'calculator', label: 'Calcular' },
  { id: 'laboratory', label: 'Lab'      },
]

export default function App() {
  const { isDark, toggle }            = useDarkMode()
  const [deepLink]                    = useState(() => readDeepLink(window.location.search))
  const [activeTab, setActiveTab]     = useState<Tab>(deepLink?.tab ?? 'dashboard')
  const [deepSection, setDeepSection] = useState<string | null>(deepLink?.section ?? null)
  const [profile, setProfile]         = useState<UserProfile>(loadProfile)
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [consentGiven, setConsentGiven] = useState<boolean>(hasConsent)
  const [legalDoc, setLegalDoc]       = useState<LegalDoc | null>(() => {
    const p = new URLSearchParams(window.location.search).get('legal')
    return isLegalDoc(p) ? p : null
  })
  const prevTabRef   = useRef<Tab>('dashboard')
  const navRef       = useRef<HTMLElement>(null)

  // ── Verificação de token ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function checkAccess() {
      const stored = getStoredToken()
      if (stored) {
        const result = await checkToken(stored)
        if (cancelled) return
        if (result === 'valid') {
          if (!readRaw(STORAGE_KEYS.owner)) await claimLocalData(stored)
          if (!cancelled) setTokenStatus('valid')
          return
        }
        // Sem internet ou com a API instável ('unknown') o app abre offline só
        // com a prova assinada da última validação online (até 30 dias).
        if (result === 'unknown' && await hasOfflineAccess(stored)) {
          if (!cancelled) setTokenStatus('valid')
          return
        }
        // Só uma recusa explícita do servidor apaga o token salvo; sem prova,
        // ele fica guardado e a tela de entrada aparece até a conexão voltar.
        if (result === 'invalid') clearToken()
      }
      if (!cancelled) setTokenStatus('invalid')
    }
    checkAccess()
    return () => { cancelled = true }
  }, [])

  // ── Lembretes ───────────────────────────────────────────────────────────────
  const appReady = tokenStatus === 'valid' && consentGiven && !!profile.name && !legalDoc
  const { dismiss: dismissReminder, isDismissed } = useReminders(profile, appReady)

  // Remove o link interno da URL depois de abrir a tela certa
  useEffect(() => {
    if (!deepLink) return
    const url = new URL(window.location.href)
    url.searchParams.delete('tab')
    url.searchParams.delete('section')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [deepLink])

  // Toque numa notificação com o app já aberto: o Service Worker pede a navegação
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== 'navigate' || typeof e.data.url !== 'string') return
      const link = readDeepLink(new URL(e.data.url, window.location.origin).search)
      if (!link) return
      setActiveTab(link.tab)
      setDeepSection(link.section)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  // ── Altura da navbar ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--nav-height', `${el.getBoundingClientRect().height}px`)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function handleNavigate(tab: Tab, section?: string) {
    setActiveTab(tab)
    setDeepSection(section ?? null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const isFirstAccess = !profile.name

  function handleProfileComplete(p: UserProfile) {
    // Ainda dentro do toque em "Concluir": o celular só mostra o pedido de
    // permissão de notificações a partir de um gesto do usuário
    if (loadReminderSettings().notifications) void requestNotificationPermission()
    setProfile(p)
  }

  async function handleLogout() {
    // Para de mandar lembretes para este aparelho (precisa do token, então vem antes)
    await disablePush()
    clearToken()
    setTokenStatus('invalid')
  }

  useEffect(() => {
    writeJSON(STORAGE_KEYS.profile, profile)
  }, [profile])

  // ── Página legal pública (sem autenticação) ─────────────────────────────────
  if (legalDoc) {
    return (
      <LegalPage
        initialDoc={legalDoc}
        onBack={() => {
          setLegalDoc(null)
          const url = new URL(window.location.href)
          url.searchParams.delete('legal')
          window.history.replaceState({}, '', url.pathname + (url.search === '?' ? '' : url.search))
        }}
      />
    )
  }

  // ── Gate de acesso ──────────────────────────────────────────────────────────
  if (tokenStatus === 'checking') {
    return (
      <div style={{
        minHeight: '100dvh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <img src="/LogoPng.png" alt="MinhaTize" style={{ width: '60px', height: '60px', borderRadius: '16px', objectFit: 'contain', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: '-4px', borderRadius: '20px',
              border: '2px solid var(--border)', animation: 'pulse-soft 2s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', fontWeight: 500, margin: 0, letterSpacing: '0.01em' }}>
            Verificando acesso...
          </p>
        </div>
      </div>
    )
  }

  if (tokenStatus === 'invalid') {
    return <LoginScreen onAccessGranted={() => setTokenStatus('valid')} onLegal={doc => { if (isLegalDoc(doc)) setLegalDoc(doc) }} />
  }

  if (!consentGiven) {
    return <ConsentGate onAccept={() => setConsentGiven(true)} />
  }

  if (isFirstAccess) {
    return <ProfileSetup onComplete={handleProfileComplete} />
  }

  const showProfile = activeTab === 'profile'

  function renderTab() {
    if (showProfile) {
      return (
        <ProfilePage
          profile={profile}
          onUpdateProfile={setProfile}
          onBack={() => { setActiveTab(prevTabRef.current); setDeepSection(null) }}
          initialSection={deepSection ?? undefined}
        />
      )
    }
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile} onUpdateProfile={setProfile} onNavigate={handleNavigate} isDismissed={isDismissed} onDismissReminder={dismissReminder} pushPromptDismissed={isDismissed(PUSH_PROMPT_ID)} />
      case 'progress':
        return <ProgressHub profile={profile} onUpdateProfile={setProfile} />
      case 'health':
        return <HealthHub profile={profile} onUpdateProfile={setProfile} initialSection={deepSection ?? undefined} onNavigate={handleNavigate} />
      case 'calculator':
        return <Calculator profile={profile} />
      case 'laboratory':
        return <Laboratory profile={profile} onUpdateProfile={setProfile} />
      default:
        return <Dashboard profile={profile} onUpdateProfile={setProfile} onNavigate={handleNavigate} isDismissed={isDismissed} onDismissReminder={dismissReminder} pushPromptDismissed={isDismissed(PUSH_PROMPT_ID)} />
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', transition: 'background 0.3s' }}>
      <Header
        isDark={isDark}
        onToggle={toggle}
        profile={profile}
        onLogout={handleLogout}
        onProfileClick={() => {
          prevTabRef.current = activeTab
          setActiveTab('profile')
          setDeepSection(null)
        }}
      />

      <main
        className="main-content"
        style={{ maxWidth: '520px', margin: '0 auto', paddingTop: '24px', paddingLeft: '20px', paddingRight: '20px' }}
        key={activeTab}
      >
        {renderTab()}
        <Footer onLegal={setLegalDoc} />
      </main>

      <nav ref={navRef} className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              data-tour={`tab-${tab.id}`}
              className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setDeepSection(null); window.scrollTo({ top: 0, behavior: 'instant' }) }}
              aria-label={tab.label}
            >
              <span className="nav-tab-icon">
                <NavIcon tabId={tab.id} />
              </span>
              <span className="nav-tab-label">{tab.label}</span>
              <span className="nav-tab-dot" />
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
