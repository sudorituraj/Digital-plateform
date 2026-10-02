import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { StaffAuthProvider } from '../../auth/StaffAuthProvider'
import { useStaffAuth } from '../../auth/staffContext'
import { env } from '../../config/env'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { LanguageSelector } from '../layout/LanguageSelector'
import { Button, Icon, ToastProvider } from '../ui'

function StaffBar() {
  const { t } = useI18n()
  const { status, staff, logout } = useStaffAuth()
  return (
    <header className="sticky top-0 z-40 bg-primary-900 text-white shadow-md">
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link to="/staff" className="flex min-h-11 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white text-primary-800">
            <Icon name="stethoscope" size={20} />
          </span>
          <span className="leading-tight">
            <span className="block font-display font-bold">{t('common.clinicShortName')}</span>
            <span className="block text-xs text-primary-200">
              {t('staff.area')}
              {env.demoMode && <span className="ml-1.5 rounded bg-accent-400 px-1 text-[0.65rem] font-bold text-primary-950">DEMO</span>}
            </span>
          </span>
        </Link>
        {status === 'staff' && (
          <nav aria-label={t('staff.navLabel')} className="-mx-1 flex max-w-full gap-1 overflow-x-auto">
            {(staff.role === 'doctor'
              ? [
                  ['/staff', t('staff.doctor.title')],
                  ['/staff/analytics', t('staff.analytics.title')],
                ]
              : [
                  ['/staff', t('staff.dash.title')],
                  ['/staff/queue', t('staff.doctor.queueNav')],
                  ['/staff/patients', t('staff.patients.title')],
                  ['/staff/messages', t('staff.messages.title')],
                  ['/staff/analytics', t('staff.analytics.title')],
                ]
            ).map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/staff'}
                className={({ isActive }) =>
                  cn('inline-flex min-h-11 items-center rounded-lg px-3 font-medium', isActive ? 'bg-white/15' : 'hover:bg-white/10')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <LanguageSelector tone="dark" />
          {status === 'staff' && (
            <>
              <span className="hidden text-sm text-primary-100 2xl:inline">
                {staff.name} · {t(`staff.roles.${staff.role}`)}
              </span>
              <Button variant="inverse" size="sm" icon="arrowLeft" onClick={logout}>
                {t('staff.logout')}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/** Shell for all /staff pages: no public header/footer, never indexed by search engines. */
export function StaffLayout() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <StaffAuthProvider>
      <ToastProvider>
        <div className="min-h-dvh bg-canvas">
          <StaffBar />
          <main id="main">
            <Outlet />
          </main>
        </div>
      </ToastProvider>
    </StaffAuthProvider>
  )
}
