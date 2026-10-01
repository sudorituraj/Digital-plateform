import { Link } from 'react-router-dom'
import { clinic, mapsLink, telLink, whatsappLink } from '../../config/clinic'
import { env } from '../../config/env'
import { useI18n } from '../../i18n/useI18n'
import { Icon } from '../ui/Icon'
import { NeedsConfirmation } from '../ui/NeedsConfirmation'
import { Logo } from './Logo'
import { NAV_ITEMS } from './navItems'

const linkClass =
  'inline-flex min-h-11 items-center gap-2.5 text-primary-100 transition-colors hover:text-white sm:min-h-9'

export function Footer() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary-950 text-primary-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Logo tone="dark" />
          <p className="max-w-xs font-display text-xl text-white">{t('footer.tagline')}</p>
          <address className="flex gap-2.5 not-italic">
            <Icon name="mapPin" className="mt-1 shrink-0 text-accent-300" />
            <span>
              <span className="sr-only">{t('footer.address')}: </span>
              {clinic.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="mt-1.5 block">
                <NeedsConfirmation />
              </span>
            </span>
          </address>
        </div>

        <nav aria-labelledby="footer-links">
          <h2 id="footer-links" className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">
            {t('footer.quickLinks')}
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 md:grid-cols-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className={linkClass}>
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/book" className={linkClass}>
                {t('common.bookAppointment')}
              </Link>
            </li>
            <li>
              <Link to="/my-appointments" className={linkClass}>
                {t('my.title')}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">
            {t('footer.contactUs')}
          </h2>
          <ul>
            <li>
              <a href={telLink()} className={linkClass}>
                <Icon name="phone" size={18} className="text-accent-300" />
                <span>
                  <span className="sr-only">{t('footer.phone')}: </span>
                  {clinic.phoneDisplay}
                </span>
              </a>
              <div className="pl-7">
                <NeedsConfirmation />
              </div>
            </li>
            <li>
              <a href={whatsappLink(t('common.whatsappMessage'))} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <Icon name="whatsapp" size={18} className="text-accent-300" />
                {t('common.whatsapp')}
              </a>
            </li>
            <li>
              <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <Icon name="mapPin" size={18} className="text-accent-300" />
                {t('common.getDirections')}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-primary-200 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>{t('footer.copyright', { year })}</p>
          {env.demoMode && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{t('footer.demoNote')}</span>
              <Link to="/design-system" className="underline underline-offset-4 hover:text-white">
                Design system
              </Link>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
