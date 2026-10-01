import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { PaymentBadge } from '../components/payment/PaymentStatus'
import { Button, Card, Container, Icon, Reveal, StateMessage, StatusBadge } from '../components/ui'
import { useApiGet } from '../hooks/useApiGet'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'
import { errorMessage } from '../lib/api'
import { formatDay, statusKey } from '../lib/format'

function AppointmentRow({ a }) {
  const { t, language } = useI18n()
  return (
    <Card interactive padding="none">
      <Link
        to={`/appointments/${a.request_id}`}
        className="flex items-center gap-4 p-4 sm:p-5 focus-visible:outline-offset-4"
      >
        <span className="grid w-16 shrink-0 place-items-center rounded-xl bg-primary-50 py-2 text-center text-primary-800">
          <span className="text-xs font-semibold uppercase">{formatDay(a.date, language, { month: 'short' })}</span>
          <span className="text-2xl leading-none font-bold">{formatDay(a.date, language, { day: 'numeric' })}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">
            {formatDay(a.date, language, { weekday: 'long' })} · {t(`form.${a.time_slot}`)}
          </span>
          <span className="block text-sm text-ink-muted">
            {t('meta.doctor')} · <span className="font-mono">{a.request_id}</span>
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <StatusBadge status={statusKey(a.status)} />
            {a.status !== 'cancelled' && <PaymentBadge payment={a.payment} />}
          </span>
        </span>
        <Icon name="arrowRight" className="shrink-0 text-ink-subtle" />
      </Link>
    </Card>
  )
}

export default function MyAppointmentsPage() {
  const { t, language } = useI18n()
  usePageTitle('myAppointments')
  const { patient, logout } = useAuth()
  const [result, load] = useApiGet('/appointments/mine')

  // After logout, RequireAuth sends the patient to the home page.
  const onLogout = () => logout()

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl">{t('my.title')}</h1>
          <p className="mt-2 text-ink-muted">
            {patient.name ? t('my.hello', { name: patient.name }) : t('my.lead')}
          </p>
        </div>
        <Button to="/book" icon="calendar">
          {t('common.bookAppointment')}
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          {result.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
          {result.state === 'error' && (
            <StateMessage
              kind="error"
              title={errorMessage(t, result.error)}
              action={
                <Button variant="secondary" onClick={load}>
                  {t('common.tryAgain')}
                </Button>
              }
            />
          )}
          {result.state === 'ready' && (
            <>
              <section aria-labelledby="upcoming-title">
                <h2 id="upcoming-title" className="mb-4 text-2xl">
                  {t('my.upcoming')}
                </h2>
                {result.data.upcoming.length ? (
                  <ul className="space-y-3">
                    {result.data.upcoming.map((a, i) => (
                      <Reveal as="li" key={a.request_id} delay={i * 60}>
                        <AppointmentRow a={a} />
                      </Reveal>
                    ))}
                  </ul>
                ) : (
                  <Card tone="muted" padding="none">
                    <StateMessage
                      kind="empty"
                      title={t('my.noUpcoming')}
                      body={t('my.noUpcomingBody')}
                      action={
                        <Button to="/book" icon="calendar">
                          {t('common.bookAppointment')}
                        </Button>
                      }
                    />
                  </Card>
                )}
              </section>

              <section aria-labelledby="previous-title">
                <h2 id="previous-title" className="mb-4 text-2xl">
                  {t('my.previous')}
                </h2>
                {result.data.previous.length ? (
                  <ul className="space-y-3">
                    {result.data.previous.map((a) => (
                      <li key={a.request_id}>
                        <AppointmentRow a={a} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-muted">{t('my.noPrevious')}</p>
                )}
              </section>
            </>
          )}
        </div>

        <aside aria-labelledby="profile-title">
          <Card>
            <h2 id="profile-title" className="text-xl">
              {t('my.profile')}
            </h2>
            <dl className="mt-4 space-y-3 text-[0.95rem]">
              {[
                [t('form.fullName'), patient.name],
                [t('form.mobile'), `+91 ${patient.phone}`],
                [t('form.age'), patient.age],
                [t('form.gender'), patient.gender && t(`form.${patient.gender}`)],
                [t('my.patientCode'), patient.patient_code],
                ...(patient.follow_up_date ? [[t('my.followUp'), formatDay(patient.follow_up_date, language)]] : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-ink-muted">{label}</dt>
                  <dd className="font-medium">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
            <Button variant="secondary" size="sm" className="mt-6" fullWidth onClick={onLogout}>
              {t('my.logout')}
            </Button>
          </Card>
        </aside>
      </div>
    </Container>
  )
}
