import Header from './components/Header'
import Calculator from './components/Calculator'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-tize-dark-bg flex flex-col">
      <Header />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12">
        <Calculator />
      </main>

      <Footer />
    </div>
  )
}
