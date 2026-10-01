import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { StatusTimeline } from '../components/booking/StatusTimeline'
import { AppointmentPayment } from '../components/payment/AppointmentPayment'
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
  const [paidNow, setPaidNow] = useState(null) // the updated appointment after paying on this page
  const justPaid = Boolean(state?.justPaid || paidNow)

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

  const a = paidNow ?? result.data
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
          {state?.justPaid && (
            <p className="mx-auto mt-4 inline-flex animate-fade-up items-center gap-2 rounded-full bg-success-50 px-4 py-2 font-semibold text-success-700 ring-1 ring-success-600/25 [animation-delay:160ms]">
              <Icon name="checkCircle" size={18} />
              {t('pay.successShort')}
            </p>
          )}
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
            <div key={label} className="relative py-4 pr-5 pl-14 sm:pr-7 sm:pl-16">
              <dt className="text-sm text-ink-muted">
                <Icon name={icon} className="absolute top-4.5 left-5 text-primary-700 sm:left-7" />
                {label}
              </dt>
              <dd className="font-semibold break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <AppointmentPayment appointment={a} justPaid={justPaid} onPaid={setPaidNow} />
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
