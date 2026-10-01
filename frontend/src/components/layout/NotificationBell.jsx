import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useApiGet } from '../../hooks/useApiGet'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'

/** Bell with the number of unread messages. Only for logged-in patients; re-checks on every page change. */
export function NotificationBell({ tone = 'light', className }) {
  const { t } = useI18n()
  const { status } = useAuth()
  const { key } = useLocation()
  const [result] = useApiGet(status === 'patient' ? `/notifications/unread?k=${key}` : null)
  if (status !== 'patient') return null
  const unread = result.data?.unread ?? 0
  const label = unread ? t('notifications.bellUnread', { n: unread }) : t('notifications.bell')
  return (
    <Link
      to="/notifications"
      aria-label={label}
      className={cn(
        'relative inline-flex size-11 items-center justify-center rounded-control',
        tone === 'dark' ? 'text-primary-100 hover:bg-white/10' : 'text-primary-800 ring-1 ring-line ring-inset hover:bg-primary-50',
        className,
      )}
    >
      <Icon name="inbox" size={22} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-xs font-bold text-primary-950 ring-2 ring-canvas">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
