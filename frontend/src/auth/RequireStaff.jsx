import { Navigate } from 'react-router-dom'
import { Button, StateMessage } from '../components/ui'
import { useI18n } from '../i18n/useI18n'
import { errorMessage } from '../lib/api'
import { useStaffAuth } from './staffContext'

/** Staff-only page. `roles` limits it further; the API checks roles again on every request. */
export function RequireStaff({ roles, children }) {
  const { status, staff, error, retry } = useStaffAuth()
  const { t } = useI18n()
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
  if (status === 'guest') return <Navigate to="/staff/login" replace />
  if (roles && !roles.includes(staff.role)) return <Navigate to="/staff" replace />
  return children
}
