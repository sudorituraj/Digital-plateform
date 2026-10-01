import { useI18n } from '../../i18n/useI18n'
import { useAuth } from '../../auth/useAuth'
import { useApiGet } from '../../hooks/useApiGet'
import { Button, Card, Container, Icon, Reveal, StatusBadge } from '../ui'
import { formatDay, statusKey } from '../../lib/format'

export function AppointmentStatusCard() {
  const { t } = useI18n()
  const { status: authStatus } = useAuth()
  const [result, load] = useApiGet(authStatus === 'patient' ? '/appointments/mine' : null)

  // Nothing to show for guests, and don't flash "no appointment" before the list has loaded.
  if (authStatus !== 'patient' || result.state === 'loading') return null

  const upcoming = result.data?.upcoming?.[0]

  if (!upcoming) {
    return (
      <Card tone="muted" padding="lg" className="max-w-2xl mx-auto">
        <Reveal className="text-center py-8">
          <Icon name="calendar" size={48} className="mx-auto mb-4 text-ink-subtle" />
          <h3 className="text-xl font-semibold">{t('home.appointmentStatus.noUpcoming')}</h3>
          <p className="mt-2 text-ink-muted">{t('home.appointmentStatus.noUpcomingBody')}</p>
          <Button to="/book" icon="calendar" className="mt-6" size="lg">
            {t('common.bookAppointment')}
          </Button>
        </Reveal>
      </Card>
    )
  }

  const handleCancel = async () => {
    if (!window.confirm(t('home.appointmentStatus.cancelConfirm'))) return
    try {
      await fetch(`/api/appointments/${upcoming.request_id}/cancel`, { method: 'POST' })
      load()
    } catch {
      alert(t('common.error'))
    }
  }

  return (
    <Container className="py-8 sm:py-12">
      <Reveal className="max-w-2xl mx-auto">
        <Card tone="tinted" padding="lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-semibold">{t('home.appointmentStatus.title')}</h3>
                <StatusBadge status={statusKey(upcoming.status)} />
              </div>
              <p className="mt-1 text-ink-muted">{t('home.appointmentStatus.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" to={`/appointments/${upcoming.request_id}`} icon="eye">
                {t('common.viewDetails')}
              </Button>
              {upcoming.status === 'request_submitted' && (
                <Button variant="outline" onClick={handleCancel} icon="xCircle">
                  {t('home.appointmentStatus.cancel')}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-canvas p-4 text-center">
              <p className="text-sm text-ink-muted">{t('common.date')}</p>
              <p className="mt-1 font-semibold text-lg">
                {formatDay(upcoming.date, t.locale, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="rounded-xl bg-canvas p-4 text-center">
              <p className="text-sm text-ink-muted">{t('common.time')}</p>
              <p className="mt-1 font-semibold text-lg">{t(`form.${upcoming.time_slot}`)}</p>
            </div>
            <div className="rounded-xl bg-canvas p-4 text-center">
              <p className="text-sm text-ink-muted">{t('common.token')}</p>
              <p className="mt-1 font-semibold text-lg">{upcoming.token ? `#${upcoming.token}` : t('common.pending')}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-ink-muted">{t('appointment.progressLabel')}</p>
            <StatusTimeline status={upcoming.status} />
          </div>

          {upcoming.reason && (
            <div className="mt-4 p-3 rounded-lg bg-sunken">
              <p className="text-sm text-ink-muted">{t('common.reason')}</p>
              <p className="font-medium">{upcoming.reason}</p>
            </div>
          )}
        </Card>
      </Reveal>
    </Container>
  )
}

function StatusTimeline({ status }) {
  const { t } = useI18n()
  const PATH = ['request_submitted', 'confirmed', 'checked_in', 'completed']
  if (status === 'cancelled') {
    return <p className="flex items-center gap-2 font-semibold text-danger-700"><Icon name="alertCircle" /> {t('status.cancelled')}</p>
  }
  const current = PATH.indexOf(status === 'waiting' ? 'checked_in' : status)
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label={t('appointment.progressLabel')}>
      {PATH.map((step, i) => {
        const reached = i <= current
        return (
          <li key={step} className="flex flex-col items-center text-center" aria-current={i === current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : reached ? 'bg-primary-600' : 'bg-line'}`} />
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${reached ? 'bg-primary-700 text-white' : 'bg-sunken text-ink-subtle'} ${i === current && 'ring-4 ring-primary-100'}`}>
                {reached ? <Icon name="check" size={16} /> : <span className="size-2 rounded-full bg-current" />}
              </span>
              <span className={`h-0.5 flex-1 ${i === PATH.length - 1 ? 'invisible' : i < current ? 'bg-primary-600' : 'bg-line'}`} />
            </div>
            <span className={`mt-2 text-xs leading-snug font-medium sm:text-sm ${reached ? 'text-ink' : 'text-ink-muted'}`}>
              {t(`status.${statusKey(step)}`)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}