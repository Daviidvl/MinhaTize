import Header from './components/Header'
import Calculator from './components/Calculator'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-tize-light flex flex-col">
      <Header />

      <main className="flex-grow max-w-2xl w-full mx-auto px-4 py-8">
        <Calculator />
      </main>

      <Footer />
    </div>
  )
}
