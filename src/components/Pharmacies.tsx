import { useState } from 'react'
import { Cross, MapPin, Globe, BadgeCheck } from 'lucide-react'
import { FARMACIAS, FARMACIA_WA_MESSAGE, type Farmacia } from '../data/farmacias'
import { SubHeader, WaIcon } from './ProfileShared'

// Farmácias parceiras: contato direto por WhatsApp, Instagram ou site.

const FARMACIAS_NOTICE =
  'As farmácias parceiras são estabelecimentos independentes, responsáveis pelos próprios produtos, preços e atendimento. ' +
  'Medicamentos de venda sob prescrição exigem receita médica. O MinhaTize não vende medicamentos.'

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

function ContactButton({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 12px', borderRadius: '10px', textDecoration: 'none',
        background: 'var(--ice)', color: 'var(--cobalt)',
        fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {icon}{label}
    </a>
  )
}

function FarmaciaCard({ farmacia }: { farmacia: Farmacia }) {
  const [logoError, setLogoError] = useState(false)
  const showLogo = !!farmacia.logo && !logoError
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '18px', overflow: 'hidden',
    }}>
      <div style={{
        minHeight: showLogo ? undefined : '110px', background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {showLogo ? (
          <img
            src={farmacia.logo}
            alt={farmacia.name}
            loading="lazy"
            onError={() => setLogoError(true)}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Cross size={26} strokeWidth={1.75} color="var(--cobalt)" /></div>
        )}
      </div>

      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              {farmacia.name}
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <MapPin size={12} strokeWidth={2} /> {farmacia.location}
            </p>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            fontSize: '10px', fontWeight: 800, color: 'var(--teal-d)', background: 'var(--teal-l)',
            padding: '4px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            <BadgeCheck size={12} strokeWidth={2} /> Parceira
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {farmacia.whatsapp && (
            <ContactButton
              icon={<WaIcon size={15} />}
              label="WhatsApp"
              href={`https://wa.me/${farmacia.whatsapp}?text=${encodeURIComponent(FARMACIA_WA_MESSAGE)}`}
            />
          )}
          {farmacia.instagram && (
            <ContactButton icon={<InstagramIcon size={15} />} label="Instagram" href={farmacia.instagram} />
          )}
          {farmacia.site && (
            <ContactButton icon={<Globe size={15} strokeWidth={1.75} />} label="Site" href={farmacia.site} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function Pharmacies({ onBack }: { onBack: () => void }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SubHeader title="Farmácias parceiras" onBack={onBack} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {FARMACIAS.map(f => <FarmaciaCard key={f.name} farmacia={f} />)}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
        {FARMACIAS_NOTICE}
      </p>
    </div>
  )
}
