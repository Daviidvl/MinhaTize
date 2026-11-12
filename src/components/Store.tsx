import { useState } from 'react'
import { ChevronRight, Heart, Syringe, Pill, Dumbbell, Scale } from 'lucide-react'
import { LOJA_CATEGORIES, type LojaProduct } from '../data/lojaProducts'
import { SLabel, SubHeader, openWA } from './ProfileShared'

// Loja do Perfil: vitrine de categorias e produtos de cada categoria.

// Os links da Loja são de afiliado — o usuário precisa saber disso antes de comprar
const LOJA_AFFILIATE_NOTICE =
  'Os links desta loja são de afiliado: o MinhaTize pode receber uma comissão pelas compras, sem custo adicional para você. ' +
  'Preços e disponibilidade são definidos pela loja parceira e podem mudar.'

function AffiliateNotice() {
  return (
    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
      {LOJA_AFFILIATE_NOTICE}
    </p>
  )
}

// ── Cartão de produto ─────────────────────────────────────────────────────────
function ProductCard({ icon, product, onBuy }: {
  icon: React.ReactNode; product: LojaProduct; onBuy: () => void
}) {
  const [fav, setFav] = useState(false)
  const [imgError, setImgError] = useState(false)
  const showImage = !!product.image && !imgError
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '18px', overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative', minHeight: '84px', padding: showImage ? 0 : '18px 12px',
        background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {product.discountPercent && (
          <span style={{
            position: 'absolute', top: '8px', left: '8px',
            fontSize: '10px', fontWeight: 800, color: 'var(--teal-d)', background: 'var(--teal-l)',
            padding: '3px 7px', borderRadius: '7px', letterSpacing: '-0.2px',
          }}>-{product.discountPercent}%</span>
        )}
        <button
          onClick={() => setFav(f => !f)}
          aria-label="Favoritar"
          style={{
            position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px',
            borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}
        >
          <Heart size={13} strokeWidth={2} color={fav ? 'var(--cobalt)' : 'var(--text-faint)'} fill={fav ? 'var(--cobalt)' : 'none'} />
        </button>
        {showImage ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
            background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{icon}</div>
        )}
      </div>

      <div style={{ flex: 1, padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{
          fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0,
          letterSpacing: '-0.1px', lineHeight: 1.3, minHeight: '28px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{product.name}</p>

        {product.description && (
          <p style={{
            fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', margin: 0, lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{product.description}</p>
        )}

        {product.originalPrice && (
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', textDecoration: 'line-through', fontWeight: 500 }}>
            {product.originalPrice}
          </span>
        )}
        {product.price ? (
          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            {product.price}
          </span>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
            Ver preço na Shopee
          </span>
        )}
        {product.priceNote && (
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px' }}>
            {product.priceNote}
          </span>
        )}

        <button onClick={onBuy} style={{
          marginTop: 'auto', width: '100%', fontSize: '11px', fontWeight: 800, color: '#fff',
          background: 'var(--g-cta)', border: 'none', borderRadius: '9px', padding: '9px 0', cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif', letterSpacing: '0.02em', textTransform: 'uppercase',
        }}>Comprar</button>
      </div>
    </div>
  )
}

// ── Atalhos de categoria ──────────────────────────────────────────────────────
function CategoryBanner({ iconBg, icon, label, sub, onClick }: {
  iconBg: string; icon: React.ReactNode; label: string; sub: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '14px',
      padding: '18px 20px', borderRadius: '22px', textAlign: 'left', cursor: 'pointer',
      background: iconBg, border: 'none', position: 'relative', overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px var(--line), 0 8px 22px rgba(var(--shadow-rgb),0.10), 0 2px 6px rgba(var(--shadow-rgb),0.08)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ position: 'absolute', top: '-28px', right: '-28px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, position: 'relative',
        background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 2px', letterSpacing: '-0.3px' }}>{label}</p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{sub}</p>
      </div>
      <ChevronRight size={18} strokeWidth={1.75} style={{ color: 'var(--text-muted)', flexShrink: 0, position: 'relative' }} />
    </button>
  )
}

function CategoryTile({ gradient, shadowColor, icon, label, onClick, span = 2, minHeight = '118px' }: {
  gradient: string; shadowColor: string; icon: React.ReactNode; label: string; onClick: () => void
  span?: number; minHeight?: string
}) {
  const big = span >= 4
  return (
    <button onClick={onClick} style={{
      gridColumn: `span ${span}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px',
      minHeight, padding: big ? '18px' : '14px', borderRadius: big ? '22px' : '20px', textAlign: 'left', cursor: 'pointer',
      background: gradient, border: 'none', position: 'relative', overflow: 'hidden',
      boxShadow: `inset 0 0 0 1px var(--line), 0 8px 22px ${shadowColor}, 0 2px 6px rgba(var(--shadow-rgb),0.08)`,
      fontFamily: 'Inter, -apple-system, sans-serif', transition: 'transform 0.15s, box-shadow 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: big ? '-26px' : '-20px', right: big ? '-26px' : '-20px',
        width: big ? '90px' : '64px', height: big ? '90px' : '64px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
        <div style={{
          width: big ? '44px' : '34px', height: big ? '44px' : '34px', borderRadius: big ? '13px' : '10px', flexShrink: 0,
          background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
      </div>

      <p style={{ fontSize: big ? '14px' : '12px', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.2px', lineHeight: 1.22, position: 'relative' }}>
        {label}
      </p>
    </button>
  )
}

// ── Vitrine de categorias ─────────────────────────────────────────────────────
export function StoreHome({ onBack, onCategory }: { onBack: () => void; onCategory: (id: string) => void }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SubHeader title="Loja" onBack={onBack} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SLabel>Categorias</SLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
          <CategoryBanner
            iconBg="var(--surface)"
            icon={<Syringe size={22} strokeWidth={1.75} color="var(--cobalt)" />}
            label="Aplicação & Insumos"
            sub="Agulhas, seringas e descarte"
            onClick={() => onCategory('aplicacao')}
          />
          <CategoryTile
            span={6} minHeight="150px"
            gradient="var(--surface)" shadowColor="rgba(var(--shadow-rgb),0.10)"
            icon={<Pill size={22} strokeWidth={1.75} color="var(--cobalt)" />} label="Suplementos & Vitaminas"
            onClick={() => onCategory('suplementos')}
          />
          <CategoryTile
            span={3} minHeight="132px"
            gradient="var(--surface)" shadowColor="rgba(var(--shadow-rgb),0.10)"
            icon={<Dumbbell size={19} strokeWidth={1.75} color="var(--cobalt)" />} label="Treino & Bem-estar"
            onClick={() => onCategory('treino')}
          />
          <CategoryTile
            span={3} minHeight="132px"
            gradient="var(--surface)" shadowColor="rgba(var(--shadow-rgb),0.10)"
            icon={<Scale size={19} strokeWidth={1.75} color="var(--cobalt)" />} label="Monitoramento"
            onClick={() => onCategory('monitoramento')}
          />
        </div>
      </div>
      <AffiliateNotice />
    </div>
  )
}

// ── Produtos de uma categoria ─────────────────────────────────────────────────
export function StoreCategory({ categoryId, onBack }: { categoryId: string; onBack: () => void }) {
  const cat = LOJA_CATEGORIES[categoryId]
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SubHeader title={cat.title} onBack={onBack} />

      <div style={{
        borderRadius: '22px', padding: '18px 20px', background: cat.gradient,
        boxShadow: `0 8px 24px ${cat.shadowColor}, 0 2px 6px rgba(var(--shadow-rgb),0.14)`,
        display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-28px', right: '-28px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, position: 'relative',
          background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{cat.icon('#fff', 22)}</div>
        <div style={{ position: 'relative', minWidth: 0 }}>
          <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.3px' }}>{cat.title}</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 600, margin: 0 }}>{cat.sub}</p>
        </div>
      </div>

      {cat.groups.map(g => (
        <div key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SLabel>{g.label}</SLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {g.products.map(p => (
              <ProductCard
                key={p.name}
                icon={cat.icon(cat.accent, 22)}
                product={p}
                onBuy={() => p.url
                  ? window.open(p.url, '_blank', 'noopener,noreferrer')
                  : openWA(`Olá! Tenho interesse no produto: ${p.name}`)}
              />
            ))}
          </div>
        </div>
      ))}
      <AffiliateNotice />
    </div>
  )
}
