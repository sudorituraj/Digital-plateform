import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { telLink } from '../../config/clinic'
import { env } from '../../config/env'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { AccountLink } from './AccountLink'
import { LanguageSelector } from './LanguageSelector'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { NotificationBell } from './NotificationBell'
import { NAV_ITEMS } from './navItems'

export function Header() {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Utility bar: demo label + language switch, visible on every screen size. */}
      <section aria-label={t('common.language')} className="bg-primary-900 text-primary-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-1 sm:gap-3 2xl:max-w-[96rem] sm:px-6 lg:px-8">
          {env.demoMode && (
            <p className="flex shrink-0 items-center gap-2 text-[0.85rem]">
              <span className="rounded bg-accent-400 px-1.5 py-px text-[0.7rem] font-bold tracking-wide text-primary-950">
                DEMO
              </span>
              <span className="hidden text-primary-100 md:inline">{t('common.demoBanner')}</span>
            </p>
          )}
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell tone="dark" className="hidden size-9 md:inline-flex" />
            <AccountLink className="hidden min-h-9 text-[0.85rem] font-medium text-primary-100 hover:text-white md:inline-flex" />
            <LanguageSelector tone="dark" className="-mr-1 overflow-x-auto" />
          </div>
        </div>
      </section>

      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-canvas/92 backdrop-blur-md transition-[border-color,box-shadow] duration-300',
          scrolled ? 'border-line shadow-[0_4px_20px_rgb(28_39_41/0.06)]' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-18 max-w-7xl 2xl:max-w-[96rem] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Logo className="min-w-0" />

          <nav aria-label={t('nav.label')} className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative inline-flex min-h-11 items-center rounded-lg px-2.5 font-medium whitespace-nowrap transition-colors 2xl:px-3',
                        'after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-accent-400 after:transition-transform after:duration-300',
                        isActive
                          ? 'text-primary-800 after:scale-x-100'
                          : 'text-ink-muted after:scale-x-0 hover:text-primary-800',
                      )
                    }
                  >
                    {t(`nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              href={telLink()}
              variant="ghost"
              size="sm"
              icon="phone"
              className="whitespace-nowrap max-lg:hidden xl:max-2xl:hidden"
            >
              {t('common.call')}
            </Button>
            <Button to="/book" size="md" icon="calendar" className="whitespace-nowrap max-sm:hidden" aria-label={t('common.bookAppointment')}>
              {t('common.bookShort')}
            </Button>
            <NotificationBell className="md:hidden" />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="inline-flex size-12 items-center justify-center rounded-control text-primary-800 ring-1 ring-line ring-inset hover:bg-primary-50 xl:hidden"
            >
              <Icon name="menu" size={24} label={t('nav.openMenu')} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} returnFocusRef={menuButtonRef} />
    </>
  )
}
