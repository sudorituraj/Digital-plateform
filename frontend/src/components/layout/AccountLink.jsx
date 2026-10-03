import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'

/** "My Appointments" when logged in, otherwise "Log in". Callers set the display (e.g. flex / hidden md:inline-flex). */
export function AccountLink({ className, icon = true }) {
  const { t } = useI18n()
  const { status } = useAuth()
  if (status === 'loading') return null
  const loggedIn = status === 'patient'
  return (
    <Link to={loggedIn ? '/my-appointments' : '/login'} className={cn('items-center gap-1.5', className)}>
      {icon && <Icon name="user" size={16} />}
      {loggedIn ? t('my.title') : t('auth.login')}
    </Link>
  )
}
