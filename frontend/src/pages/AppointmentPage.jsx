import { useLocation, useParams } from 'react-router-dom'
import { StatusTimeline } from '../components/booking/StatusTimeline'
import { Button, Card, Container, Icon, StateMessage, StatusBadge } from '../components/ui'
import { clinic, telLink, whatsappLink } from '../config/clinic'
import { useApiGet } from '../hooks/useApiGet'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'
import { errorMessage } from '../lib/api'
import { formatDay, statusKey } from '../lib/format'

/** Confirmation screen right after booking (justBooked) and the details view afterwards. */
export default function AppointmentPage() {
  const { t, language } = useI18n()
  usePageTitle('appointment')
  const { requestId } = useParams()
  const { state } = useLocation()
  const justBooked = Boolean(state?.justBooked)
  const [result, load] = useApiGet(`/appointments/${encodeURIComponent(requestId)}`)

  if (result.state === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
  if (result.state === 'error') {
    return (
      <Container size="narrow" className="py-16">
        <h1 className="sr-only">{t('appointment.title')}</h1>
        <StateMessage
          kind={result.error.status === 404 ? 'empty' : 'error'}
          title={result.error.status === 404 ? t('appointment.notFound') : errorMessage(t, result.error)}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              {result.error.status !== 404 && (
                <Button variant="secondary" onClick={load}>
                  {t('common.tryAgain')}
                </Button>
              )}
              <Button to="/my-appointments">{t('my.title')}</Button>
            </div>
          }
        />
      </Container>
    )
  }

  const a = result.data
  const rows = [
    ['user', t('book.patient'), a.patient_name],
    ['stethoscope', t('book.doctor'), t('meta.doctor')],
    ['calendar', t('book.day'), formatDay(a.date, language)],
    ['clock', t('book.time'), t(`form.${a.time_slot}`)],
    ...(a.reason ? [['fileText', t('form.reason'), a.reason]] : []),
  ]

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      {justBooked ? (
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid size-20 animate-[pop_0.5s_var(--ease-gentle)_both] place-items-center rounded-full bg-success-50 text-success-600 ring-8 ring-success-50/60">
            <Icon name="checkCircle" size={44} strokeWidth={1.7} />
          </span>
          <h1 className="animate-fade-up text-3xl sm:text-4xl">{t('appointment.submittedTitle')}</h1>
          <p className="mx-auto mt-3 max-w-lg animate-fade-up text-lg text-ink-muted [animation-delay:80ms]">
            {t('appointment.submittedBody')}
          </p>
        </div>
      ) : (
        <h1 className="mb-6 text-3xl sm:text-4xl">{t('appointment.title')}</h1>
      )}

      <Card padding="none" className="animate-fade-up overflow-hidden [animation-delay:140ms]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-primary-50/60 px-5 py-4 sm:px-7">
          <div>
            <p className="text-sm font-semibold text-ink-muted">{t('appointment.requestId')}</p>
            <p className="font-mono text-2xl font-bold tracking-wider text-primary-900">{a.request_id}</p>
          </div>
          <StatusBadge status={statusKey(a.status)} />
        </div>
        <div className="px-5 py-5 sm:px-7">
          <StatusTimeline status={a.status} />
        </div>
        <dl className="divide-y divide-line border-t border-line">
          {rows.map(([icon, label, value]) => (
            <div key={label} className="flex items-start gap-3.5 px-5 py-4 sm:px-7">
              <Icon name={icon} className="mt-0.5 shrink-0 text-primary-700" />
              <div className="min-w-0">
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd className="font-semibold break-words">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <div className="border-t border-line bg-sunken/50 px-5 py-4 text-sm text-ink-muted sm:px-7">
          {t('appointment.keepId')} · {t('footer.phone')}: <a href={telLink()} className="font-semibold text-primary-800">{clinic.phoneDisplay}</a>
        </div>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button href={telLink()} variant="secondary" icon="phone" size="lg">
          {t('common.callClinic')}
        </Button>
        <Button
          href={whatsappLink(t('appointment.whatsappMessage', { id: a.request_id }))}
          variant="whatsapp"
          icon="whatsapp"
          size="lg"
        >
          {t('common.whatsapp')}
        </Button>
        <Button to="/my-appointments" icon="calendar" size="lg">
          {t('appointment.viewMine')}
        </Button>
        <Button to="/" variant="ghost" icon="home" size="lg">
          {t('common.backHome')}
        </Button>
      </div>
    </Container>
  )
}
