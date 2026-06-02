export default function Header() {
  return (
    <header className="bg-gradient-to-b from-tize-dark-bg via-tize-dark-bg to-tize-dark-bg border-b border-glass sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4">
          {/* Logo/Ícone */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-tize-purple to-tize-lilac-2 rounded-16 flex items-center justify-center font-jakarta font-bold text-lg text-tize-text shadow-lg">
              MT
            </div>
          </div>

          {/* Texto */}
          <div>
            <h1 className="text-3xl font-jakarta font-800 text-tize-lilac-2">Minha Tize</h1>
            <p className="text-sm text-tize-text-secondary font-medium">
              Calculadora de dose com seringa de insulina
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
