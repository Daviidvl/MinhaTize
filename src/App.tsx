import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Progress from './components/Progress'
import Calculator from './components/Calculator'
import HealthHub from './components/HealthHub'
import Settings from './components/Settings'
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

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard',  icon: '🏠', label: 'Início'    },
  { id: 'progress',   icon: '📊', label: 'Progresso' },
  { id: 'calculator', icon: '💉', label: 'Calcular'  },
  { id: 'health',     icon: '🌿', label: 'Saúde'     },
  { id: 'settings',   icon: '⚙️', label: 'Perfil'    },
]

export default function App() {
  const { isDark, toggle } = useDarkMode()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [profile, setProfile] = useState<UserProfile>(loadProfile)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  const isFirstAccess = !profile.name

  useEffect(() => {
    localStorage.setItem('tizetrack_profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    function onScroll() {
      const current = window.scrollY
      const delta = current - lastScrollY.current
      if (current < 40)        setNavVisible(true)
      else if (delta > 6)      setNavVisible(false)
      else if (delta < -6)     setNavVisible(true)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isFirstAccess) {
    return <ProfileSetup onComplete={setProfile} />
  }

  function renderTab() {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile} onUpdateProfile={setProfile} onNavigate={setActiveTab} />
      case 'progress':
        return <Progress profile={profile} onUpdateProfile={setProfile} />
      case 'calculator':
        return <Calculator />
      case 'health':
        return <HealthHub profile={profile} onUpdateProfile={setProfile} />
      case 'settings':
        return <Settings profile={profile} onUpdateProfile={setProfile} />
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', transition: 'background 0.3s' }}>
      <Header isDark={isDark} onToggle={toggle} />

      <main className="main-content" style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px' }} key={activeTab}>
        {renderTab()}
      </main>

      {/* Bottom Navigation */}
      <nav className={`bottom-nav${navVisible ? '' : ' nav-hidden'}`}>
        <div className="bottom-nav-inner">
          {TABS.map(tab => (
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
    </div>
  )
}
