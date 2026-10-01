import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { DatePicker } from '../components/booking/DatePicker'
import { OtpForm } from '../components/booking/OtpForm'
import { Stepper } from '../components/booking/Stepper'
import {
  Alert,
  Button,
  Card,
  ChoiceChips,
  Container,
  Icon,
  StateMessage,
  TextareaField,
  TextField,
} from '../components/ui'
import { findService } from '../config/services'
import { useApiGet } from '../hooks/useApiGet'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'
import { api, errorMessage } from '../lib/api'
import { formatDay } from '../lib/format'

const STEPS = ['mobile', 'when', 'details', 'review']
const SLOT_ICONS = { morning: 'clock', afternoon: 'clock', evening: 'clock' }

function validateDetails(d, t) {
  const errors = {}
  if (d.name.trim().length < 2) errors.name = t('form.errors.required')
  const age = Number(d.age)
  if (d.age === '' || !Number.isInteger(age) || age < 0 || age > 120) errors.age = t('form.errors.age')
  if (!d.gender) errors.gender = t('form.errors.choose')
  if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) errors.email = t('form.errors.email')
  if (d.clinicRef && !/^[A-Za-z0-9/\- ]+$/.test(d.clinicRef)) errors.clinicRef = t('form.errors.patientId')
  return errors
}

export default function BookPage() {
  const { t, language } = useI18n()
  usePageTitle('book')
  const { status, patient, setPatient } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const service = findService(params.get('service') ?? '')

  const [step, setStep] = useState(null)
  const [options, loadOptions] = useApiGet('/booking/options')
  const [when, setWhen] = useState({ date: null, slot: null })
  const [whenErrors, setWhenErrors] = useState({})
  const [editedDetails, setDetails] = useState(null)
  const [detailErrors, setDetailErrors] = useState({})
  const [submit, setSubmit] = useState({ busy: false, error: null })
  const headingRef = useRef(null)

  // First step depends on whether the visitor is already logged in.
  const currentStep = step ?? (status === 'patient' ? 'when' : 'mobile')

  // Until the patient edits anything, the form is pre-filled from their profile
  // (and the service they came from, if any).
  const details =
    editedDetails ??
    (patient && {
      name: patient.name ?? '',
      age: patient.age != null ? String(patient.age) : '',
      gender: patient.gender ?? '',
      email: patient.email ?? '',
      reason: service ? t(`services.items.${service.key}.title`) : '',
      clinicRef: '',
    })

  const goTo = (next) => {
    setStep(next)
    window.scrollTo({ top: 0 })
    // Move focus to the new step's heading so screen readers announce it.
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  const continueFromWhen = () => {
    const errors = {}
    if (!when.date) errors.date = t('book.errors.day')
    if (!when.slot) errors.slot = t('book.errors.time')
    setWhenErrors(errors)
    if (!Object.keys(errors).length) goTo('details')
  }

  const continueFromDetails = (e) => {
    e.preventDefault()
    const errors = validateDetails(details, t)
    setDetailErrors(errors)
    if (Object.keys(errors).length) {
      document.getElementById(`field-${Object.keys(errors)[0]}`)?.focus()
      return
    }
    goTo('review')
  }

  const submitBooking = async () => {
    setSubmit({ busy: true, error: null })
    try {
      const appointment = await api.post('/appointments', {
        date: when.date,
        time_slot: when.slot,
        name: details.name,
        age: Number(details.age),
        gender: details.gender,
        email: details.email,
        reason: details.reason,
        clinic_patient_ref: details.clinicRef,
      })
      // The booking also saved the profile on the server; keep the in-app copy in sync.
      setPatient({ ...patient, name: details.name.trim(), age: Number(details.age), gender: details.gender, email: details.email || null })
      navigate(`/appointments/${appointment.request_id}`, { state: { justBooked: true } })
    } catch (error) {
      setSubmit({ busy: false, error: errorMessage(t, error) })
    }
  }

  const set = (field) => (e) => setDetails({ ...details, [field]: e?.target ? e.target.value : e })

  if (status === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">{t('book.title')}</h1>
      <p className="mt-2 text-ink-muted">{t('book.lead')}</p>
      <div className="mt-6">
        <Stepper steps={STEPS} current={currentStep} />
      </div>

      <Card padding="lg" className="mt-6 animate-fade-in" key={currentStep}>
        <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-2xl outline-none">
          {t(`book.steps.${currentStep}`)}
        </h2>

        {currentStep === 'mobile' && <OtpForm onSuccess={() => goTo('when')} />}

        {currentStep === 'when' && (
          <div className="space-y-7">
            {options.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
            {options.state === 'error' && (
              <StateMessage
                kind="error"
                title={errorMessage(t, options.error)}
                action={
                  <Button variant="secondary" onClick={loadOptions}>
                    {t('common.tryAgain')}
                  </Button>
                }
              />
            )}
            {options.state === 'ready' && (
              <>
                {/* Only one doctor: shown as the chosen doctor, not a picker (DECISIONS.md D2). */}
                <div className="flex items-center gap-4 rounded-control bg-primary-50 p-3 ring-1 ring-primary-100">
                  {/* Replace with the doctor's approved photo when available. */}
                  <span data-replace="Doctor thumbnail" className="grid size-14 shrink-0 place-items-center rounded-full bg-surface text-primary-700 ring-1 ring-primary-200">
                    <Icon name="user" size={26} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-muted">{t('book.yourDoctor')}</p>
                    <p className="font-display text-lg font-bold">{t('meta.doctor')}</p>
                  </div>
                  <Icon name="checkCircle" className="ml-auto text-primary-700" label={t('book.selected')} />
                </div>

                <DatePicker
                  dates={options.data.dates}
                  today={options.data.today}
                  value={when.date}
                  onChange={(date) => setWhen((w) => ({ ...w, date }))}
                  error={whenErrors.date}
                />

                <ChoiceChips
                  legend={t('book.chooseTime')}
                  name="booking-slot"
                  value={when.slot}
                  onChange={(slot) => setWhen((w) => ({ ...w, slot }))}
                  error={whenErrors.slot}
                  options={options.data.time_slots.map((s) => ({ value: s, label: t(`form.${s}`), icon: SLOT_ICONS[s] }))}
                />

                <Alert tone="warning">{t('alerts.warning')}</Alert>

                <Button size="lg" fullWidth iconRight="arrowRight" onClick={continueFromWhen}>
                  {t('form.continue')}
                </Button>
              </>
            )}
          </div>
        )}

        {currentStep === 'details' && details && (
          <form onSubmit={continueFromDetails} noValidate className="space-y-5">
            <TextField
              id="field-name"
              label={t('form.fullName')}
              placeholder={t('form.fullNamePlaceholder')}
              autoComplete="name"
              value={details.name}
              onChange={set('name')}
              error={detailErrors.name}
            />
            <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
              <TextField
                id="field-age"
                label={t('form.age')}
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                value={details.age}
                onChange={set('age')}
                error={detailErrors.age}
              />
              <ChoiceChips
                legend={t('form.gender')}
                name="gender"
                value={details.gender}
                onChange={set('gender')}
                error={detailErrors.gender}
                options={['female', 'male', 'other'].map((v) => ({ value: v, label: t(`form.${v}`) }))}
              />
            </div>
            <TextareaField
              id="field-reason"
              label={t('form.reason')}
              placeholder={t('form.reasonPlaceholder')}
              optional
              maxLength={500}
              value={details.reason}
              onChange={set('reason')}
            />
            <TextField
              id="field-email"
              label={t('form.email')}
              type="email"
              optional
              autoComplete="email"
              value={details.email}
              onChange={set('email')}
              error={detailErrors.email}
            />
            <TextField
              id="field-clinicRef"
              label={t('form.patientId')}
              hint={t('form.patientIdHint')}
              optional
              maxLength={30}
              value={details.clinicRef}
              onChange={set('clinicRef')}
              error={detailErrors.clinicRef}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="ghost" icon="arrowLeft" onClick={() => goTo('when')}>
                {t('book.back')}
              </Button>
              <Button type="submit" size="lg" iconRight="arrowRight">
                {t('form.continue')}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <dl className="divide-y divide-line rounded-control border border-line">
              {[
                ['stethoscope', t('book.doctor'), t('meta.doctor'), null],
                ['calendar', t('book.day'), formatDay(when.date, language), 'when'],
                ['clock', t('book.time'), t(`form.${when.slot}`), 'when'],
                ['user', t('book.patient'), `${details.name} · ${details.age} · ${t(`form.${details.gender}`)}`, 'details'],
                ['phone', t('form.mobile'), `+91 ${patient.phone}`, null],
                ...(details.reason ? [['fileText', t('form.reason'), details.reason, 'details']] : []),
              ].map(([icon, label, value, editStep]) => (
                <div key={label} className="flex items-start gap-3.5 p-4">
                  <Icon name={icon} className="mt-0.5 shrink-0 text-primary-700" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-sm text-ink-muted">{label}</dt>
                    <dd className="font-semibold break-words">{value}</dd>
                  </div>
                  {editStep && (
                    <button
                      type="button"
                      onClick={() => goTo(editStep)}
                      className="min-h-11 shrink-0 px-2 font-semibold text-primary-700 underline underline-offset-4"
                    >
                      {t('book.edit')}
                      <span className="sr-only"> {label}</span>
                    </button>
                  )}
                </div>
              ))}
            </dl>

            <Alert tone="warning">{t('alerts.warning')}</Alert>
            {submit.error && <Alert tone="error">{submit.error}</Alert>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="ghost" icon="arrowLeft" onClick={() => goTo('details')}>
                {t('book.back')}
              </Button>
              <Button size="lg" icon="send" onClick={submitBooking} disabled={submit.busy}>
                {submit.busy ? t('common.loading') : t('book.submit')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Container>
  )
}
