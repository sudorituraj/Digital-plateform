import { Link } from 'react-router-dom'
import { mapsLink, telLink, whatsappLink } from '../../config/clinic'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'

/** App-style tiles for the four things patients do most: book, call, WhatsApp, directions. */
export function QuickActions({ className, showBook = true }) {
  const { t } = useI18n()
  const tiles = [
    ...(showBook ? [{ key: 'book', icon: 'calendar', label: t('common.bookShort'), to: '/book', tone: 'bg-primary-700 text-white' }] : []),
    { key: 'call', icon: 'phone', label: t('common.call'), href: telLink(), tone: 'bg-primary-50 text-primary-800' },
    { key: 'wa', icon: 'whatsapp', label: t('common.whatsapp'), href: whatsappLink(t('common.whatsappMessage')), tone: 'bg-success-50 text-whatsapp', external: true },
    { key: 'map', icon: 'mapPin', label: t('home.directions'), href: mapsLink(), tone: 'bg-accent-50 text-accent-700', external: true },
  ]
  return (
    <ul className={cn('grid gap-2.5', tiles.length === 4 ? 'grid-cols-4' : 'grid-cols-3', className)}>
      {tiles.map((tile, i) => {
        const inner = (
          <>
            <span className={cn('grid size-12 place-items-center rounded-2xl shadow-sm', tile.tone)}>
              <Icon name={tile.icon} size={22} />
            </span>
            <span className="text-center text-[0.8rem] leading-tight font-semibold text-ink">{tile.label}</span>
          </>
        )
        const cls = 'press flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl bg-surface p-2 ring-1 ring-line hover:ring-primary-200'
        return (
          <li key={tile.key} className="animate-rise" style={{ animationDelay: `${300 + i * 70}ms` }}>
            {tile.to ? (
              <Link to={tile.to} className={cls}>{inner}</Link>
            ) : (
              <a href={tile.href} className={cls} {...(tile.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {inner}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
