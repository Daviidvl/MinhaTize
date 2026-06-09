import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import ProgressHub from './components/ProgressHub'
import Calculator from './components/Calculator'
import HealthHub from './components/HealthHub'
import Laboratory from './components/Laboratory'
import ProfilePage from './components/ProfilePage'
import ProfileSetup from './components/ProfileSetup'
import OnboardingTour, { TOUR_KEY } from './components/OnboardingTour'
import { useDarkMode } from './hooks/useDarkMode'
import { Tab, UserProfile } from './types'

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  medication: 'tirzepatida',
  startWeight: 90,
  goalWeight: 70,
  height: 170,
  startDate: new Date().toISOString().split('T')[0],
  currentDose: 2.5,
  applicationDay: new Date().getDay(),
  weightHistory: [],
  diary: [],
  sideEffects: [],
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('tizetrack_profile')
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch { /* */ }
  return DEFAULT_PROFILE
}

// ── Inline SVG nav icons ─────────────────────────────────────────────────────
function NavIcon({ tabId }: { tabId: Tab }) {
  const s = {
    width: 20, height: 20,
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
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
  { id: 'dashboard',  label: 'Início'    },
  { id: 'progress',   label: 'Progresso' },
  { id: 'health',     label: 'Saúde'     },
  { id: 'calculator', label: 'Calcular'  },
  { id: 'laboratory', label: 'Lab'       },
]

export default function App() {
  const { isDark, toggle }          = useDarkMode()
  const [activeTab, setActiveTab]   = useState<Tab>('dashboard')
  const [profile, setProfile]       = useState<UserProfile>(loadProfile)
  const [navVisible, setNavVisible] = useState(false)
  const [showTour, setShowTour]     = useState(() =>
    !!loadProfile().name && !localStorage.getItem(TOUR_KEY)
  )
  const lastScrollY = useRef(0)

  const isFirstAccess = !profile.name

  function handleProfileComplete(p: UserProfile) {
    setProfile(p)
    if (!localStorage.getItem(TOUR_KEY)) setShowTour(true)
  }

  useEffect(() => {
    localStorage.setItem('tizetrack_profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    function onScroll() {
      const current = window.scrollY
      const delta   = current - lastScrollY.current
      lastScrollY.current = current
      if (delta >  8) setNavVisible(false)  // deslizou para baixo → esconde
      else if (delta < -8) setNavVisible(true)   // deslizou para cima  → mostra
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          onBack={() => setActiveTab('dashboard')}
        />
      )
    }
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile} onUpdateProfile={setProfile} onNavigate={setActiveTab} />
      case 'progress':
        return <ProgressHub profile={profile} onUpdateProfile={setProfile} />
      case 'health':
        return <HealthHub profile={profile} onUpdateProfile={setProfile} />
      case 'calculator':
        return <Calculator />
      case 'laboratory':
        return <Laboratory profile={profile} onUpdateProfile={setProfile} />
      default:
        return <Dashboard profile={profile} onUpdateProfile={setProfile} onNavigate={setActiveTab} />
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', transition: 'background 0.3s' }}>
      <Header
        isDark={isDark}
        onToggle={toggle}
        profile={profile}
        onProfileClick={() => setActiveTab('profile')}
      />

      <main
        className="main-content"
        style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px' }}
        key={activeTab}
      >
        {renderTab()}
      </main>

      {showTour && <OnboardingTour onDone={() => setShowTour(false)} />}

      {!showProfile && (
        <nav className={`bottom-nav${navVisible ? '' : ' nav-hidden'}`}>
          <div className="bottom-nav-inner">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                data-tour={`tab-${tab.id}`}
                className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }) }}
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
      )}
    </div>
  )
}
