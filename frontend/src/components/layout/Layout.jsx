import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'
import { StateMessage } from '../ui/StateMessage'
import { cn } from '../../lib/cn'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileActionBar } from './MobileActionBar'

// Task pages where the Call/WhatsApp/Book bar would get in the way (and could cover form buttons).
const NO_ACTION_BAR = [/^\/book/, /^\/login/, /^\/appointments\//, /^\/my-appointments/]

/** Shell for all public pages: skip link, header, animated page content, footer, phone action bar. */
export function Layout() {
  const { t } = useI18n()
  const { pathname, hash } = useLocation()
  const { loggedOut, clearLoggedOut } = useAuth()

  // After logout the patient is sent home; from then on, protected pages ask them to log in again.
  useEffect(() => {
    if (loggedOut && pathname === '/') clearLoggedOut()
  }, [loggedOut, pathname, clearLoggedOut])
  const showActionBar = !NO_ACTION_BAR.some((re) => re.test(pathname))

  // New page → start at the top (unless linking to an #anchor).
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div
      className={cn(
        'flex min-h-dvh flex-col overflow-x-clip',
        showActionBar && 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0',
      )}
    >
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-primary-700 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main" tabIndex={-1} key={pathname} className="flex-1 animate-fade-in outline-none">
        <Suspense fallback={<StateMessage kind="loading" title={t('common.loading')} className="py-24" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      {showActionBar && <MobileActionBar />}
    </div>
  )
}
