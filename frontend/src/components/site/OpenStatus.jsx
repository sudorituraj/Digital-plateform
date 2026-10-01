import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'

const OPEN = 10 // 10 AM
const CLOSE = 16 // 4 PM — confirmed by the client (2026-10-01)

/** Current hour in Chapra, whatever the visitor's phone time zone is. */
function clinicHour() {
  const h = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date())
  return Number(h)
}

/** "Open now · until 4 PM" with a live dot, or when the doctor is next available. Re-checks every minute. */
export function OpenStatus({ tone = 'light', className }) {
  const { t } = useI18n()
  const [hour, setHour] = useState(clinicHour)
  useEffect(() => {
    const id = setInterval(() => setHour(clinicHour()), 60_000)
    return () => clearInterval(id)
  }, [])
  const open = hour >= OPEN && hour < CLOSE
  const text = open ? t('home.openNow') : hour < OPEN ? t('home.opensToday') : t('home.opensTomorrow')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold',
        tone === 'dark' ? 'bg-white/95 text-ink shadow-sm' : 'bg-surface text-ink ring-1 ring-line',
        className,
      )}
    >
      <span className={cn('size-2.5 rounded-full', open ? 'animate-live bg-success-600' : 'bg-ink-subtle')} aria-hidden="true" />
      {text}
    </span>
  )
}
