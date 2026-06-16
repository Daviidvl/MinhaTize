import { useState } from 'react'
import { ArrowLeft, FileText, Shield, AlertTriangle, XCircle, Database } from 'lucide-react'

export type LegalDoc = 'termos' | 'privacidade' | 'disclaimer' | 'cancelamento' | 'cookies'

interface Props {
  initialDoc?: LegalDoc
  onBack?: () => void
}

const DOCS: { id: LegalDoc; label: string; icon: React.ReactNode }[] = [
  { id: 'termos',       label: 'Termos de Uso',        icon: <FileText   size={14} strokeWidth={2} /> },
  { id: 'privacidade',  label: 'Privacidade',           icon: <Shield     size={14} strokeWidth={2} /> },
  { id: 'disclaimer',   label: 'Aviso Médico',          icon: <AlertTriangle size={14} strokeWidth={2} /> },
  { id: 'cancelamento', label: 'Cancelamento',          icon: <XCircle    size={14} strokeWidth={2} /> },
  { id: 'cookies',      label: 'Armazenamento',         icon: <Database   size={14} strokeWidth={2} /> },
]

// ─── Helpers de formatação ────────────────────────────────────────────────────
const s = {
  section: { marginBottom: '28px' } as React.CSSProperties,
  h2: {
    fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)',
    margin: '0 0 14px', letterSpacing: '-0.3px',
  } as React.CSSProperties,
  h3: {
    fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)',
    margin: '16px 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  } as React.CSSProperties,
  p: {
    fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0 0 10px',
  } as React.CSSProperties,
  warn: {
    padding: '12px 14px',
    background: 'rgba(239,68,68,0.07)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '10px', margin: '0 0 14px',
    fontSize: '13px', color: 'var(--danger-text)', lineHeight: 1.65,
  } as React.CSSProperties,
  info: {
    padding: '12px 14px',
    background: 'rgba(37,99,235,0.07)',
    border: '1px solid rgba(37,99,235,0.18)',
    borderRadius: '10px', margin: '0 0 14px',
    fontSize: '13px', color: 'var(--info-text)', lineHeight: 1.65,
  } as React.CSSProperties,
  li: {
    fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '4px',
  } as React.CSSProperties,
}

// ─── Termos de Uso ────────────────────────────────────────────────────────────
function Termos() {
  return (
    <>
      <div style={{ ...s.info, marginBottom: '20px' }}>
        <strong>Versão 1.0 — Junho de 2026</strong><br />
        Leia atentamente antes de utilizar a plataforma.
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>1. Identificação</h2>
        <p style={s.p}>
          MinhaTize é uma plataforma digital de acompanhamento educativo desenvolvida para pessoas que utilizam
          análogos de GLP-1/GIP (como tirzepatida e semaglutida) sob prescrição e supervisão médica. O serviço
          é disponibilizado no endereço <strong style={{ color: 'var(--text-primary)' }}>minhatize.vercel.app</strong>.
        </p>
        <p style={s.p}>
          Contato: <strong style={{ color: 'var(--text-primary)' }}>contato@minhatize.com.br</strong>
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>2. Natureza do Serviço</h2>
        <div style={s.warn}>
          O MinhaTize é um serviço <strong>EXCLUSIVAMENTE EDUCATIVO E INFORMATIVO</strong>.
          Não é um serviço de saúde, não constitui consultório médico ou nutricional virtual,
          não realiza diagnósticos, não prescreve medicamentos ou dietas e não substitui a
          avaliação de profissional de saúde habilitado.
        </div>
        <p style={s.p}>
          Todas as informações, cálculos, sugestões de alimentação, protocolos nutricionais e demais
          conteúdos têm finalidade educativa. O usuário é inteiramente responsável por qualquer decisão
          relacionada à sua saúde, devendo sempre consultar médico, farmacêutico ou nutricionista
          habilitado antes de qualquer alteração em seu protocolo terapêutico ou alimentar.
        </p>
        <p style={s.p}>
          Os resultados obtidos (perda de peso, melhora de exames laboratoriais etc.) dependem de
          inúmeros fatores individuais e <strong style={{ color: 'var(--text-primary)' }}>não são garantidos</strong> pela plataforma.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>3. Requisitos de Acesso</h2>
        <h3 style={s.h3}>3.1 Maioridade</h3>
        <p style={s.p}>
          O MinhaTize é destinado exclusivamente a pessoas <strong style={{ color: 'var(--text-primary)' }}>maiores de 18 (dezoito) anos</strong>.
          É proibido o uso por menores de idade.
        </p>
        <h3 style={s.h3}>3.2 Prescrição Médica</h3>
        <p style={s.p}>
          Os medicamentos referenciados nesta plataforma (tirzepatida, semaglutida, ozempic, wegovy, mounjaro)
          são <strong style={{ color: 'var(--text-primary)' }}>medicamentos controlados que exigem prescrição médica válida</strong>.
          Ao utilizar este serviço, o usuário declara possuir prescrição médica vigente emitida por profissional
          habilitado para o medicamento utilizado.
        </p>
        <h3 style={s.h3}>3.3 Acesso Individual</h3>
        <p style={s.p}>
          O acesso é individual e intransferível, vinculado ao token enviado ao e-mail cadastrado na compra.
          É proibido compartilhar o link de acesso com terceiros.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>4. Funcionalidades e Limitações</h2>
        <h3 style={s.h3}>4.1 Calculadora de Doses</h3>
        <p style={s.p}>
          Realiza cálculos matemáticos de conversão de unidades para referência educativa.
          Não substitui a orientação do médico ou farmacêutico responsável pelo protocolo.
        </p>
        <h3 style={s.h3}>4.2 Guia Alimentar</h3>
        <p style={s.p}>
          Os planos e sugestões alimentares têm caráter educativo geral. Não constituem prescrição
          dietética e não substituem avaliação nutricional individualizada por nutricionista habilitado (CRN).
        </p>
        <h3 style={s.h3}>4.3 Protocolo de Desmame</h3>
        <p style={s.p}>
          As sugestões de redução gradual de dose têm finalidade educativa. Qualquer alteração ou
          interrupção de medicamento controlado deve ser feita exclusivamente sob orientação médica.
        </p>
        <h3 style={s.h3}>4.4 Relatório Anti-Platô</h3>
        <p style={s.p}>
          Gerado por inteligência artificial com finalidade educativa. Não constitui diagnóstico,
          avaliação médica ou prescrição de qualquer espécie.
        </p>
        <h3 style={s.h3}>4.5 Exames Laboratoriais</h3>
        <p style={s.p}>
          Os valores de referência são gerais e podem variar entre laboratórios. A plataforma não
          realiza diagnóstico. Resultados devem ser interpretados pelo médico responsável.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>5. Obrigações do Usuário</h2>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          {[
            'Fornecer informações verdadeiras no perfil.',
            'Utilizar a plataforma exclusivamente para fins pessoais e educativos.',
            'Não tentar burlar o sistema de tokens ou acessar contas de terceiros.',
            'Não reproduzir, copiar ou distribuir o conteúdo da plataforma sem autorização.',
            'Não utilizar a plataforma para fins comerciais sem autorização prévia.',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>6. Propriedade Intelectual</h2>
        <p style={s.p}>
          Todo o conteúdo da plataforma (textos, algoritmos, layouts, marca, protocolos educativos)
          é de propriedade do MinhaTize e está protegido pela Lei 9.279/96 e demais normas de
          propriedade intelectual. O acesso não confere ao usuário qualquer direito de reprodução
          ou exploração comercial do conteúdo.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>7. Limitação de Responsabilidade</h2>
        <p style={s.p}>
          O MinhaTize não se responsabiliza por: (a) decisões de saúde tomadas sem orientação
          profissional; (b) alterações não autorizadas de dose de medicamento; (c) reações adversas
          a medicamentos ou alimentos; (d) indisponibilidade temporária do serviço; (e) perda de
          dados locais por falha de dispositivo ou navegador.
        </p>
        <p style={s.p}>
          Em nenhuma hipótese a responsabilidade total do MinhaTize excederá o valor pago pelo
          usuário pelo acesso ao serviço.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>8. Modificações</h2>
        <p style={s.p}>
          Mudanças significativas serão comunicadas por e-mail com antecedência mínima de 15 dias.
          O uso contínuo após a vigência da nova versão constitui aceite.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>9. Lei Aplicável e Foro</h2>
        <p style={s.p}>
          Estes Termos são regidos pela legislação brasileira. Eventuais litígios serão submetidos
          ao Juizado Especial Cível competente conforme domicílio do consumidor, nos termos da
          Lei 8.078/90 (CDC).
        </p>
      </div>
    </>
  )
}

// ─── Política de Privacidade ──────────────────────────────────────────────────
function Privacidade() {
  return (
    <>
      <div style={{ ...s.info, marginBottom: '20px' }}>
        <strong>Versão 1.0 — Junho de 2026</strong><br />
        Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>1. Controlador dos Dados</h2>
        <p style={s.p}>
          <strong style={{ color: 'var(--text-primary)' }}>MinhaTize — Plataforma Digital de Acompanhamento Educativo</strong><br />
          E-mail do encarregado (DPO): <strong style={{ color: 'var(--text-primary)' }}>privacidade@minhatize.com.br</strong>
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>2. Dados Pessoais Coletados</h2>
        <h3 style={s.h3}>2.1 Dados de perfil (fornecidos por você)</h3>
        <ul style={{ paddingLeft: '16px', margin: '0 0 10px' }}>
          {['Nome ou apelido', 'Idade', 'Sexo', 'Altura e peso (inicial, atual, histórico)', 'Meta de peso', 'Medicamento em uso e dosagem', 'Data de início do protocolo', 'Dia de aplicação do medicamento'].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>

        <h3 style={s.h3}>2.2 Dados de saúde sensíveis (Art. 11 LGPD)</h3>
        <div style={s.warn}>
          Estes dados são categoria especialmente protegida pela LGPD e seu tratamento exige
          consentimento explícito e específico.
        </div>
        <ul style={{ paddingLeft: '16px', margin: '0 0 10px' }}>
          {[
            'Resultados de exames laboratoriais (quando inseridos voluntariamente)',
            'Registro de efeitos colaterais e sintomas',
            'Diário pessoal de saúde e notas',
            'Registro de aplicações do medicamento',
            'Log alimentar e plano anti-platô',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>

        <h3 style={s.h3}>2.3 Dados coletados automaticamente</h3>
        <ul style={{ paddingLeft: '16px', margin: '0 0 10px' }}>
          {[
            'Endereço IP (processado temporariamente para segurança — rate limiting)',
            'Endereço de e-mail (coletado na compra, armazenado no banco de tokens)',
            'Token de acesso único',
            'Data e versão do consentimento LGPD',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>3. Armazenamento dos Dados</h2>
        <h3 style={s.h3}>3.1 Dados locais (no seu dispositivo)</h3>
        <p style={s.p}>
          Perfil, histórico de peso, exames, diário, log alimentar, efeitos colaterais e planos
          são armazenados <strong style={{ color: 'var(--text-primary)' }}>exclusivamente no localStorage do seu dispositivo</strong>.
          Esses dados <strong style={{ color: 'var(--text-primary)' }}>NÃO são enviados aos nossos servidores</strong> e ficam
          sob seu controle absoluto.
        </p>
        <h3 style={s.h3}>3.2 Dados no servidor</h3>
        <p style={s.p}>
          E-mail, token de acesso e registro de consentimento são armazenados no banco de dados
          Supabase (servidores nos EUA) com criptografia em trânsito (TLS) e em repouso (AES-256).
        </p>
        <h3 style={s.h3}>3.3 Relatório Anti-Platô</h3>
        <p style={s.p}>
          Ao gerar o relatório, os dados do questionário são enviados de forma anônima à API da
          Anthropic (EUA). <strong style={{ color: 'var(--text-primary)' }}>Nenhum dado identificador</strong> (nome, e-mail, token)
          é transmitido.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>4. Finalidade e Base Legal</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { dado: 'Dados de perfil e saúde', finalidade: 'Acompanhamento educativo pelo próprio usuário', base: 'Consentimento (Art. 7, I e Art. 11, I)' },
            { dado: 'E-mail e token', finalidade: 'Autenticação e entrega do acesso', base: 'Execução de contrato (Art. 7, V)' },
            { dado: 'Registro de consentimento', finalidade: 'Cumprimento de obrigação legal (LGPD Art. 8)', base: 'Obrigação legal (Art. 7, II)' },
            { dado: 'IP', finalidade: 'Prevenção de abuso e segurança', base: 'Legítimo interesse (Art. 7, IX)' },
          ].map((row, i) => (
            <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ ...s.p, margin: 0, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{row.dado}</p>
              <p style={{ ...s.p, margin: '2px 0 0', fontSize: '12px' }}>{row.finalidade} — <em>{row.base}</em></p>
            </div>
          ))}
        </div>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>5. Compartilhamento de Dados</h2>
        <p style={s.p}>
          <strong style={{ color: 'var(--text-primary)' }}>Não vendemos dados a terceiros.</strong> Compartilhamos apenas com:
        </p>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          {[
            'Supabase Inc. (EUA) — armazenamento do token de acesso e consentimento',
            'Resend Inc. (EUA) — envio do e-mail de boas-vindas',
            'Anthropic PBC (EUA) — geração do relatório educativo (sem dados identificadores)',
            'Wiven / Hotmart — processamento do pagamento (sujeito às políticas de cada plataforma)',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>6. Transferência Internacional</h2>
        <p style={s.p}>
          Supabase, Resend e Anthropic operam nos Estados Unidos. A transferência é realizada com
          salvaguardas adequadas (cláusulas contratuais padrão e políticas de privacidade dos
          prestadores) conforme Art. 33 da LGPD.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>7. Retenção de Dados</h2>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          {[
            'Dados locais: sob controle exclusivo do usuário; permanecem no dispositivo até serem apagados.',
            'Token de acesso: mantido pelo período de vigência do acesso adquirido.',
            'Registro de consentimento: mantido pelo prazo exigido pela LGPD (enquanto o consentimento for necessário para a relação).',
            'Logs de IP: não são retidos após o processamento da requisição.',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>8. Seus Direitos (Art. 18 LGPD)</h2>
        <p style={s.p}>Você tem direito a:</p>
        <ul style={{ paddingLeft: '16px', margin: '0 0 14px' }}>
          {[
            'Confirmação da existência de tratamento',
            'Acesso aos dados pessoais',
            'Correção de dados incompletos, inexatos ou desatualizados',
            'Anonimização, bloqueio ou eliminação de dados desnecessários',
            'Portabilidade dos dados a outro fornecedor',
            'Eliminação dos dados tratados com base no consentimento',
            'Informação sobre compartilhamento com terceiros',
            'Revogação do consentimento a qualquer momento',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>
        <p style={s.p}>
          Para exercer seus direitos, envie e-mail para{' '}
          <strong style={{ color: 'var(--text-primary)' }}>privacidade@minhatize.com.br</strong>.
          Responderemos em até <strong style={{ color: 'var(--text-primary)' }}>15 dias úteis</strong>.
        </p>
        <p style={s.p}>
          Dados locais podem ser exportados (Perfil → Legal → Exportar dados) ou excluídos
          (Perfil → Legal → Revogar consentimento) diretamente no app.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>9. Segurança</h2>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          {[
            'Comunicação criptografada via HTTPS/TLS',
            'Headers de segurança (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)',
            'Rate limiting em todas as rotas de API',
            'Tokens de acesso únicos por compra (UUID v4)',
            'Comparação timing-safe do segredo do webhook',
            'Dados de saúde armazenados localmente, nunca transmitidos ao servidor',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>10. Menores de Idade</h2>
        <p style={s.p}>
          O MinhaTize não é destinado a menores de 18 anos. Não coletamos intencionalmente dados
          de menores. Caso identificados, procederemos à exclusão imediata.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>11. Contato e DPO</h2>
        <p style={s.p}>
          Encarregado de Proteção de Dados (DPO):<br />
          <strong style={{ color: 'var(--text-primary)' }}>privacidade@minhatize.com.br</strong>
        </p>
      </div>
    </>
  )
}

// ─── Disclaimer Médico / Nutricional ─────────────────────────────────────────
function Disclaimer() {
  return (
    <>
      <div style={{ ...s.warn, marginBottom: '20px', fontSize: '14px' }}>
        <strong>LEIA COM ATENÇÃO.</strong> Este aviso é parte essencial dos Termos de Uso e
        define os limites legais e éticos do serviço MinhaTize.
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>1. Natureza Educativa — Não É Serviço Médico</h2>
        <p style={s.p}>
          O MinhaTize é uma plataforma <strong style={{ color: 'var(--text-primary)' }}>educativa e informativa</strong>.
          Nenhum conteúdo disponibilizado constitui:
        </p>
        <ul style={{ paddingLeft: '16px', margin: '0 0 14px' }}>
          {[
            'Diagnóstico médico de qualquer natureza',
            'Prescrição de medicamentos, suplementos ou dietas',
            'Consulta médica, farmacêutica ou nutricional',
            'Avaliação clínica ou laboratorial',
            'Garantia de resultado terapêutico ou estético',
            'Substituição de acompanhamento profissional',
          ].map((item, i) => (
            <li key={i} style={{ ...s.li, color: 'var(--danger-text)' }}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>2. Medicamentos GLP-1 e GIP/GLP-1</h2>
        <div style={s.warn}>
          Tirzepatida, semaglutida, ozempic, wegovy e mounjaro são medicamentos controlados
          que exigem <strong>prescrição médica válida</strong> para aquisição e uso. Sua
          administração, dosagem e interrupção devem ser orientadas exclusivamente pelo
          médico prescritor.
        </div>
        <p style={s.p}>
          Os cálculos de dose apresentados na aba "Calcular" são referências matemáticas
          (conversão mg → UI de seringa de insulina) para fins educativos. A dose real
          a ser utilizada é definida exclusivamente pelo médico prescritor e pode diferir
          dos valores calculados.
        </p>
        <p style={s.p}>
          O protocolo de desmame apresentado no app é baseado em práticas educativas gerais
          amplamente discutidas na literatura científica. Não constitui prescrição. A
          interrupção de qualquer medicamento GLP-1 deve ser supervisionada por médico.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>3. Plano Alimentar e Guia Nutricional</h2>
        <p style={s.p}>
          As sugestões alimentares, planos calóricos e guias de refeição têm caráter
          <strong style={{ color: 'var(--text-primary)' }}> educativo e geral</strong>. Não
          constituem prescrição dietética e não substituem avaliação individualizada por
          nutricionista inscrito no CRN (Conselho Regional de Nutricionistas).
        </p>
        <p style={s.p}>
          Necessidades calóricas, distribuição de macronutrientes e restrições alimentares
          variam individualmente. Condições como diabetes, hipertensão, doenças renais,
          hepáticas ou outras comorbidades exigem plano alimentar elaborado por nutricionista.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>4. Exames Laboratoriais</h2>
        <p style={s.p}>
          Os valores de referência exibidos são baseados em literatura científica geral e podem
          variar entre laboratórios, métodos analíticos, faixa etária e contexto clínico. A
          plataforma não realiza diagnóstico. Resultados laboratoriais devem ser interpretados
          pelo médico responsável pelo acompanhamento.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>5. Relatório Educativo (Anti-Platô)</h2>
        <p style={s.p}>
          O relatório gerado por inteligência artificial é baseado em respostas de um questionário
          educativo e tem finalidade exclusivamente informativa. Não constitui avaliação médica,
          diagnóstico de platô terapêutico ou prescrição de intervenção. O texto gerado não deve
          ser interpretado como recomendação clínica individualizada.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>6. Sem Garantia de Resultados</h2>
        <div style={s.warn}>
          O MinhaTize NÃO garante perda de peso, melhora de exames, remissão de condições de
          saúde ou qualquer outro resultado terapêutico. Os resultados dependem de fatores
          individuais como adesão ao tratamento, condições de saúde preexistentes, orientação
          médica e nutricional, e resposta individual ao medicamento.
        </div>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>7. Emergências Médicas</h2>
        <div style={s.warn}>
          Em caso de emergência médica, NÃO consulte este aplicativo. Ligue imediatamente para:
          <br /><strong>SAMU: 192 | Bombeiros: 193 | CVV (crise emocional): 188</strong>
        </div>
        <p style={s.p}>
          Procure atendimento médico imediato em caso de: reação alérgica grave, dificuldade
          respiratória, dor no peito, perda de consciência, vômitos ou diarreia intensos com
          desidratação, pensamentos suicidas ou de autolesão.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>8. Regulamentação</h2>
        <p style={s.p}>
          O MinhaTize opera em conformidade com as diretrizes do Conselho Federal de Medicina
          (CFM), Conselho Federal de Nutricionistas (CFN), Conselho Federal de Farmácia (CFF)
          e ANVISA no que se refere a serviços digitais de informação em saúde. A plataforma
          não se enquadra como dispositivo médico (SaMD) por ter finalidade exclusivamente educativa.
        </p>
      </div>
    </>
  )
}

// ─── Política de Cancelamento ─────────────────────────────────────────────────
function Cancelamento() {
  return (
    <>
      <div style={{ ...s.info, marginBottom: '20px' }}>
        <strong>Versão 1.0 — Junho de 2026</strong>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>1. Modelo de Acesso</h2>
        <p style={s.p}>
          O MinhaTize é comercializado como um <strong style={{ color: 'var(--text-primary)' }}>produto digital de acesso único</strong>,
          sem assinatura recorrente ou renovação automática. O pagamento único concede acesso
          vitalício ao conteúdo e às funcionalidades disponíveis na data da compra.
        </p>
        <p style={s.p}>
          O acesso é entregue via token único enviado ao e-mail cadastrado na plataforma de pagamento.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>2. Direito de Arrependimento (CDC Art. 49)</h2>
        <div style={{ ...s.info }}>
          Nos termos do Art. 49 da Lei 8.078/90 (Código de Defesa do Consumidor), você tem
          direito ao <strong>cancelamento e reembolso integral em até 7 dias corridos</strong> a
          partir da data da compra, sem necessidade de justificativa.
        </div>
        <p style={s.p}>
          Para exercer o direito de arrependimento dentro do prazo legal:
        </p>
        <ul style={{ paddingLeft: '16px', margin: '0 0 14px' }}>
          <li style={s.li}>Envie e-mail para <strong style={{ color: 'var(--text-primary)' }}>contato@minhatize.com.br</strong> com assunto "Cancelamento — Arrependimento"</li>
          <li style={s.li}>Ou solicite diretamente pela plataforma onde realizou a compra (Wiven, Hotmart)</li>
          <li style={s.li}>O reembolso será processado em até 7 dias úteis pelo meio de pagamento original</li>
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>3. Cancelamento Após 7 Dias</h2>
        <p style={s.p}>
          Após o prazo de 7 dias, o produto digital entregue (acesso ao app) não dá direito a
          reembolso automático, pois o bem digital foi disponibilizado integralmente. Casos
          excepcionais (falha técnica comprovada, entrega incorreta) serão analisados individualmente.
        </p>
        <p style={s.p}>
          Para solicitações fora do prazo legal, entre em contato:
          <strong style={{ color: 'var(--text-primary)' }}> contato@minhatize.com.br</strong>
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>4. Plataformas de Pagamento</h2>
        <p style={s.p}>
          O processamento de pagamento é realizado por plataformas parceiras (Wiven, Hotmart).
          Cada plataforma possui sua própria política de reembolso, que se aplica cumulativamente
          a esta política. Em caso de divergência, prevalece o CDC.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>5. Dados Após Cancelamento</h2>
        <p style={s.p}>
          Após o cancelamento, o token de acesso é desativado no banco de dados. Os dados
          armazenados localmente no dispositivo permanecem sob controle do usuário. O usuário
          pode exportar todos os dados antes do cancelamento (Perfil → Legal → Exportar dados).
        </p>
        <p style={s.p}>
          Para solicitar a exclusão do e-mail e token do nosso banco de dados, envie e-mail para
          <strong style={{ color: 'var(--text-primary)' }}> privacidade@minhatize.com.br</strong>.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>6. Contato</h2>
        <p style={s.p}>
          Cancelamentos e dúvidas: <strong style={{ color: 'var(--text-primary)' }}>contato@minhatize.com.br</strong><br />
          Proteção de dados: <strong style={{ color: 'var(--text-primary)' }}>privacidade@minhatize.com.br</strong>
        </p>
      </div>
    </>
  )
}

// ─── Política de Armazenamento Local (Cookies) ────────────────────────────────
function Cookies() {
  return (
    <>
      <div style={{ ...s.info, marginBottom: '20px' }}>
        <strong>Versão 1.0 — Junho de 2026</strong><br />
        O MinhaTize não utiliza cookies de rastreamento.
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>1. O Que Usamos</h2>
        <p style={s.p}>
          O MinhaTize utiliza <strong style={{ color: 'var(--text-primary)' }}>localStorage do navegador</strong> para
          armazenar dados do aplicativo no seu dispositivo. Não utilizamos cookies HTTP tradicionais,
          pixels de rastreamento, tecnologias de fingerprinting ou plataformas de analytics de terceiros.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>2. Dados Armazenados Localmente</h2>
        <p style={s.p}>Todos os dados abaixo ficam <strong style={{ color: 'var(--text-primary)' }}>apenas no seu dispositivo</strong>:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { chave: 'tizetrack_profile', desc: 'Perfil do usuário (nome, peso, medicamento, histórico)' },
            { chave: 'tizetrack_token', desc: 'Token de acesso ao app' },
            { chave: 'tizetrack_consent', desc: 'Data e versão do aceite dos Termos de Uso (LGPD)' },
            { chave: 'tizetrack_diet', desc: 'Configuração do plano alimentar (sexo, kcal diária)' },
            { chave: 'tizetrack_food_log', desc: 'Log de refeições registradas' },
            { chave: 'tizetrack_antiplato', desc: 'Plano e respostas do módulo anti-platô' },
            { chave: 'tizetrack_workout', desc: 'Treinos cadastrados' },
            { chave: 'tizetrack_workout_log', desc: 'Log de treinos realizados' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <code style={{ fontSize: '11px', color: 'rgba(147,197,253,0.9)', display: 'block', marginBottom: '2px' }}>{item.chave}</code>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>3. Service Worker (Funcionamento Offline)</h2>
        <p style={s.p}>
          O MinhaTize utiliza um Service Worker para funcionar offline como PWA (Progressive Web App).
          O Service Worker armazena em cache os arquivos estáticos do app (HTML, CSS, JavaScript, imagens).
          Não armazena dados pessoais em cache e não realiza rastreamento.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>4. Sem Rastreamento</h2>
        <p style={s.p}>
          O MinhaTize <strong style={{ color: 'var(--text-primary)' }}>não utiliza</strong>:
        </p>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          {[
            'Google Analytics ou similares',
            'Facebook Pixel ou SDK de redes sociais',
            'Hotjar, Clarity ou ferramentas de heatmap',
            'Publicidade comportamental',
            'Fingerprinting de dispositivo',
          ].map((item, i) => (
            <li key={i} style={s.li}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>5. Como Limpar os Dados</h2>
        <p style={s.p}>Você pode remover todos os dados armazenados localmente de duas formas:</p>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          <li style={s.li}>
            <strong style={{ color: 'var(--text-primary)' }}>Pelo app:</strong> Perfil → Legal → "Revogar e apagar dados"
          </li>
          <li style={s.li}>
            <strong style={{ color: 'var(--text-primary)' }}>Pelo navegador:</strong> Configurações → Privacidade → Limpar dados do site → minhatize.vercel.app
          </li>
        </ul>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>6. Consentimento de Armazenamento</h2>
        <p style={s.p}>
          O armazenamento local é iniciado apenas após o aceite dos Termos de Uso e da Política de
          Privacidade na tela de consentimento. Ao revogar o consentimento, todos os dados locais
          são apagados automaticamente.
        </p>
      </div>
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LegalPage({ initialDoc = 'termos', onBack }: Props) {
  const [activeDoc, setActiveDoc] = useState<LegalDoc>(initialDoc)

  function renderContent() {
    switch (activeDoc) {
      case 'termos':       return <Termos />
      case 'privacidade':  return <Privacidade />
      case 'disclaimer':   return <Disclaimer />
      case 'cancelamento': return <Cancelamento />
      case 'cookies':      return <Cookies />
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>

      {/* Header fixo */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        maxWidth: '100%',
      }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px',
              fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, padding: 0,
            }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Voltar
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: onBack ? 'center' : 'flex-start' }}>
          <img src="/LogoPng.png" alt="MinhaTize" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>MinhaTize</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>— Central Legal</span>
        </div>
        {onBack && <div style={{ width: '60px' }} />}
      </div>

      {/* Tabs de documentos */}
      <div style={{
        overflowX: 'auto',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--bg)',
        scrollbarWidth: 'none',
      }}>
        <div style={{ display: 'flex', padding: '0 12px', minWidth: 'max-content' }}>
          {DOCS.map(doc => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '12px 14px', border: 'none', cursor: 'pointer',
                background: 'none', fontFamily: 'Inter, sans-serif',
                fontSize: '12px', fontWeight: activeDoc === doc.id ? 700 : 500,
                color: activeDoc === doc.id ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: `2px solid ${activeDoc === doc.id ? 'var(--primary)' : 'transparent'}`,
                marginBottom: '-1px', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ color: activeDoc === doc.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                {doc.icon}
              </span>
              {doc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{
        flex: 1, overflowY: 'auto',
        maxWidth: '680px', width: '100%', margin: '0 auto',
        padding: '28px 20px 48px',
      }}>
        {renderContent()}
      </div>
    </div>
  )
}
