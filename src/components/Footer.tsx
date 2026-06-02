export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Aviso Legal */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h3 className="font-bold text-yellow-900 text-sm mb-2">
            ⚠️ Aviso Legal Importante
          </h3>
          <p className="text-xs text-yellow-800 leading-relaxed">
            Esta calculadora possui finalidade exclusivamente educativa e informativa. Os
            resultados apresentados são estimativas matemáticas baseadas nos dados
            informados pelo usuário. Qualquer ajuste de dose deve ser realizado com
            acompanhamento médico. Minha Tize não substitui orientação médica,
            farmacêutica ou nutricional.
          </p>
        </div>

        {/* Links e Info */}
        <div className="grid grid-cols-2 gap-4 text-center text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Versão</p>
            <p>1.0.0</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Atualizado</p>
            <p>Junho 2026</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>© 2026 Minha Tize. Todos os direitos reservados.</p>
          <p className="mt-1">
            Desenvolvido com ❤️ para usuários de Tirzepatida
          </p>
        </div>
      </div>
    </footer>
  )
}
