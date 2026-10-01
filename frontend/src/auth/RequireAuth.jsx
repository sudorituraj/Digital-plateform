import { Navigate, useLocation } from 'react-router-dom'
import { Button, StateMessage } from '../components/ui'
import { useI18n } from '../i18n/useI18n'
import { errorMessage } from '../lib/api'
import { useAuth } from './useAuth'

/** Shows children only to a logged-in patient; otherwise sends them to /login and back afterwards. */
export function RequireAuth({ children }) {
  const { status, loggedOut, error, retry } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  if (status === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
  if (status === 'error') {
    return (
      <StateMessage
        kind="error"
        title={errorMessage(t, error)}
        className="py-24"
        action={
          <Button variant="secondary" onClick={retry}>
            {t('common.tryAgain')}
          </Button>
        }
      />
    )
  }
  if (status === 'guest' && loggedOut) return <Navigate to="/" replace />
  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return children
}
