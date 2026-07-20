import { useState } from 'react'
import { AlertTriangle, Shield, FileText, ChevronDown, Check } from 'lucide-react'
import { getStoredToken } from '../utils/token'
import { readJSON, writeJSON } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'

export const CONSENT_KEY     = STORAGE_KEYS.consent
export const CONSENT_VERSION = '1.0'

export function hasConsent(): boolean {
  const parsed = readJSON<{ version?: string } | null>(CONSENT_KEY, null)
  return parsed?.version === CONSENT_VERSION
}

export function saveConsent(): void {
  writeJSON(CONSENT_KEY, {
    date:    new Date().toISOString(),
    version: CONSENT_VERSION,
  })
  // Registrar no servidor (fire-and-forget — não bloqueia o usuário)
  const token = getStoredToken()
  if (token) {
    fetch('/api/register-consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ version: CONSENT_VERSION }),
    }).catch(() => { /* falha silenciosa — consentimento local já foi salvo */ })
  }
}

interface Props { onAccept: () => void }

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '14px 16px',
          background: open ? 'var(--surface-2)' : 'var(--surface)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
          {title}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{
          padding: '4px 16px 16px',
          fontSize: '12px', lineHeight: 1.75,
          color: 'var(--text-secondary)',
          maxHeight: '320px', overflowY: 'auto',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '10px 0' }}>{children}</p>
}
function H({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '14px 0 4px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</p>
}

// ─── Termos de Uso ────────────────────────────────────────────────────────────
function TermsContent() {
  return (
    <>
      <P><strong style={{ color: 'var(--text-primary)' }}>Versão 1.0 — Junho de 2026</strong></P>

      <H>1. Identificação do Serviço</H>
      <P>MinhaTize é uma plataforma digital de acompanhamento educativo desenvolvida para pessoas que utilizam análogos de GLP-1/GIP (como tirzepatida e semaglutida) sob prescrição e supervisão médica.</P>

      <H>2. Natureza Educativa — Limitações Fundamentais</H>
      <P><strong style={{ color: 'var(--danger-text)' }}>O MinhaTize é um serviço EXCLUSIVAMENTE EDUCATIVO E INFORMATIVO.</strong></P>
      <P>O MinhaTize NÃO é um serviço de saúde, NÃO constitui consultório médico virtual, NÃO realiza diagnósticos, NÃO prescreve medicamentos e NÃO substitui a avaliação de profissional de saúde habilitado.</P>
      <P>Todas as informações, cálculos, protocolos e sugestões apresentados têm finalidade meramente educativa. O usuário é inteiramente responsável por qualquer decisão relacionada à sua saúde, devendo sempre consultar médico, farmacêutico ou nutricionista habilitado antes de qualquer alteração em seu protocolo terapêutico.</P>
      <P>Os resultados obtidos no uso do aplicativo (perda de peso, valores laboratoriais, etc.) dependem de inúmeros fatores individuais e não constituem garantia ou promessa de resultado.</P>

      <H>3. Requisitos de Acesso</H>
      <P>O MinhaTize é destinado exclusivamente a pessoas <strong style={{ color: 'var(--text-primary)' }}>maiores de 18 (dezoito) anos</strong>.</P>
      <P>Os medicamentos referenciados nesta plataforma são medicamentos controlados que exigem <strong style={{ color: 'var(--text-primary)' }}>prescrição médica válida</strong>. Ao utilizar este serviço, você declara possuir prescrição médica vigente emitida por profissional habilitado para o medicamento informado em seu perfil.</P>
      <P>O acesso é individual e intransferível, vinculado ao token de acesso enviado ao e-mail cadastrado na compra.</P>

      <H>4. Calculadora de Doses</H>
      <P>A calculadora de doses disponível no app realiza cálculos matemáticos de conversão de unidades (mg para UI de seringa de insulina). Este cálculo é uma referência educativa e NÃO substitui a orientação do médico ou farmacêutico responsável pelo seu protocolo. Sempre confirme a dosagem com o profissional que prescreveu o medicamento.</P>

      <H>5. Protocolo de Desmame</H>
      <P>As sugestões de redução gradual de dose (desmame) apresentadas no app são baseadas em práticas educativas gerais e NÃO constituem prescrição médica. Qualquer alteração ou interrupção de medicamento controlado deve ser feita exclusivamente sob orientação do médico responsável.</P>

      <H>6. Limitação de Responsabilidade</H>
      <P>O MinhaTize não se responsabiliza por decisões tomadas com base em informações da plataforma sem orientação médica, por danos decorrentes de alterações não autorizadas de dose, descontinuação não orientada de medicamento ou adoção de dietas sem supervisão profissional.</P>
      <P>Em nenhuma hipótese a responsabilidade total do MinhaTize excederá o valor pago pelo usuário pelo acesso ao serviço.</P>

      <H>7. Cancelamento e Reembolso</H>
      <P>O acesso ao MinhaTize é adquirido através de plataformas parceiras. Políticas de reembolso e cancelamento são regidas pelas respectivas plataformas e pela Lei 8.078/90 (Código de Defesa do Consumidor), que prevê direito de arrependimento em até 7 dias após a compra para produtos adquiridos à distância.</P>

      <H>8. Modificações</H>
      <P>O MinhaTize se reserva o direito de modificar estes Termos. Mudanças significativas serão comunicadas por e-mail com antecedência mínima de 15 dias.</P>

      <H>9. Lei Aplicável e Foro</H>
      <P>Estes Termos são regidos pela legislação brasileira. Eventuais litígios serão submetidos ao Juizado Especial Cível competente conforme domicílio do consumidor, nos termos do CDC.</P>
    </>
  )
}

// ─── Política de Privacidade ──────────────────────────────────────────────────
function PrivacyContent() {
  return (
    <>
      <P><strong style={{ color: 'var(--text-primary)' }}>Versão 1.0 — Junho de 2026</strong></P>
      <P>Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).</P>

      <H>1. Controlador dos Dados</H>
      <P>MinhaTize — Plataforma Digital de Acompanhamento Educativo<br />
      Contato e exercício de direitos: <strong style={{ color: 'var(--text-primary)' }}>privacidade@minhatize.com.br</strong></P>

      <H>2. Dados Coletados</H>
      <P><strong style={{ color: 'var(--text-primary)' }}>Dados fornecidos por você (perfil):</strong> nome/apelido, idade, sexo, altura, peso, meta de peso, medicamento em uso, dosagem, data de início, dia de aplicação.</P>
      <P><strong style={{ color: 'var(--danger-text)' }}>Dados de saúde sensíveis (Art. 11 LGPD):</strong> resultados de exames laboratoriais (quando inseridos voluntariamente), registro de efeitos colaterais, diário pessoal de saúde.</P>
      <P><strong style={{ color: 'var(--text-primary)' }}>Dados coletados automaticamente:</strong> endereço IP (processado temporariamente para segurança), endereço de e-mail e token de acesso (coletados na compra).</P>

      <H>3. Onde os Dados Ficam Armazenados</H>
      <P><strong style={{ color: 'var(--text-primary)' }}>Dados do perfil, histórico, exames e diário:</strong> armazenados LOCALMENTE no seu dispositivo (localStorage). Esses dados NÃO são enviados aos nossos servidores e ficam sob seu controle exclusivo.</P>
      <P><strong style={{ color: 'var(--text-primary)' }}>E-mail e token de acesso:</strong> armazenados em banco de dados Supabase (servidores nos EUA) com criptografia em trânsito e em repouso.</P>
      <P><strong style={{ color: 'var(--text-primary)' }}>Relatório Anti-Platô:</strong> ao gerar o relatório, os dados do questionário são enviados de forma anônima à API da Anthropic (EUA) para geração do texto. Nenhum dado identificador (nome, e-mail) é transmitido.</P>

      <H>4. Finalidade e Base Legal</H>
      <P>Dados de perfil e saúde: exibição e acompanhamento exclusivo pelo usuário — base legal: consentimento (Art. 7, I e Art. 11, I, LGPD).</P>
      <P>E-mail e token: autenticação e entrega do acesso — base legal: execução de contrato (Art. 7, V, LGPD).</P>
      <P>IP: prevenção de abuso e segurança — base legal: legítimo interesse (Art. 7, IX, LGPD).</P>

      <H>5. Compartilhamento de Dados</H>
      <P>Não vendemos dados a terceiros. Compartilhamos apenas com: Supabase Inc. (armazenamento do token), Resend Inc. (envio de e-mail), Anthropic PBC (geração do relatório educativo, sem dados identificadores), e plataformas de pagamento utilizadas na compra (Wiven, Hotmart).</P>

      <H>6. Retenção de Dados</H>
      <P>Dados locais (perfil, saúde): permanecem no dispositivo até você apagá-los ou limpar o armazenamento do navegador. Token de acesso: mantido pelo período de vigência do seu acesso. Logs de IP: não são retidos após o processamento.</P>

      <H>7. Seus Direitos (Art. 18 LGPD)</H>
      <P>Você tem direito a: confirmação da existência de tratamento; acesso aos dados; correção; exclusão; portabilidade; revogação do consentimento; e informação sobre compartilhamento. Para exercer seus direitos, envie e-mail para <strong style={{ color: 'var(--text-primary)' }}>privacidade@minhatize.com.br</strong>. Responderemos em até 15 dias úteis.</P>
      <P>Para excluir todos os seus dados locais, utilize a opção "Resetar todos os dados" na aba de perfil do app. Para solicitar a exclusão do token/e-mail do nosso banco, envie e-mail com seu endereço de e-mail cadastrado.</P>

      <H>8. Segurança</H>
      <P>Adotamos: comunicação criptografada (HTTPS/TLS), headers de segurança, rate limiting, tokens únicos não reutilizáveis e acesso restrito ao banco de dados.</P>

      <H>9. Menores de Idade</H>
      <P>O MinhaTize não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se identificarmos dados de menor, procederemos à exclusão imediata.</P>

      <H>10. Alterações</H>
      <P>Alterações significativas serão comunicadas por e-mail com antecedência. A versão vigente estará sempre disponível no app (seção Perfil → Legal).</P>
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ConsentGate({ onAccept }: Props) {
  const [termsChecked,   setTerms]   = useState(false)
  const [privacyChecked, setPrivacy] = useState(false)
  const [ageChecked,     setAge]     = useState(false)
  const [rxChecked,      setRx]      = useState(false)

  const allChecked = termsChecked && privacyChecked && ageChecked && rxChecked

  function handleAccept() {
    if (!allChecked) return
    saveConsent()
    onAccept()
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{
        flex: 1, overflowY: 'auto',
        maxWidth: '520px', width: '100%',
        margin: '0 auto', padding: '28px 20px 32px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <img src="/LogoPng.png" alt="MinhaTize" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>MinhaTize</span>
        </div>

        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
            Antes de começar
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, margin: '0 0 8px' }}>
            Termos de Uso e Privacidade
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Leia os documentos abaixo antes de usar o app. Seu consentimento é obrigatório pela legislação brasileira (LGPD).
          </p>
        </div>

        {/* Aviso médico em destaque */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <AlertTriangle size={18} strokeWidth={2} style={{ color: '#F87171', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger-text)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Aviso Médico Importante
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              O MinhaTize é um aplicativo <strong style={{ color: 'var(--text-primary)' }}>educativo</strong> e <strong style={{ color: 'var(--text-primary)' }}>não constitui serviço médico</strong>. Não realiza diagnósticos, não prescreve medicamentos e não substitui a orientação do seu médico, farmacêutico ou nutricionista. Os medicamentos referenciados são controlados e requerem prescrição médica válida.
            </p>
          </div>
        </div>

        {/* Documentos legais */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Section title="Termos de Uso" icon={<FileText size={15} strokeWidth={2} />}>
            <TermsContent />
          </Section>
          <Section title="Política de Privacidade (LGPD)" icon={<Shield size={15} strokeWidth={2} />}>
            <PrivacyContent />
          </Section>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {[
            {
              id: 'terms',
              checked: termsChecked,
              set: setTerms,
              label: 'Li e aceito os Termos de Uso do MinhaTize.',
            },
            {
              id: 'privacy',
              checked: privacyChecked,
              set: setPrivacy,
              label: 'Li e aceito a Política de Privacidade e autorizo o tratamento dos meus dados de saúde para as finalidades descritas (Art. 7, I e Art. 11, I da LGPD).',
            },
            {
              id: 'age',
              checked: ageChecked,
              set: setAge,
              label: 'Declaro ter 18 anos ou mais.',
            },
            {
              id: 'rx',
              checked: rxChecked,
              set: setRx,
              label: 'Declaro possuir prescrição médica válida para o medicamento que utilizarei neste aplicativo.',
            },
          ].map(item => (
            <label
              key={item.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                cursor: 'pointer', padding: '12px 14px',
                background: item.checked ? 'var(--primary-light)' : 'var(--surface)',
                border: `1px solid ${item.checked ? 'var(--primary-glow)' : 'var(--border)'}`,
                borderRadius: '11px', transition: 'all 0.15s',
              }}
              onClick={() => item.set(v => !v)}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                background: item.checked ? 'var(--primary)' : 'var(--surface-2)',
                border: `2px solid ${item.checked ? 'var(--primary)' : 'var(--border-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', marginTop: '1px',
              }}>
                {item.checked && <Check size={11} strokeWidth={3} style={{ color: '#fff' }} />}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {item.label}
              </span>
            </label>
          ))}
        </div>

        {/* Botão */}
        <button
          onClick={handleAccept}
          disabled={!allChecked}
          style={{
            width: '100%', padding: '15px',
            background: allChecked
              ? 'linear-gradient(135deg, var(--primary), #0D9488)'
              : 'var(--surface-2)',
            border: allChecked ? 'none' : '1px solid var(--border)',
            borderRadius: '13px', cursor: allChecked ? 'pointer' : 'not-allowed',
            color: allChecked ? '#fff' : 'var(--text-faint)',
            fontWeight: 800, fontSize: '15px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          {allChecked ? 'Aceitar e continuar' : 'Marque todas as opções acima'}
        </button>

        <p style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.5 }}>
          Ao aceitar, registramos a data e a versão do seu consentimento conforme exigido pela LGPD.
          Você pode revogar seu consentimento a qualquer momento via privacidade@minhatize.com.br.
        </p>
      </div>
    </div>
  )
}
