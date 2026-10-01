import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { telLink, whatsappLink } from '../../config/clinic'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { AccountLink } from './AccountLink'
import { LanguageSelector } from './LanguageSelector'
import { NAV_ITEMS } from './navItems'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Slide-in menu for phones/tablets. Accessible dialog: Esc closes, focus stays inside. */
export function MobileMenu({ open, onClose, returnFocusRef }) {
  const { t } = useI18n()
  const panelRef = useRef(null)
  const { pathname } = useLocation()

  // Close when the route changes (user tapped a link).
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  useEffect(() => {
    if (!open) return
    const returnTo = returnFocusRef?.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector(FOCUSABLE)?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      returnTo?.focus()
    }
  }, [open, onClose, returnFocusRef])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="absolute inset-0 animate-fade-in bg-primary-950/40" onClick={onClose} aria-hidden="true" />
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-slide-in-right flex-col bg-canvas shadow-raised"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="mobile-menu-title" className="font-sans text-lg font-semibold">
            {t('nav.label')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-12 items-center justify-center rounded-control text-ink hover:bg-sunken"
          >
            <Icon name="close" size={24} label={t('nav.closeMenu')} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <nav aria-label={t('nav.label')}>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-13 items-center justify-between rounded-control px-4 text-lg font-medium',
                        isActive ? 'bg-primary-50 text-primary-800' : 'text-ink hover:bg-sunken',
                      )
                    }
                  >
                    {t(`nav.${item.key}`)}
                    <Icon name="arrowRight" size={18} className="text-ink-subtle" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <AccountLink className="mt-3 flex min-h-13 w-full gap-3 rounded-control px-4 text-lg font-semibold text-primary-800 ring-1 ring-primary-200 hover:bg-primary-50" />

          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 flex items-center gap-2 font-semibold text-ink-muted">
              <Icon name="globe" size={18} />
              {t('common.language')}
            </p>
            <LanguageSelector variant="stacked" />
          </div>
        </div>

        <div className="space-y-2.5 border-t border-line bg-surface p-5">
          <Button to="/book" size="lg" icon="calendar" fullWidth>
            {t('common.bookAppointment')}
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button href={telLink()} variant="secondary" icon="phone">
              {t('common.call')}
            </Button>
            <Button href={whatsappLink(t('common.whatsappMessage'))} variant="whatsapp" icon="whatsapp">
              {t('common.whatsapp')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
