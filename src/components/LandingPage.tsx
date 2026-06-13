import { useState, useEffect } from 'react'
import './LandingPage.css'
import { validateToken, saveToken, extractToken } from '../utils/token'

const KIWIFY_URL = 'https://kiwify.com.br/seu-produto'

const FEATURES = [
  {
    icon: '🧮',
    iconClass: 'ic-blue',
    title: 'Calculadora Inteligente de Dose',
    desc: 'Calcule automaticamente a dose correta para cada fase do protocolo, com alertas de segurança.',
  },
  {
    icon: '🧪',
    iconClass: 'ic-teal',
    title: 'Laboratório Inteligente',
    desc: 'Registre e acompanhe exames ao longo do tratamento com gráficos de evolução.',
  },
  {
    icon: '📆',
    iconClass: 'ic-purple',
    title: 'Desmame Personalizado',
    desc: 'Protocolo de redução de dose gerado com base no seu histórico e resposta ao medicamento.',
  },
  {
    icon: '🔄',
    iconClass: 'ic-gold',
    title: 'Protocolo Anti-Platô',
    desc: 'Detecte estagnações e receba estratégias validadas para retomar a evolução.',
  },
  {
    icon: '💊',
    iconClass: 'ic-green',
    title: 'Suplementação Estratégica',
    desc: 'Guia de suplementos integrado ao seu protocolo com base em evidências científicas.',
  },
  {
    icon: '🏋️',
    iconClass: 'ic-coral',
    title: 'Treinamento Especializado',
    desc: 'Planos de treino adaptados para maximizar a perda de gordura durante o tratamento.',
  },
  {
    icon: '🥗',
    iconClass: 'ic-sky',
    title: 'Dieta Personalizada',
    desc: 'Orientações nutricionais compatíveis com os efeitos do GLP-1 no apetite.',
  },
  {
    icon: '📱',
    iconClass: 'ic-navy',
    title: 'Atualizações Contínuas',
    desc: 'Novos conteúdos e funcionalidades adicionados continuamente sem custo adicional.',
  },
]

const FAQS = [
  {
    q: 'A Minha Tize é um aplicativo?',
    a: 'A Minha Tize é uma plataforma digital acessível pelo celular, tablet e computador. Não precisa instalar nada — funciona direto no navegador. Se quiser, adicione à tela inicial para uma experiência idêntica a um app.',
  },
  {
    q: 'O pagamento é mensal?',
    a: 'Não. O pagamento é único e o acesso é vitalício. Você paga uma vez e usa para sempre, incluindo todas as futuras atualizações da plataforma.',
  },
  {
    q: 'Quando recebo meu acesso?',
    a: 'Imediatamente após a confirmação do pagamento. Você receberá um e-mail com seu link de acesso exclusivo.',
  },
  {
    q: 'A plataforma recebe atualizações?',
    a: 'Sim. Novos recursos, conteúdos e melhorias são adicionados continuamente. Todos os acessos vitalícios incluem as atualizações sem custo adicional.',
  },
  {
    q: 'A Minha Tize é destinada apenas para usuários de Tirzepatida?',
    a: 'A plataforma foi desenvolvida com foco em usuários de Tirzepatida, mas também atende usuários de outros análogos de GLP-1 como Semaglutida e Ozempic.',
  },
  {
    q: 'A Minha Tize substitui a consulta médica?',
    a: 'Não. A plataforma foi desenvolvida para complementar o acompanhamento do tratamento e não substitui a avaliação, o diagnóstico e as orientações individualizadas realizadas por profissionais habilitados.',
  },
  {
    q: 'A Minha Tize faz recomendações médicas individualizadas?',
    a: 'Não. A plataforma tem caráter educacional e foi desenvolvida para complementar o acompanhamento do tratamento. Consulte sempre seu médico.',
  },
]

const TESTIMONIALS = [
  {
    text: 'Finalmente entendi como funciona cada fase do tratamento. O protocolo anti-platô foi exatamente o que eu precisava na semana 8.',
    name: 'Ana C.',
    role: 'Em tratamento há 3 meses',
    initials: 'AC',
  },
  {
    text: 'Já tentei anotar tudo em caderno e em outros apps. A Minha Tize é a única que foi feita pensando em quem usa Tirzepatida de verdade.',
    name: 'Ricardo M.',
    role: 'Em tratamento há 5 meses',
    initials: 'RM',
  },
  {
    text: 'A calculadora de dose e o calendário de aplicação me deram segurança para fazer o desmame no momento certo.',
    name: 'Juliana F.',
    role: 'Em tratamento há 7 meses',
    initials: 'JF',
  },
  {
    text: 'Perdi 11 kg em 4 meses acompanhando tudo pela plataforma. Os gráficos de evolução me motivam a não desistir.',
    name: 'Carlos S.',
    role: 'Em tratamento há 4 meses',
    initials: 'CS',
  },
  {
    text: 'Minha médica ficou impressionada com o histórico detalhado que eu levei na consulta. Gerado automaticamente pela plataforma.',
    name: 'Fernanda L.',
    role: 'Em tratamento há 6 meses',
    initials: 'FL',
  },
]

interface Props {
  onAccessGranted: () => void
}

export default function LandingPage({ onAccessGranted }: Props) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [accessOpen, setAccessOpen] = useState(false)
  const [accessInput, setAccessInput] = useState('')
  const [accessError, setAccessError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [])

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = accessInput.trim()
    if (!trimmed) return
    setChecking(true)
    setAccessError('')
    const token = extractToken(trimmed)
    const valid = await validateToken(token)
    if (valid) {
      saveToken(token)
      onAccessGranted()
    } else {
      setAccessError('Token inválido. Verifique o link de acesso recebido por e-mail.')
      setChecking(false)
    }
  }

  return (
    <div className="lp-page">
      {/* ── HEADER ────────────────────────────────────────────── */}
      <header className="lp-header">
        <nav className="lp-nav lp-container">
          <a href="#topo" className="lp-logo">
            <div className="lp-logo-icon">🌿</div>
            MINHA TIZE
          </a>
          <div className="lp-nav-links">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#para-quem">Para quem é</a>
            <a href="#preco">Preço</a>
            <a href="#faq">FAQ</a>
          </div>
          <a href="#preco" className="lp-btn lp-btn-primary">
            Garantir acesso
          </a>
        </nav>
      </header>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="lp-hero" id="topo">
        <div className="lp-container">
          <div className="lp-hero-inner">
            {/* Left content */}
            <div>
              <div className="lp-hero-badge">
                <span className="lp-hero-badge-dot" />
                Plataforma inteligente · Tirzepatida
              </div>
              <h1>
                A maior plataforma inteligente para{' '}
                <span>usuários de Tirzepatida</span>
              </h1>
              <p className="lp-hero-sub">
                Mais do que simplesmente aplicar a medicação — acompanhe cada fase do
                tratamento com dados, protocolos e estratégias desenvolvidas
                especialmente para o GLP-1.
              </p>
              <div className="lp-hero-ctas">
                <a href={KIWIFY_URL} className="lp-btn lp-btn-primary lp-btn-lg">
                  Quero ter acesso →
                </a>
                <a href="#funcionalidades" className="lp-btn lp-btn-outline lp-btn-lg">
                  Ver funcionalidades
                </a>
              </div>
              <div className="lp-hero-social">
                <div className="lp-hero-avatars">
                  <span>AC</span>
                  <span>RM</span>
                  <span>JF</span>
                  <span>+</span>
                </div>
                <span>+100 pessoas já utilizam a Minha Tize</span>
              </div>
            </div>

            {/* Right: phone mockup */}
            <div className="lp-hero-visual">
              <div className="lp-phone-wrap">
                <div className="lp-phone-float lp-phone-float-tl">
                  <div className="lp-phone-float-icon green">📉</div>
                  <div className="lp-phone-float-text">
                    <strong>−3,2 kg</strong>
                    <span>Esta semana</span>
                  </div>
                </div>

                <div className="lp-phone">
                  <div className="lp-phone-notch" />
                  <div className="lp-phone-screen">
                    <div className="lp-phone-app">
                      <div className="lp-phone-app-header">
                        <span className="lp-phone-app-title">Minha Tize</span>
                        <span className="lp-phone-app-badge">Semana 6</span>
                      </div>
                      <div className="lp-phone-metric">
                        <div className="lp-phone-metric-label">Peso atual</div>
                        <div className="lp-phone-metric-value">
                          84,2<span className="lp-phone-metric-unit">kg</span>
                        </div>
                      </div>
                      <div className="lp-phone-bar-row">
                        {[85, 60, 75, 90, 50, 70].map((w, i) => (
                          <div key={i} className="lp-phone-bar">
                            <div className="lp-phone-bar-fill" style={{ width: `${w}%` }} />
                          </div>
                        ))}
                      </div>
                      <div className="lp-phone-pill-row">
                        <span className="lp-phone-pill">Dose: 5mg</span>
                        <span className="lp-phone-pill">Próxima: seg</span>
                        <span className="lp-phone-pill">−12kg total</span>
                      </div>
                      <div className="lp-phone-row">
                        <div className="lp-phone-card-sm">
                          <div className="lp-phone-card-label">Perda</div>
                          <div className="lp-phone-card-val">12 kg</div>
                        </div>
                        <div className="lp-phone-card-sm">
                          <div className="lp-phone-card-label">Semanas</div>
                          <div className="lp-phone-card-val">6 sem</div>
                        </div>
                        <div className="lp-phone-card-sm">
                          <div className="lp-phone-card-label">Meta</div>
                          <div className="lp-phone-card-val">75 kg</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lp-phone-float lp-phone-float-br">
                  <div className="lp-phone-float-icon blue">🎯</div>
                  <div className="lp-phone-float-text">
                    <strong>Meta: 75 kg</strong>
                    <span>56% concluído</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUÇÃO ───────────────────────────────────────────── */}
      <section className="lp-solution" id="solucao">
        <div className="lp-container">
          <div className="lp-solution-inner">
            <div className="reveal">
              <div className="lp-label">A questão central</div>
              <h2 className="lp-section-title">
                Só tomar Tirzepatida não basta.
              </h2>
              <p className="lp-section-sub">
                A medicação abre a janela. O que você faz dentro dela determina seus
                resultados. Sem acompanhamento, a maioria das pessoas deixa resultados
                na mesa.
              </p>
              <ul className="lp-problem-list">
                <li className="lp-problem-item">
                  <div className="lp-problem-x">✕</div>
                  <span className="lp-problem-text">
                    Sem registrar doses e aplicações, erros acontecem e o protocolo perde eficiência.
                  </span>
                </li>
                <li className="lp-problem-item">
                  <div className="lp-problem-x">✕</div>
                  <span className="lp-problem-text">
                    Sem dados de evolução, é impossível saber quando ajustar dose ou estratégia.
                  </span>
                </li>
                <li className="lp-problem-item">
                  <div className="lp-problem-x">✕</div>
                  <span className="lp-problem-text">
                    Sem protocolo estruturado, a estagnação (platô) vira motivo de abandono.
                  </span>
                </li>
              </ul>
            </div>

            <div className="lp-solution-card reveal reveal-delay-2">
              <div className="lp-solution-card-label">A Minha Tize resolve isso</div>
              <h3>Seu tratamento, de forma mais inteligente.</h3>
              <p>
                Uma plataforma desenvolvida do zero para quem usa GLP-1. Não é um app
                genérico de saúde adaptado — é especializada no seu tratamento.
              </p>
              <div className="lp-solution-perks">
                {[
                  'Registro completo de doses e aplicações',
                  'Gráficos de evolução em tempo real',
                  'Alertas e protocolos personalizados',
                  'Conteúdo baseado em evidências científicas',
                ].map((perk) => (
                  <div key={perk} className="lp-solution-perk">
                    <div className="lp-check-circle">✓</div>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ───────────────────────────────────── */}
      <section className="lp-features" id="funcionalidades">
        <div className="lp-container">
          <div className="lp-text-center reveal">
            <div className="lp-label">O que você recebe</div>
            <h2 className="lp-section-title">8 módulos para maximizar seus resultados</h2>
            <p className="lp-section-sub">
              Cada funcionalidade foi desenvolvida com foco em quem usa Tirzepatida e
              análogos de GLP-1.
            </p>
          </div>
          <div className="lp-feature-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`lp-feature-card reveal reveal-delay-${(i % 3) + 1}`}
              >
                <div className={`lp-feature-icon ${f.iconClass}`}>{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ───────────────────────────────────────── */}
      <section className="lp-for-whom" id="para-quem">
        <div className="lp-container">
          <div className="lp-text-center reveal">
            <div className="lp-label">Para quem é</div>
            <h2 className="lp-section-title">Feito para você que está no tratamento</h2>
            <p className="lp-section-sub">
              Não importa em qual fase você está — a plataforma se adapta ao seu momento.
            </p>
          </div>
          <div className="lp-who-grid">
            {[
              {
                emoji: '🚀',
                title: 'Iniciando o tratamento',
                marks: [
                  'Entenda cada fase do protocolo',
                  'Configure doses e alarmes',
                  'Comece com o pé direito',
                ],
                delay: 'reveal-delay-1',
              },
              {
                emoji: '📊',
                title: 'No meio do tratamento',
                marks: [
                  'Acompanhe sua evolução com dados',
                  'Quebre platôs com estratégia',
                  'Ajuste dose com segurança',
                ],
                delay: 'reveal-delay-2',
              },
              {
                emoji: '🏁',
                title: 'Fase de desmame',
                marks: [
                  'Protocolo de desmame personalizado',
                  'Mantenha os resultados alcançados',
                  'Transição segura e estruturada',
                ],
                delay: 'reveal-delay-3',
              },
            ].map((card) => (
              <div key={card.title} className={`lp-who-card reveal ${card.delay}`}>
                <div className="lp-who-emoji">{card.emoji}</div>
                <h4>{card.title}</h4>
                <div className="lp-who-marks">
                  {card.marks.map((m) => (
                    <div key={m} className="lp-who-mark">
                      <div className="lp-who-mark-check">✓</div>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST / DARK SECTION ──────────────────────────────── */}
      <section className="lp-trust">
        <div className="lp-container">
          <div className="lp-trust-inner">
            <div className="reveal">
              <div className="lp-label white">Confiança</div>
              <h2 className="lp-section-title white">
                Desenvolvida com base em evidências científicas
              </h2>
              <p className="lp-section-sub white">
                Cada protocolo e recomendação da plataforma é fundamentado em estudos
                clínicos sobre Tirzepatida e análogos de GLP-1.
              </p>
              <div className="lp-trust-stats">
                {[
                  { num: '+100', suffix: '', desc: 'usuários ativos' },
                  { num: '8', suffix: '+', desc: 'módulos especializados' },
                  { num: '7', suffix: ' dias', desc: 'de garantia total' },
                  { num: '1×', suffix: '', desc: 'pagamento único' },
                ].map((s) => (
                  <div key={s.desc} className="lp-trust-stat">
                    <div className="lp-trust-stat-num">
                      {s.num}<span>{s.suffix}</span>
                    </div>
                    <div className="lp-trust-stat-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-trust-visual reveal reveal-delay-2">
              {[
                {
                  icon: '🔬',
                  title: 'Baseado em evidências',
                  desc: 'Protocolos derivados de estudos clínicos publicados sobre GLP-1.',
                },
                {
                  icon: '🔒',
                  title: 'Dados protegidos',
                  desc: 'Seus dados de saúde ficam no seu dispositivo. Sem rastreamento.',
                },
                {
                  icon: '⚡',
                  title: 'Acesso imediato',
                  desc: 'Disponível logo após a confirmação do pagamento.',
                },
                {
                  icon: '♾️',
                  title: 'Acesso vitalício',
                  desc: 'Pague uma vez, use para sempre com todas as atualizações.',
                },
              ].map((row) => (
                <div key={row.title} className="lp-trust-row">
                  <div className="lp-trust-row-icon">{row.icon}</div>
                  <div className="lp-trust-row-text">
                    <strong>{row.title}</strong>
                    <p>{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────── */}
      <section className="lp-testimonials">
        <div className="lp-container reveal">
          <div className="lp-text-center">
            <div className="lp-label">Depoimentos</div>
            <h2 className="lp-section-title">O que dizem quem já usa</h2>
          </div>
        </div>
        <div className="lp-testi-track">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="lp-testi-card">
              <div className="lp-testi-stars">★★★★★</div>
              <p className="lp-testi-text">"{t.text}"</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar">{t.initials}</div>
                <div>
                  <div className="lp-testi-name">{t.name}</div>
                  <div className="lp-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PREÇO ─────────────────────────────────────────────── */}
      <section className="lp-pricing" id="preco">
        <div className="lp-container">
          <div className="lp-text-center reveal">
            <div className="lp-label">Investimento</div>
            <h2 className="lp-section-title">Um único pagamento. Acesso vitalício.</h2>
            <p className="lp-section-sub">
              Sem mensalidade, sem surpresas. Pague uma vez e tenha acesso completo
              para sempre.
            </p>
          </div>

          <div className="lp-price-card reveal reveal-delay-1">
            <div className="lp-price-top">
              <div className="lp-price-badge">Acesso Completo · Vitalício</div>
              <div className="lp-price-name">Minha Tize</div>
              <div className="lp-price-row">
                <span className="lp-price-currency">R$</span>
                <span className="lp-price-amount">79</span>
                <span className="lp-price-cents">,90</span>
              </div>
              <div className="lp-price-installment">ou 3× R$ 26,63 sem juros</div>
            </div>
            <div className="lp-price-body">
              <div className="lp-price-perks">
                {[
                  'Acesso à plataforma completa',
                  'Calculadora inteligente de dose',
                  'Protocolo anti-platô',
                  'Rastreamento de peso e evolução',
                  'Calendário de aplicações',
                  'Guia de suplementação estratégica',
                  'Planos de treino especializados',
                  'Orientações nutricionais',
                  'Atualizações contínuas incluídas',
                  'Acesso vitalício garantido',
                ].map((perk) => (
                  <div key={perk} className="lp-price-perk">
                    <div className="lp-price-perk-check">✓</div>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <a
                href={KIWIFY_URL}
                className="lp-btn lp-btn-primary lp-btn-lg lp-price-cta"
              >
                Garantir acesso agora →
              </a>
              <div className="lp-price-safe">
                <span>🔒</span>
                <span>Compra 100% segura · Pagamento via Kiwify</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GARANTIA ──────────────────────────────────────────── */}
      <section className="lp-guarantee">
        <div className="lp-container">
          <div className="lp-guarantee-inner reveal">
            <div className="lp-guarantee-shield">🛡️</div>
            <div className="lp-guarantee-text">
              <h3>7 dias de garantia total</h3>
              <p>
                Se por qualquer motivo você não ficar satisfeito nos primeiros 7 dias,
                devolvemos 100% do valor pago. Sem perguntas, sem burocracia. Você não
                corre nenhum risco.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="lp-faq" id="faq">
        <div className="lp-container">
          <div className="lp-text-center reveal">
            <div className="lp-label">FAQ</div>
            <h2 className="lp-section-title">Perguntas frequentes</h2>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((item, i) => (
              <div
                key={i}
                className={`lp-faq-item reveal ${faqOpen === i ? 'open' : ''}`}
              >
                <button
                  className="lp-faq-q"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  aria-expanded={faqOpen === i}
                >
                  <span>{item.q}</span>
                  <div className="lp-faq-chevron">
                    <svg viewBox="0 0 12 12" aria-hidden="true">
                      <polyline points="2,4 6,8 10,4" />
                    </svg>
                  </div>
                </button>
                <div className={`lp-faq-a ${faqOpen === i ? 'open' : ''}`}>
                  <div className="lp-faq-a-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="lp-final-cta">
        <div className="lp-container">
          <h2 className="reveal">Pronto para transformar seu tratamento?</h2>
          <p className="reveal reveal-delay-1">
            Junte-se a centenas de pessoas que acompanham o tratamento de forma
            inteligente com a Minha Tize.
          </p>
          <div className="lp-final-cta-btns reveal reveal-delay-2">
            <a href={KIWIFY_URL} className="lp-btn lp-btn-primary lp-btn-lg">
              Garantir acesso por R$ 79,90 →
            </a>
            <a href="#faq" className="lp-btn lp-btn-ghost lp-btn-lg">
              Ainda tenho dúvidas
            </a>
          </div>
        </div>
      </section>

      {/* ── JÁ TENHO ACESSO ───────────────────────────────────── */}
      <div className="lp-access">
        <div className="lp-access-inner">
          <button
            className="lp-access-toggle"
            onClick={() => {
              setAccessOpen(!accessOpen)
              setAccessError('')
            }}
          >
            Já tenho acesso
          </button>
          {accessOpen && (
            <form className="lp-access-form" onSubmit={handleAccess}>
              <input
                className="lp-access-input"
                type="text"
                placeholder="Cole seu token ou link de acesso aqui"
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                autoFocus
              />
              {accessError && <p className="lp-access-error">{accessError}</p>}
              <button
                type="submit"
                className="lp-btn lp-btn-primary"
                disabled={checking || !accessInput.trim()}
              >
                {checking ? 'Verificando...' : 'Acessar plataforma'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <div className="lp-footer-logo">
              <div className="lp-logo-icon">🌿</div>
              MINHA TIZE
            </div>
            <p className="lp-footer-copy">
              © 2026 Minha Tize · Produto digital · Acesso vitalício via link personalizado
              <br />
              A plataforma não substitui acompanhamento médico.
            </p>
            <div className="lp-footer-links">
              <a href="#preco">Comprar</a>
              <a href="#faq">FAQ</a>
              <a href="#topo">Topo ↑</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
