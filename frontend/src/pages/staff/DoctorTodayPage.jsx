import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Icon, StateMessage, StatusBadge } from '../../components/ui'
import { useApiGet } from '../../hooks/useApiGet'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { errorMessage } from '../../lib/api'
import { formatDay, formatTime, statusKey } from '../../lib/format'

function PatientLine({ a }) {
  const { t } = useI18n()
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-lg font-semibold">{a.patient_name}</span>
      <span className="block text-sm text-ink-muted">
        {[a.patient_age != null && t('staff.dash.years', { age: a.patient_age }), a.patient_gender && t(`form.${a.patient_gender}`), a.reason]
          .filter(Boolean)
          .join(' · ')}
      </span>
      {a.first_visit && <Badge tone="accent" className="mt-1">{t('staff.dash.firstVisit')}</Badge>}
    </span>
  )
}

/** The doctor's day: who is here (in token order), who is still to come, who is done. */
export default function DoctorTodayPage() {
  const { t, language } = useI18n()
  usePageTitle('doctorHome')
  const [result, reload] = useApiGet('/doctor/today')

  useEffect(() => {
    const id = setInterval(reload, 30_000)
    window.addEventListener('focus', reload)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', reload)
    }
  }, [reload])

  if (result.state === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
  if (result.state === 'error') return <StateMessage kind="error" title={errorMessage(t, result.error)} className="py-24" />
  const d = result.data

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl">{t('staff.doctor.title')}</h1>
        <p className="mt-1 text-lg text-ink-muted">{formatDay(d.date, language)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['queue', t('staff.doctor.counts.queue')],
          ['waiting', t('status.waiting')],
          ['later', t('staff.doctor.counts.later')],
          ['completed', t('status.completed')],
        ].map(([k, label]) => (
          <div key={k} className="rounded-control border border-line bg-surface p-3">
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="text-3xl font-bold tabular-nums">{d.counts[k]}</dd>
          </div>
        ))}
      </dl>

      <Card padding="none">
        <h2 className="border-b border-line px-5 py-4 font-sans text-lg font-semibold">{t('staff.doctor.queue')}</h2>
        {d.queue.length ? (
          <ol className="divide-y divide-line">
            {d.queue.map((a, i) => (
              <li key={a.request_id}>
                <Link
                  to={`/staff/visit/${a.request_id}`}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-primary-50/50 ${i === 0 ? 'bg-primary-50/60' : ''}`}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-700 text-xl font-bold text-white">
                    {a.token}
                  </span>
                  <PatientLine a={a} />
                  <StatusBadge status={statusKey(a.status)} />
                  <span className="hidden items-center gap-1 font-semibold text-primary-700 sm:inline-flex">
                    {i === 0 ? t('staff.doctor.seeNext') : t('staff.doctor.open')}
                    <Icon name="arrowRight" size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <StateMessage kind="empty" title={t('staff.doctor.emptyQueue')} body={t('staff.doctor.emptyQueueBody')} />
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card padding="none">
          <h2 className="border-b border-line px-5 py-4 font-sans text-lg font-semibold">{t('staff.doctor.later')}</h2>
          {d.later.length ? (
            <ul className="divide-y divide-line">
              {d.later.map((a) => (
                <li key={a.request_id} className="flex items-center gap-3 px-5 py-3">
                  <PatientLine a={a} />
                  <span className="text-sm font-medium">{t(`form.${a.time_slot}`)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-ink-muted">{t('staff.doctor.noneLater')}</p>
          )}
        </Card>
        <Card padding="none">
          <h2 className="border-b border-line px-5 py-4 font-sans text-lg font-semibold">{t('staff.doctor.completed')}</h2>
          {d.completed.length ? (
            <ul className="divide-y divide-line">
              {d.completed.map((a) => (
                <li key={a.request_id}>
                  <Link to={`/staff/visit/${a.request_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-primary-50/50">
                    <PatientLine a={a} />
                    <span className="text-sm text-ink-muted">{formatTime(a.updated_at, language)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-ink-muted">{t('staff.doctor.noneCompleted')}</p>
          )}
        </Card>
      </div>
      <p className="text-right text-sm text-ink-muted">{t('staff.dash.autoRefresh')}</p>
    </div>
  )
}
