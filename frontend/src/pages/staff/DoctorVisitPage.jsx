import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Badge, Button, Card, Icon, StateMessage, StatusBadge, TextareaField, useToast } from '../../components/ui'
import { useApiGet } from '../../hooks/useApiGet'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { cn } from '../../lib/cn'
import { addDays, formatDay, statusKey } from '../../lib/format'

const QUICK_FOLLOW_UPS = [7, 14, 30, 90]

/** Consultation note + follow-up date form. Starts from the saved draft, if any. */
function VisitForm({ data, onSaved }) {
  const { t, language } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const a = data.appointment
  const [notes, setNotes] = useState(data.visit?.notes ?? '')
  const [followUp, setFollowUp] = useState(data.visit?.follow_up_date ?? null)
  const [state, setState] = useState({ busy: null, error: null })
  const minDate = addDays(a.date, 1)
  const maxDate = addDays(a.date, 366)

  async function send(kind) {
    setState({ busy: kind, error: null })
    const body = { notes, follow_up_date: followUp }
    try {
      if (kind === 'draft') {
        onSaved(await api.put(`/doctor/appointments/${a.request_id}/visit`, body))
        toast(t('staff.doctor.draftSaved'))
        setState({ busy: null, error: null })
      } else {
        await api.post(`/doctor/appointments/${a.request_id}/complete`, body)
        toast(t('staff.doctor.completedToast', { name: a.patient_name }))
        navigate('/staff')
      }
    } catch (err) {
      setState({ busy: null, error: errorMessage(t, err) })
    }
  }

  return (
    <Card padding="lg" className="space-y-6">
      <TextareaField
        label={t('staff.doctor.note')}
        hint={t('staff.doctor.noteHint')}
        rows={7}
        maxLength={2000}
        optional
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <fieldset>
        <legend className="mb-2 font-semibold">{t('staff.patients.followUp')}</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={followUp === null}
            onClick={() => setFollowUp(null)}
            className={cn(
              'min-h-11 rounded-control px-4 font-medium ring-1 ring-inset',
              followUp === null ? 'bg-primary-700 text-white ring-primary-700' : 'ring-line-strong hover:ring-primary-300',
            )}
          >
            {t('staff.doctor.noFollowUp')}
          </button>
          {QUICK_FOLLOW_UPS.map((days) => {
            const value = addDays(a.date, days)
            return (
              <button
                key={days}
                type="button"
                aria-pressed={followUp === value}
                onClick={() => setFollowUp(value)}
                className={cn(
                  'min-h-11 rounded-control px-4 font-medium ring-1 ring-inset',
                  followUp === value ? 'bg-primary-700 text-white ring-primary-700' : 'ring-line-strong hover:ring-primary-300',
                )}
              >
                {t(`staff.doctor.after.${days}`)}
              </button>
            )
          })}
          <label className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 ring-1 ring-line-strong ring-inset">
            <span className="text-sm font-medium">{t('staff.doctor.otherDate')}</span>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={followUp ?? ''}
              onChange={(e) => setFollowUp(e.target.value || null)}
              className="min-h-9 bg-transparent"
            />
          </label>
        </div>
        {followUp && (
          <p className="mt-2 font-semibold text-primary-800">
            {t('staff.doctor.followUpOn', { date: formatDay(followUp, language) })}
          </p>
        )}
      </fieldset>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" icon="fileText" onClick={() => send('draft')} disabled={Boolean(state.busy)}>
          {state.busy === 'draft' ? t('common.loading') : t('staff.doctor.saveDraft')}
        </Button>
        <Button size="lg" icon="checkCircle" onClick={() => send('complete')} disabled={Boolean(state.busy)}>
          {state.busy === 'complete' ? t('common.loading') : t('staff.doctor.complete')}
        </Button>
      </div>
    </Card>
  )
}

export default function DoctorVisitPage() {
  const { t, language } = useI18n()
  usePageTitle('visit')
  const { requestId } = useParams()
  const [result] = useApiGet(`/doctor/appointments/${encodeURIComponent(requestId)}`)
  const [saved, setSaved] = useState(null) // latest response after saving a draft

  if (result.state === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
  if (result.state === 'error') {
    return (
      <StateMessage
        kind="error"
        className="py-24"
        title={errorMessage(t, result.error)}
        action={<Button to="/staff">{t('staff.doctor.title')}</Button>}
      />
    )
  }
  const data = saved?.appointment.request_id === requestId ? saved : result.data
  const { appointment: a, patient: p, visit, previous_visits: previous } = data
  const open = ['checked_in', 'waiting'].includes(a.status)
  const day = (iso) => formatDay(iso, language, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <Link to="/staff" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-700 hover:underline">
        <Icon name="arrowLeft" size={18} />
        {t('staff.doctor.title')}
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        {a.token && <span className="grid size-14 place-items-center rounded-2xl bg-primary-700 text-2xl font-bold text-white">{a.token}</span>}
        <div className="flex-1">
          <h1 className="text-3xl">{p.name}</h1>
          <p className="text-ink-muted">
            {[p.age != null && t('staff.dash.years', { age: p.age }), p.gender && t(`form.${p.gender}`), p.patient_code].filter(Boolean).join(' · ')}
          </p>
        </div>
        <StatusBadge status={statusKey(a.status)} />
        {a.first_visit && <Badge tone="accent">{t('staff.dash.firstVisit')}</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-sans text-lg font-semibold">{t('staff.doctor.today')}</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-ink-muted">{t('form.reason')}</dt>
                <dd className="font-medium">{a.reason || t('staff.details.noReason')}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">{t('book.day')}</dt>
                <dd className="font-medium">
                  {day(a.date)} · {t(`form.${a.time_slot}`)}
                </dd>
              </div>
            </dl>
          </Card>

          {open ? (
            <VisitForm key={a.request_id} data={data} onSaved={setSaved} />
          ) : (
            <Card>
              <h2 className="font-sans text-lg font-semibold">{t('staff.doctor.note')}</h2>
              {a.status === 'completed' ? (
                <>
                  <p className="mt-2 whitespace-pre-line">{visit?.notes || t('staff.doctor.noNote')}</p>
                  <p className="mt-3 text-sm text-ink-muted">
                    {t('staff.patients.followUp')}: {visit?.follow_up_date ? day(visit.follow_up_date) : t('staff.profile.noFollowUp')}
                  </p>
                </>
              ) : (
                <Alert tone="info" className="mt-3">
                  {t('staff.doctor.notArrived')}
                </Alert>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card padding="none">
            <h2 className="border-b border-line px-5 py-4 font-sans text-lg font-semibold">{t('staff.doctor.previous')}</h2>
            {previous.length ? (
              <ul className="divide-y divide-line">
                {previous.map((v) => (
                  <li key={v.request_id} className="px-5 py-3">
                    <p className="font-semibold">{day(v.date)}</p>
                    <p className="mt-1 whitespace-pre-line">{v.notes || t('staff.doctor.noNote')}</p>
                    {v.follow_up_date && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {t('staff.patients.followUp')}: {day(v.follow_up_date)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-ink-muted">{t('staff.doctor.noPrevious')}</p>
            )}
          </Card>
          <Card padding="none">
            <h2 className="border-b border-line px-5 py-4 font-sans text-lg font-semibold">{t('staff.profile.appointments')}</h2>
            <ul className="divide-y divide-line">
              {data.appointments.map((x) => (
                <li key={x.request_id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <span>
                    {day(x.date)} · {t(`form.${x.time_slot}`)}
                  </span>
                  <StatusBadge status={statusKey(x.status)} />
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3">
              <Link to={`/staff/patients/${p.patient_code}`} className="font-semibold text-primary-700 hover:underline">
                {t('staff.doctor.fullProfile')}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
