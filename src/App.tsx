import { useState, useEffect } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Progress from './components/Progress'
import Calculator from './components/Calculator'
import Footer from './components/Footer'
import ProfileSetup from './components/ProfileSetup'
import { useDarkMode } from './hooks/useDarkMode'
import { Tab, UserProfile } from './types'

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  startWeight: 90,
  goalWeight: 70,
  height: 170,
  startDate: new Date().toISOString().split('T')[0],
  currentDose: 2.5,
  weightHistory: [],
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('tizetrack_profile')
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch { /* */ }
  return DEFAULT_PROFILE
}

export default function App() {
  const { isDark, toggle } = useDarkMode()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [profile, setProfile] = useState<UserProfile>(loadProfile)

  const isFirstAccess = !profile.name

  useEffect(() => {
    localStorage.setItem('tizetrack_profile', JSON.stringify(profile))
  }, [profile])

  function handleSetupComplete(newProfile: UserProfile) {
    setProfile(newProfile)
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Início', icon: '🏠' },
    { id: 'progress', label: 'Progresso', icon: '⚖️' },
    { id: 'calculator', label: 'Calcular', icon: '💉' },
  ]

  function renderTab() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            profile={profile}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )
      case 'progress':
        return (
          <Progress
            profile={profile}
            onUpdateProfile={setProfile}
          />
        )
      case 'calculator':
        return <Calculator />
    }
  }

  if (isFirstAccess) {
    return <ProfileSetup onComplete={handleSetupComplete} />
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg)', transition: 'background-color 0.3s ease' }}
    >
      <Header isDark={isDark} onToggle={toggle} />

      {/* Navegação por abas */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '8px 16px',
          position: 'sticky',
          top: '72px',
          zIndex: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'var(--surface-2)',
            borderRadius: '12px',
            padding: '4px',
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ marginRight: '4px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-grow max-w-lg w-full mx-auto px-4 py-6">
        {renderTab()}
      </main>

      <Footer />
    </div>
  )
}
