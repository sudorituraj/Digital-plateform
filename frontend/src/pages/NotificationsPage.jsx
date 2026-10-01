import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { NOTIFICATION_ICONS, useNotificationText } from '../components/NotificationText'
import { Alert, Button, Card, Container, Icon, StateMessage } from '../components/ui'
import { useApiGet } from '../hooks/useApiGet'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'
import { api, errorMessage } from '../lib/api'
import { cn } from '../lib/cn'
import { formatDay, formatTime } from '../lib/format'

/** The patient's messages from the clinic. Opening the page marks them as read. */
export default function NotificationsPage() {
  const { t, language } = useI18n()
  usePageTitle('notifications')
  const [result, reload] = useApiGet('/notifications')
  const text = useNotificationText()
  const unread = result.data?.unread ?? 0

  useEffect(() => {
    if (unread > 0) api.post('/notifications/read').catch(() => {})
  }, [unread])

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">{t('notifications.title')}</h1>
      <p className="mt-2 text-ink-muted">{t('notifications.lead')}</p>
      <Alert tone="info" className="mt-5">
        {t('notifications.simulated')}
      </Alert>

      <div className="mt-6">
        {result.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
        {result.state === 'error' && (
          <StateMessage
            kind="error"
            title={errorMessage(t, result.error)}
            action={<Button variant="secondary" onClick={reload}>{t('common.tryAgain')}</Button>}
          />
        )}
        {result.state === 'ready' && !result.data.items.length && (
          <Card tone="muted" padding="none">
            <StateMessage kind="empty" title={t('notifications.empty')} action={<Button to="/book" icon="calendar">{t('common.bookAppointment')}</Button>} />
          </Card>
        )}
        {result.state === 'ready' && result.data.items.length > 0 && (
          <ul className="space-y-3">
            {result.data.items.map((n) => {
              const { title, body } = text(n)
              return (
                <li key={n.id}>
                  <Card padding="sm" className={cn('flex gap-4', !n.read && 'border-primary-300 bg-primary-50/50')}>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">
                      <Icon name={NOTIFICATION_ICONS[n.type] ?? 'info'} size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-semibold">
                        {!n.read && <span className="size-2 rounded-full bg-accent-500" role="img" aria-label={t('notifications.new')} />}
                        {title}
                      </p>
                      <p className="mt-0.5 text-ink-muted">{body}</p>
                      <p className="mt-1 text-sm text-ink-subtle">
                        {formatDay(n.created_at.slice(0, 10), language, { day: 'numeric', month: 'short' })} {formatTime(n.created_at, language)}
                        {n.request_id && (
                          <>
                            {' · '}
                            <Link to={`/appointments/${n.request_id}`} className="font-semibold text-primary-700 underline-offset-4 hover:underline">
                              {n.request_id}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Container>
  )
}
