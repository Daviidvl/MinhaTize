import Header from './components/Header'
import Calculator from './components/Calculator'
import Footer from './components/Footer'
import { useDarkMode } from './hooks/useDarkMode'

export default function App() {
  const { isDark, toggle } = useDarkMode()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', transition: 'background-color 0.3s ease' }}>
      <Header isDark={isDark} onToggle={toggle} />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12">
        <Calculator />
      </main>

      <Footer />
    </div>
  )
}
