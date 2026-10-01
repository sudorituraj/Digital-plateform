import { useState } from 'react'
import { clinic, mapsLink } from '../../config/clinic'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

/**
 * Click-to-load Google map. Nothing is fetched from Google until the visitor asks,
 * which keeps the page fast on slow mobile data and avoids third-party tracking by default.
 * No API key needed (uses the public embed URL).
 */
export function MapEmbed({ className }) {
  const { t } = useI18n()
  const [loaded, setLoaded] = useState(false)
  const src = `https://www.google.com/maps?q=${encodeURIComponent(clinic.mapQuery)}&output=embed`

  return (
    <div className={cn('relative overflow-hidden rounded-card border border-line bg-sunken', className)}>
      {loaded ? (
        <iframe
          title={t('contact.mapTitle')}
          src={src}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          {/* Decorative "map" pattern — not a real map. */}
          <svg aria-hidden="true" className="absolute inset-0 size-full text-line-strong/60" preserveAspectRatio="none">
            <defs>
              <pattern id="map-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M44 0H0v44" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
            <line x1="0" y1="68%" x2="100%" y2="42%" stroke="var(--color-surface)" strokeWidth="14" />
            <line x1="30%" y1="0" x2="42%" y2="100%" stroke="var(--color-surface)" strokeWidth="10" />
          </svg>
          <span className="relative grid size-14 place-items-center rounded-full bg-primary-700 text-white shadow-raised">
            <Icon name="mapPin" size={28} />
          </span>
          <div className="relative flex flex-wrap justify-center gap-2.5">
            <Button variant="secondary" size="sm" icon="mapPin" onClick={() => setLoaded(true)}>
              {t('contact.showMap')}
            </Button>
            <Button href={mapsLink()} size="sm" iconRight="arrowRight">
              {t('common.getDirections')}
            </Button>
          </div>
          <p className="relative text-sm text-ink-muted">{t('contact.mapNote')}</p>
        </div>
      )}
    </div>
  )
}
