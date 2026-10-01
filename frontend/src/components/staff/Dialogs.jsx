import { useState } from 'react'
import { useApiGet } from '../../hooks/useApiGet'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { formatDay, formatTime, statusKey } from '../../lib/format'
import { DatePicker } from '../booking/DatePicker'
import { Alert, Button, ChoiceChips, Icon, Modal, PhoneField, StateMessage, StatusBadge, TextareaField, TextField } from '../ui'
import { ACTION_ICONS, ACTION_TO_STATUS, availableActions } from './actions'
import { PatientContact } from './PatientContact'
import { usePaymentLine } from '../../hooks/usePaymentLine'
import { formatRupees } from '../../lib/card'

const SLOTS = ['morning', 'midday', 'afternoon']

/** Everything about one appointment + every allowed action + its history. */
export function DetailsModal({ a, today, busy, onClose, onAction }) {
  const { t, language } = useI18n()
  const paymentLine = usePaymentLine()
  if (!a) return <Modal open={false} onClose={onClose} />
  const p = a.payment
  const rows = [
    ['user', t('staff.details.patientNo'), `${a.patient_name} · ${a.patient_code}`],
    ['calendar', t('book.day'), `${formatDay(a.date, language)} · ${t(`form.${a.time_slot}`)}`],
    ['fileText', t('form.reason'), a.reason || t('staff.details.noReason')],
    ...(a.clinic_patient_ref ? [['clipboard', t('form.patientId'), a.clinic_patient_ref]] : []),
    ['send', t('staff.details.source'), t(`staff.details.sources.${a.source}`)],
    ...(p
      ? [['rupee', t('pay.fee'), `${t(`pay.status.${p.status}`)} · ${p.status === 'pending' ? formatRupees(p.amount, language) : paymentLine(p)}`]]
      : []),
  ]
  const collectCash = p?.status === 'pending' && a.status !== 'cancelled'
  return (
    <Modal open onClose={onClose} title={t('staff.details.title', { id: a.request_id })} size="lg">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={statusKey(a.status)} />
          {a.token && <span className="font-semibold">{t('staff.dash.columns.token')}: {a.token}</span>}
          <PatientContact a={a} />
        </div>
        <dl className="divide-y divide-line rounded-control border border-line">
          {rows.map(([icon, label, value]) => (
            <div key={label} className="relative py-3 pr-3 pl-11">
              <dt className="text-sm text-ink-muted">
                <Icon name={icon} className="absolute top-3.5 left-3 text-primary-700" />
                {label}
              </dt>
              <dd className="font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {collectCash && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-warning-50 p-3 ring-1 ring-warning-600/25">
            <p className="font-medium text-warning-700">{t('pay.collectAtDesk', { amount: formatRupees(p.amount, language) })}</p>
            <Button size="sm" icon="rupee" disabled={busy} onClick={() => onAction(a, 'paidCash')}>
              {t('staff.actions.paidCash')}
            </Button>
          </div>
        )}
        {availableActions(a, today).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableActions(a, today).map((action) => (
            <Button
              key={action}
              size="sm"
              variant={action === 'cancel' ? 'danger' : action in ACTION_TO_STATUS ? 'primary' : 'secondary'}
              icon={ACTION_ICONS[action]}
              disabled={busy}
              onClick={() => onAction(a, action)}
            >
              {t(`staff.actions.${action}`)}
            </Button>
          ))}
        </div>
        )}
        <section aria-labelledby="history-title">
          <h3 id="history-title" className="mb-3 font-sans text-base font-semibold">
            {t('staff.details.history')}
          </h3>
          <ol className="space-y-3 border-l-2 border-line pl-4">
            {a.history.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute top-1.5 -left-[1.4rem] size-3 rounded-full bg-primary-600 ring-4 ring-surface" />
                <p className="font-medium">{t(`status.${statusKey(h.status)}`)}</p>
                <p className="text-sm text-ink-muted">
                  {formatDay(h.at.slice(0, 10), language, { day: 'numeric', month: 'short' })} {formatTime(h.at, language)} ·{' '}
                  {t('staff.details.by', { name: h.by === 'patient' ? t('staff.details.byPatient') : h.by })}
                </p>
                {h.note && <p className="text-sm">{h.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  )
}

export function RescheduleModal({ a, onClose, onDone }) {
  const { t, language } = useI18n()
  const [options] = useApiGet('/booking/options?staff=true')
  const [date, setDate] = useState(a.date)
  const [slot, setSlot] = useState(a.time_slot)
  const [note, setNote] = useState('')
  const [state, setState] = useState({ busy: false, error: null })

  async function save() {
    setState({ busy: true, error: null })
    try {
      const updated = await api.post(`/staff/appointments/${a.request_id}/reschedule`, { date, time_slot: slot, note })
      onDone(updated, t('staff.toast.rescheduled', { name: a.patient_name, date: formatDay(date, language, { day: 'numeric', month: 'short' }) }))
    } catch (err) {
      setState({ busy: false, error: errorMessage(t, err) })
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t('staff.reschedule.title', { name: a.patient_name })}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('staff.cancel.keep')}
          </Button>
          <Button icon="calendar" onClick={save} disabled={state.busy}>
            {t('staff.reschedule.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {options.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
        {options.state === 'ready' && (
          <DatePicker dates={options.data.dates} today={options.data.today} value={date} onChange={setDate} />
        )}
        <ChoiceChips
          legend={t('book.chooseTime')}
          name="reschedule-slot"
          value={slot}
          onChange={setSlot}
          options={SLOTS.map((s) => ({ value: s, label: t(`form.${s}`) }))}
        />
        <TextField label={t('staff.reschedule.note')} optional maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
        {state.error && <Alert tone="error">{state.error}</Alert>}
      </div>
    </Modal>
  )
}

export function CancelModal({ a, onClose, onConfirm, busy, error }) {
  const { t, language } = useI18n()
  const [note, setNote] = useState('')
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t('staff.cancel.title')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('staff.cancel.keep')}
          </Button>
          <Button variant="danger" onClick={() => onConfirm(note)} disabled={busy}>
            {t('staff.cancel.submit')}
          </Button>
        </>
      }
    >
      <p className="mb-4">{t('staff.cancel.body', { name: a.patient_name, date: formatDay(a.date, language, { weekday: 'long', day: 'numeric', month: 'long' }) })}</p>
      <TextareaField label={t('staff.cancel.reason')} optional rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <Alert tone="error" className="mt-4">{error}</Alert>}
    </Modal>
  )
}

const EMPTY_WALK_IN = { phone: '', name: '', age: '', gender: '', reason: '' }

/** Patient at the desk: check in now, or book another day. Existing patients are matched by mobile. */
export function WalkInModal({ onClose, onDone, initial, initialWhen = 'now' }) {
  const { t, language } = useI18n()
  const [form, setForm] = useState({ ...EMPTY_WALK_IN, ...initial })
  const [when, setWhen] = useState(initialWhen)
  const [date, setDate] = useState(null)
  const [slot, setSlot] = useState('morning')
  const [errors, setErrors] = useState({})
  const [state, setState] = useState({ busy: false, error: null })
  const [options] = useApiGet(when === 'later' ? '/booking/options?staff=true' : null)
  const set = (field) => (e) => setForm({ ...form, [field]: e?.target ? e.target.value : e })

  async function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = t('form.errors.mobile')
    if (form.name.trim().length < 2) errs.name = t('form.errors.required')
    const age = Number(form.age)
    if (form.age === '' || !Number.isInteger(age) || age < 0 || age > 120) errs.age = t('form.errors.age')
    if (!form.gender) errs.gender = t('form.errors.choose')
    if (when === 'later' && !date) errs.date = t('book.errors.day')
    setErrors(errs)
    if (Object.keys(errs).length) return
    setState({ busy: true, error: null })
    try {
      const body = { ...form, age, ...(when === 'later' ? { date, time_slot: slot } : {}) }
      const created = await api.post('/staff/walk-ins', body)
      onDone(
        created,
        created.token
          ? t('staff.toast.walkIn', { name: created.patient_name, token: created.token })
          : t('staff.toast.walkInLater', { name: created.patient_name, date: formatDay(created.date, language, { day: 'numeric', month: 'short' }) }),
      )
    } catch (err) {
      setState({ busy: false, error: errorMessage(t, err) + (err.code === 'duplicate_booking' && err.requestId ? ` (${err.requestId})` : '') })
    }
  }

  return (
    <Modal open onClose={onClose} size="lg" title={t('staff.walkIn.title')}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <p className="text-ink-muted">{t('staff.walkIn.lead')}</p>
        <PhoneField label={t('form.mobile')} value={form.phone} onChange={set('phone')} error={errors.phone} autoFocus />
        <TextField label={t('form.fullName')} value={form.name} onChange={set('name')} error={errors.name} autoComplete="off" />
        <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
          <TextField label={t('form.age')} type="number" inputMode="numeric" min={0} max={120} value={form.age} onChange={set('age')} error={errors.age} />
          <ChoiceChips
            legend={t('form.gender')}
            name="walkin-gender"
            value={form.gender}
            onChange={set('gender')}
            error={errors.gender}
            options={['female', 'male', 'other'].map((v) => ({ value: v, label: t(`form.${v}`) }))}
          />
        </div>
        <TextareaField label={t('form.reason')} optional rows={2} maxLength={500} value={form.reason} onChange={set('reason')} />
        <ChoiceChips
          legend={t('staff.walkIn.when')}
          name="walkin-when"
          value={when}
          onChange={setWhen}
          options={[
            { value: 'now', label: t('staff.walkIn.now'), icon: 'user' },
            { value: 'later', label: t('staff.walkIn.later'), icon: 'calendar' },
          ]}
        />
        {when === 'later' && options.state === 'ready' && (
          <div className="space-y-5 rounded-control bg-sunken/60 p-4">
            <DatePicker dates={options.data.dates.slice(1)} today={options.data.today} value={date} onChange={setDate} error={errors.date} />
            <ChoiceChips
              legend={t('book.chooseTime')}
              name="walkin-slot"
              value={slot}
              onChange={setSlot}
              options={SLOTS.map((s) => ({ value: s, label: t(`form.${s}`) }))}
            />
          </div>
        )}
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('staff.cancel.keep')}
          </Button>
          <Button type="submit" icon={when === 'now' ? 'user' : 'calendar'} disabled={state.busy}>
            {when === 'now' ? t('staff.walkIn.submit') : t('staff.walkIn.submitLater')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
