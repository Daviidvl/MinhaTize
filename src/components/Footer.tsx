export default function Footer() {
  return (
    <footer className="bg-tize-dark-bg border-t border-glass mt-16">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Aviso Legal */}
        <div className="bg-tize-warning-bg border border-[rgba(239,159,39,0.3)] rounded-16 p-6">
          <h3 className="font-jakarta font-700 text-[#EF9F27] text-base mb-3 flex items-center gap-2">
            ⚠️ Aviso Legal Importante
          </h3>
          <p className="text-xs font-jakarta text-tize-text-secondary leading-relaxed">
            Esta calculadora possui finalidade exclusivamente educativa e informativa. Os
            resultados apresentados são estimativas matemáticas baseadas nos dados
            informados pelo usuário. Qualquer ajuste de dose deve ser realizado com
            acompanhamento médico. Minha Tize não substitui orientação médica,
            farmacêutica ou nutricional.
          </p>
        </div>

        {/* Grid de Info */}
        <div className="grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="font-jakarta font-600 text-tize-lilac-1 text-xs uppercase tracking-wider mb-2">
              Versão
            </p>
            <p className="text-sm font-jakarta font-500 text-tize-text">1.0.0</p>
          </div>
          <div>
            <p className="font-jakarta font-600 text-tize-lilac-1 text-xs uppercase tracking-wider mb-2">
              Atualizado
            </p>
            <p className="text-sm font-jakarta font-500 text-tize-text">Junho 2026</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-glass space-y-2">
          <p className="text-xs font-jakarta text-tize-text-secondary">
            © 2026 Minha Tize. Todos os direitos reservados.
          </p>
          <p className="text-xs font-jakarta text-tize-text-secondary">
            Desenvolvido com 💜 para usuários de Tirzepatida
          </p>
        </div>
      </div>
    </footer>
  )
}
