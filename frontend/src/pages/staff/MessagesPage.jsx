import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NOTIFICATION_ICONS, useNotificationText } from '../../components/NotificationText'
import { Alert, Badge, Button, Card, Icon, StateMessage } from '../../components/ui'
import { useApiGet } from '../../hooks/useApiGet'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { errorMessage } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatDay, formatTime } from '../../lib/format'

const TYPES = ['', 'submitted', 'confirmed', 'reminder', 'rescheduled', 'cancelled', 'follow_up', 'paid']

/** What would have gone out by WhatsApp/SMS — simulated in the demo, so staff can see it working. */
export default function MessagesPage() {
  const { t, language } = useI18n()
  usePageTitle('messages')
  const [type, setType] = useState('')
  const [result, reload] = useApiGet(`/staff/messages${type ? `?type=${type}` : ''}`)
  const text = useNotificationText()

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl">{t('staff.messages.title')}</h1>
        <p className="mt-1 text-ink-muted">{t('staff.messages.lead')}</p>
      </div>
      <Alert tone="warning" title={t('staff.messages.simulatedTitle')}>
        {t('staff.messages.simulatedBody')}
      </Alert>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('staff.patients.filterLabel')}>
        {TYPES.map((ty) => (
          <button key={ty || 'all'} type="button" aria-pressed={type === ty} onClick={() => setType(ty)}
            className={cn('min-h-10 rounded-full px-4 text-sm font-semibold ring-1 ring-inset',
              type === ty ? 'bg-primary-700 text-white ring-primary-700' : 'bg-surface ring-line-strong hover:ring-primary-300')}>
            {ty ? t(`notifications.types.${ty}.label`) : t('staff.patients.filters.all')}
          </button>
        ))}
      </div>

      {result.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
      {result.state === 'error' && (
        <StateMessage kind="error" title={errorMessage(t, result.error)} action={<Button variant="secondary" onClick={reload}>{t('common.tryAgain')}</Button>} />
      )}
      {result.state === 'ready' && !result.data.length && <StateMessage kind="empty" title={t('staff.messages.empty')} />}
      {result.state === 'ready' && result.data.length > 0 && (
        <ul className="space-y-3">
          {result.data.map((m) => {
            const { title, body } = text(m)
            return (
              <li key={m.id}>
                <Card padding="sm" className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-whatsapp/10 text-whatsapp">
                    <Icon name={NOTIFICATION_ICONS[m.type] ?? 'whatsapp'} size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {m.patient_name} <span className="font-mono text-sm font-normal text-ink-muted">+91 {m.phone}</span>
                      </p>
                      <Badge tone="warning">{t('staff.messages.simulated')}</Badge>
                    </div>
                    <div className="mt-2 rounded-control rounded-tl-none bg-success-50 px-3 py-2">
                      <p className="font-medium">{title}</p>
                      <p className="text-ink-muted">{body}</p>
                    </div>
                    <p className="mt-1 text-sm text-ink-subtle">
                      {formatDay(m.created_at.slice(0, 10), language, { day: 'numeric', month: 'short' })} {formatTime(m.created_at, language)} · WhatsApp
                      {m.request_id && (
                        <>
                          {' · '}
                          <span className="font-mono">{m.request_id}</span>
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
      <p className="text-sm text-ink-muted">
        <Link to="/staff" className="font-semibold text-primary-700 underline underline-offset-4">{t('staff.dash.title')}</Link>
      </p>
    </div>
  )
}
