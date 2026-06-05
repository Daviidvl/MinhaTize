import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import ProgressHub from './components/ProgressHub'
import Calculator from './components/Calculator'
import HealthHub from './components/HealthHub'
import Laboratory from './components/Laboratory'
import ProfilePage from './components/ProfilePage'
import ProfileSetup from './components/ProfileSetup'
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

const NAV_TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard',  icon: '🏠', label: 'Início'    },
  { id: 'progress',   icon: '📊', label: 'Progresso' },
  { id: 'health',     icon: '🌿', label: 'Saúde'     },
  { id: 'calculator', icon: '💉', label: 'Calcular'  },
  { id: 'laboratory', icon: '🧪', label: 'Lab'       },
]

export default function App() {
  const { isDark, toggle }          = useDarkMode()
  const [activeTab, setActiveTab]   = useState<Tab>('dashboard')
  const [profile, setProfile]       = useState<UserProfile>(loadProfile)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY                 = useRef(0)

  const isFirstAccess = !profile.name

  useEffect(() => {
    localStorage.setItem('tizetrack_profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    function onScroll() {
      const current = window.scrollY
      const delta   = current - lastScrollY.current
      if (current < 40)    setNavVisible(true)
      else if (delta > 6)  setNavVisible(false)
      else if (delta < -6) setNavVisible(true)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isFirstAccess) {
    return <ProfileSetup onComplete={setProfile} />
  }

  // Perfil é acessado via avatar no header — não aparece na nav
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

      {/* Bottom nav — oculto na tela de perfil */}
      {!showProfile && (
        <nav className={`bottom-nav${navVisible ? '' : ' nav-hidden'}`}>
          <div className="bottom-nav-inner">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
              >
                <span className="nav-tab-icon">{tab.icon}</span>
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
