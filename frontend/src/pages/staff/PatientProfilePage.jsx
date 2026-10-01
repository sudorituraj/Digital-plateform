import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStaffAuth } from '../../auth/staffContext'
import { WalkInModal } from '../../components/staff/Dialogs'
import { PatientContact } from '../../components/staff/PatientContact'
import { PatientFormModal } from '../../components/staff/PatientFormModal'
import { Alert, Badge, Button, Card, Icon, StateMessage, StatusBadge, TextField, useToast } from '../../components/ui'
import { useApiGet } from '../../hooks/useApiGet'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { formatDay, formatTime, statusKey } from '../../lib/format'

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="font-medium break-words">{children ?? '—'}</dd>
    </div>
  )
}

export default function PatientProfilePage() {
  const { t, language } = useI18n()
  usePageTitle('patient')
  const { code } = useParams()
  const { staff } = useStaffAuth()
  const toast = useToast()
  const frontDesk = staff.role !== 'doctor'
  const [result, reload] = useApiGet(`/staff/patients/${encodeURIComponent(code)}`)
  const [dialog, setDialog] = useState(null) // 'edit' | 'book'
  const [note, setNote] = useState('')
  const [noteState, setNoteState] = useState({ busy: false, error: null })

  if (result.state === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
  if (result.state === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="sr-only">{t('staff.patients.title')}</h1>
        <StateMessage
          kind={result.error.status === 404 ? 'empty' : 'error'}
          title={result.error.status === 404 ? t('staff.profile.notFound') : errorMessage(t, result.error)}
          action={<Button to={frontDesk ? '/staff/patients' : '/staff'}>{t('staff.profile.back')}</Button>}
        />
      </div>
    )
  }

  const { patient: p, appointments, visits } = result.data
  const day = (iso) => formatDay(iso, language, { day: 'numeric', month: 'short', year: 'numeric' })

  async function addNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    setNoteState({ busy: true, error: null })
    try {
      await api.post(`/staff/patients/${p.patient_code}/notes`, { text: note })
      setNote('')
      setNoteState({ busy: false, error: null })
      reload()
    } catch (err) {
      setNoteState({ busy: false, error: errorMessage(t, err) })
    }
  }

  return (
    <div className="mx-auto max-w-[96rem] space-y-6 px-4 py-6 sm:px-6">
      <Link to={frontDesk ? '/staff/patients' : '/staff'} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-700 hover:underline">
        <Icon name="arrowLeft" size={18} />
        {frontDesk ? t('staff.patients.title') : t('staff.doctor.title')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{p.name ?? t('staff.patients.noName')}</h1>
          <p className="mt-1 text-ink-muted">
            {[p.patient_code, p.age != null && t('staff.dash.years', { age: p.age }), p.gender && t(`form.${p.gender}`)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PatientContact
            a={{ patient_phone: p.phone, patient_name: p.name ?? '' }}
            message={t('staff.whatsappGeneric', { name: p.name ?? '' })}
          />
          {frontDesk && (
            <>
              <Button variant="secondary" icon="fileText" onClick={() => setDialog('edit')}>
                {t('staff.patients.edit')}
              </Button>
              <Button icon="calendar" onClick={() => setDialog('book')}>
                {t('staff.profile.book')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-sans text-lg font-semibold">{t('staff.profile.details')}</h2>
            <dl className="mt-4 grid gap-3">
              <Detail label={t('form.mobile')}>+91 {p.phone}</Detail>
              <Detail label={t('form.fatherHusbandName')}>{p.father_husband_name}</Detail>
              <Detail label={t('form.address')}>{p.address}</Detail>
              <Detail label={t('form.email')}>{p.email}</Detail>
              <Detail label={t('staff.profile.registered')}>
                {day(p.created_at.slice(0, 10))} · {t(`staff.profile.sources.${p.source}`, {})}
              </Detail>
            </dl>
          </Card>

          <Card tone={p.follow_up_date ? 'default' : 'muted'}>
            <h2 className="font-sans text-lg font-semibold">{t('staff.patients.followUp')}</h2>
            <p className="mt-2 text-2xl font-bold">{p.follow_up_date ? day(p.follow_up_date) : t('staff.profile.noFollowUp')}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {t('staff.patients.lastVisit')}: {p.last_visit ? day(p.last_visit) : t('staff.patients.never')} ·{' '}
              {t('staff.patients.visits', { n: p.visits_count })}
            </p>
          </Card>

          {frontDesk && (
            <Card>
              <h2 className="font-sans text-lg font-semibold">{t('staff.profile.notes')}</h2>
              <p className="text-sm text-ink-muted">{t('staff.profile.notesHint')}</p>
              <form onSubmit={addNote} className="mt-3 flex items-end gap-2">
                <TextField label={t('staff.profile.addNote')} className="flex-1" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
                <Button type="submit" size="md" disabled={noteState.busy || !note.trim()}>
                  {t('staff.profile.saveNote')}
                </Button>
              </form>
              {noteState.error && <Alert tone="error" className="mt-3">{noteState.error}</Alert>}
              <ul className="mt-4 space-y-3">
                {p.notes.map((n, i) => (
                  <li key={i} className="rounded-control bg-sunken/60 p-3">
                    <p>{n.text}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {day(n.at.slice(0, 10))} {formatTime(n.at, language)} · {n.by}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card padding="none">
            <h2 className="border-b border-line px-5 py-4 font-sans text-lg font-semibold">{t('staff.profile.appointments')}</h2>
            {appointments.length ? (
              <ul className="divide-y divide-line">
                {appointments.map((a) => (
                  <li key={a.request_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <span>
                      <span className="block font-medium">
                        {formatDay(a.date, language, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                        {t(`form.${a.time_slot}`)}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        <span className="font-mono">{a.request_id}</span>
                        {a.reason && ` · ${a.reason}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {a.token && <Badge tone="primary">{t('staff.dash.columns.token')} {a.token}</Badge>}
                      <StatusBadge status={statusKey(a.status)} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <StateMessage kind="empty" title={t('staff.profile.noAppointments')} />
            )}
          </Card>

          <Card padding="none">
            <h2 className="border-b border-line px-5 py-4 font-sans text-lg font-semibold">{t('staff.profile.visits')}</h2>
            {!frontDesk || visits.length === 0 ? null : (
              <p className="px-5 pt-3 text-sm text-ink-muted">{t('staff.profile.notesPrivate')}</p>
            )}
            {visits.length ? (
              <ul className="divide-y divide-line">
                {visits.map((v) => (
                  <li key={v.request_id} className="px-5 py-3">
                    <p className="font-medium">{day(v.date)}</p>
                    {v.notes && <p className="mt-1 whitespace-pre-line">{v.notes}</p>}
                    <p className="mt-1 text-sm text-ink-muted">
                      {t('staff.patients.followUp')}: {v.follow_up_date ? day(v.follow_up_date) : t('staff.profile.noFollowUp')}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <StateMessage kind="empty" title={t('staff.profile.noVisits')} />
            )}
          </Card>
        </div>
      </div>

      {dialog === 'edit' && (
        <PatientFormModal
          patient={p}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            toast(t('staff.patients.saved'))
            reload()
          }}
        />
      )}
      {dialog === 'book' && (
        <WalkInModal
          initial={{ phone: p.phone, name: p.name ?? '', age: p.age != null ? String(p.age) : '', gender: p.gender ?? '' }}
          initialWhen="later"
          onClose={() => setDialog(null)}
          onDone={(created, message) => {
            setDialog(null)
            toast(message)
            reload()
          }}
        />
      )}
    </div>
  )
}
