export default function Header() {
  return (
    <header className="bg-gradient-to-r from-tize-dark to-tize-blue text-white shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          {/* Logo/Ícone */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-tize-gold rounded-lg flex items-center justify-center font-bold text-tize-dark text-lg shadow-md">
              MT
            </div>
          </div>

          {/* Texto */}
          <div>
            <h1 className="text-2xl font-bold leading-tight">Minha Tize</h1>
            <p className="text-sm text-gray-300">
              Calculadora de dose com seringa de insulina
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
