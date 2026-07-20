import { useState } from 'react'
import { ChevronLeft, ChevronRight, Lightbulb, Info } from 'lucide-react'
import FoodGuide from './FoodGuide'
import Weaning from './Weaning'
import SideEffects from './SideEffects'
import AntiPlato from './AntiPlato'
import Storage from './Storage'
import Exercise from './Exercise'
import { UserProfile } from '../types'
import {
  type HealthTab,
  SECTION_ICON_MAP, SECTION_ICON_SM, SYMPTOM_ICON_MAP, SUPP_ICON_MAP,
  SYMPTOM_TIPS, SUPP_LEVELS, getMondayOf, SECTION_CARDS,
} from '../data/healthHubContent'

interface Props {
  profile: UserProfile
  onUpdateProfile: (p: UserProfile) => void
  initialSection?: string
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function HealthHub({ profile, onUpdateProfile, initialSection }: Props) {
  const [activeSection, setActiveSection] = useState<HealthTab | null>(
    (initialSection as HealthTab) ?? null
  )

  const thisWeek       = getMondayOf(new Date())
  const currentEntry   = profile.sideEffects?.find(e => e.date === thisWeek)
  const activeSymptoms = currentEntry?.symptoms.filter(s => s.intensity > 0) ?? []
  const maxIntensity   = activeSymptoms.length > 0
    ? Math.max(...activeSymptoms.map(s => s.intensity)) : 0

  const symptomBadge =
    maxIntensity === 0 ? { label: 'Sem sintomas', color: '#10B981', dotColor: '#10B981' }
    : maxIntensity === 1 ? { label: `${activeSymptoms.length} leve${activeSymptoms.length > 1 ? 's' : ''}`, color: '#10B981', dotColor: '#10B981' }
    : maxIntensity === 2 ? { label: `${activeSymptoms.length} moderado${activeSymptoms.length > 1 ? 's' : ''}`, color: '#F59E0B', dotColor: '#F59E0B' }
    : { label: `${activeSymptoms.length} intenso${activeSymptoms.length > 1 ? 's' : ''}`, color: '#EF4444', dotColor: '#EF4444' }

  const currentCard = SECTION_CARDS.find(c => c.id === activeSection)

  // ── Section view ────────────────────────────────────────────────────────────
  if (activeSection !== null) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Sticky back header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          paddingTop: '4px', paddingBottom: '12px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          marginBottom: '4px',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
            <button
              onClick={() => setActiveSection(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: 'var(--primary)', fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Saúde</span>
            </button>
            <ChevronRight size={12} strokeWidth={2} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {currentCard?.title}
            </span>
          </div>

          {/* Section title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              background: currentCard?.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: currentCard?.shadow,
            }}>
              {activeSection && SECTION_ICON_SM[activeSection]}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                {currentCard?.title}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                {currentCard?.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Section content */}
        <div key={activeSection} className="fade-in">

          {/* ── SINTOMAS ───────────────────────────────────────────────── */}
          {activeSection === 'symptoms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SideEffects profile={profile} onUpdateProfile={onUpdateProfile} />

              {activeSymptoms.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                      Dicas para seus sintomas
                    </p>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  </div>

                  {activeSymptoms.map(s => {
                    const tip = SYMPTOM_TIPS[s.id]
                    if (!tip) return null
                    const intensityColor = s.intensity === 1 ? '#10B981' : s.intensity === 2 ? '#F59E0B' : '#EF4444'
                    const intensityLabel = s.intensity === 1 ? 'Leve' : s.intensity === 2 ? 'Moderado' : 'Intenso'
                    return (
                      <div key={s.id} style={{
                        borderRadius: '16px', overflow: 'hidden',
                        border: `1px solid ${intensityColor}25`,
                        background: 'var(--surface)',
                        boxShadow: 'var(--shadow-card)',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '12px 14px',
                          background: `${intensityColor}08`,
                          borderBottom: `1px solid ${intensityColor}20`,
                        }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                            background: `${intensityColor}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: intensityColor,
                          }}>
                            {SYMPTOM_ICON_MAP[s.id]}
                          </div>
                          <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', flex: 1, margin: 0 }}>
                            {tip.title}
                          </p>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px',
                            background: `${intensityColor}15`, color: intensityColor,
                          }}>
                            {intensityLabel}
                          </span>
                        </div>
                        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {tip.tips.map((t, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <span style={{
                                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                background: 'var(--primary-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '9px', fontWeight: 800, color: 'var(--primary)', marginTop: '1px',
                              }}>
                                {i + 1}
                              </span>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{t}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  <div className="card-warning">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
                      <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
                        Estas dicas são educativas. Se os sintomas persistirem ou forem intensos, consulte o médico responsável pelo seu protocolo.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ALIMENTAÇÃO ────────────────────────────────────────────── */}
          {activeSection === 'food' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeSymptoms.some(s => ['nausea', 'constipation', 'diarrhea'].includes(s.id)) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '12px',
                  background: 'rgba(245,158,11,0.07)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}>
                  <Lightbulb size={16} strokeWidth={2} style={{ flexShrink: 0, color: '#B45309' }} />
                  <p style={{ fontSize: '12px', color: '#B45309', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
                    Você tem sintomas digestivos esta semana. Priorize os alimentos da lista <strong>Aliados</strong> e evite os listados em <strong>Evitar</strong>.
                  </p>
                </div>
              )}
              <FoodGuide profile={profile} onUpdateProfile={onUpdateProfile} />
            </div>
          )}

          {/* ── EXERCÍCIO ──────────────────────────────────────────────── */}
          {activeSection === 'exercise' && <Exercise />}

          {/* ── DESMAME ────────────────────────────────────────────────── */}
          {activeSection === 'weaning' && (
            <Weaning profile={profile} />
          )}

          {/* ── SUPLEMENTAÇÃO ──────────────────────────────────────────── */}
          {activeSection === 'supplementation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {SUPP_LEVELS.map(lvl => (
                <div key={lvl.level} style={{
                  borderRadius: '20px', overflow: 'hidden',
                  border: `1.5px solid ${lvl.border}`,
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  {/* Level header */}
                  <div style={{
                    background: lvl.gradient,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: 'rgba(255,255,255,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 800, color: '#fff',
                    }}>
                      {lvl.level}
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '15px', color: '#fff', margin: 0, lineHeight: 1.2 }}>
                        {lvl.title}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.72)', margin: 0, marginTop: '2px' }}>
                        {lvl.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lvl.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '11px',
                        padding: '10px 12px', borderRadius: '12px',
                        background: lvl.bg,
                        border: `1px solid ${lvl.border}`,
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                          background: lvl.iconBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: lvl.iconColor,
                        }}>
                          {SUPP_ICON_MAP[item.name]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '3px', lineHeight: 1.4 }}>
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Support text */}
                    <div style={{
                      display: 'flex', gap: '8px', alignItems: 'flex-start',
                      padding: '10px 12px', borderRadius: '10px',
                      background: 'var(--surface-2)',
                    }}>
                      <Lightbulb size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-muted)' }} />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                        {lvl.note}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card-warning">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
                  <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.5, margin: 0 }}>
                    Esta seção possui caráter educativo e não substitui orientação médica ou nutricional. A necessidade de suplementação deve ser avaliada individualmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ANTI-PLATÔ ─────────────────────────────────────────────── */}
          {activeSection === 'antiplato' && <AntiPlato />}

          {/* ── ARMAZENAMENTO ──────────────────────────────────────────── */}
          {activeSection === 'storage' && <Storage />}

        </div>
      </div>
    )
  }

  // ── Home grid view ───────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
          Saúde
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Seu painel de bem-estar
        </p>
      </div>

      {/* Symptom status banner */}
      <button
        onClick={() => setActiveSection('symptoms')}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', borderRadius: '16px',
          background: maxIntensity >= 3
            ? 'rgba(239,68,68,0.06)'
            : maxIntensity === 2
            ? 'rgba(245,158,11,0.06)'
            : 'var(--primary-light)',
          border: `1.5px solid ${maxIntensity >= 3 ? 'rgba(239,68,68,0.20)' : maxIntensity === 2 ? 'rgba(245,158,11,0.25)' : 'rgba(37,99,235,0.18)'}`,
        }}
      >
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
          background: symptomBadge.dotColor,
          boxShadow: `0 0 0 3px ${symptomBadge.dotColor}22`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
            Esta semana
          </p>
          <p style={{ fontSize: '12px', color: symptomBadge.color, fontWeight: 600, margin: 0, marginTop: '2px' }}>
            {symptomBadge.label}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>Ver</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
      </button>

      {/* 2-column card grid */}
      <div data-tour="health-sections" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {SECTION_CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => setActiveSection(card.id)}
            style={{
              background: card.gradient,
              borderRadius: '20px',
              padding: '18px 16px 16px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: card.shadow,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '140px',
              transition: 'transform 0.15s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {/* Inner highlight */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(150deg, rgba(255,255,255,0.07) 0%, transparent 55%)',
              borderRadius: 'inherit', pointerEvents: 'none',
            }} />
            {/* Decorative circle */}
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
            }} />

            {/* Glassmorphism icon */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
              flexShrink: 0, position: 'relative',
            }}>
              {SECTION_ICON_MAP[card.id]}
            </div>

            <div>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
                {card.title}
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', margin: 0, marginTop: '4px', lineHeight: 1.4 }}>
                {card.subtitle}
              </p>
            </div>

            {card.id === 'symptoms' && activeSymptoms.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 8px', borderRadius: '99px',
                background: 'rgba(255,255,255,0.18)',
                fontSize: '10px', fontWeight: 700, color: '#fff',
                alignSelf: 'flex-start',
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: symptomBadge.dotColor, flexShrink: 0,
                }} />
                {symptomBadge.label}
              </span>
            )}
          </button>
        ))}
      </div>

    </div>
  )
}
