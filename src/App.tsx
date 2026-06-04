import { useState, useEffect } from 'react'
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
  startWeight: 90,
  goalWeight: 70,
  height: 170,
  startDate: new Date().toISOString().split('T')[0],
  currentDose: 2.5,
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
    { id: 'dashboard',  label: 'Início',    icon: '🏠' },
    { id: 'progress',   label: 'Progresso', icon: '📊' },
    { id: 'calculator', label: 'Calcular',  icon: '💉' },
    { id: 'health',     label: 'Saúde',     icon: '🌿' },
    { id: 'settings',   label: 'Perfil',    icon: '⚙️' },
  ]

  function renderTab() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            profile={profile}
            onUpdateProfile={setProfile}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )
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
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '6px 12px',
        position: 'sticky',
        top: '66px',
        zIndex: 40,
      }}>
        <div style={{
          display: 'flex', gap: '4px',
          background: 'var(--surface-2)',
          borderRadius: '12px', padding: '3px',
          maxWidth: '480px', margin: '0 auto',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontSize: '10px', padding: '6px 2px' }}
            >
              <span style={{ display: 'block', fontSize: '15px', marginBottom: '1px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-grow max-w-lg w-full mx-auto px-4 py-6" key={activeTab}>
        {renderTab()}
      </main>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: '32px' }}>
      <div style={{ maxWidth: '512px', margin: '0 auto', padding: '24px 16px' }}>
        <div className="card-warning">
          <p style={{ fontSize: '12px', color: 'var(--warn-text)', lineHeight: 1.5 }}>
            ⚠️ TizeTrack é uma ferramenta educativa e informativa. Não substitui orientação médica, farmacêutica ou nutricional. Qualquer ajuste de dose deve ser feito com acompanhamento profissional.
          </p>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
          © 2026 TizeTrack · v2.1.0
        </p>
      </div>
    </footer>
  )
}
