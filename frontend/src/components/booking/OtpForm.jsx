import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, PhoneField, SelectField, TextareaField } from '../ui/Form'

const VALID_PHONE = /^[6-9]\d{9}$/

const GENDER_OPTIONS = [
  { value: 'female', label: 'form.female' },
  { value: 'male', label: 'form.male' },
  { value: 'other', label: 'form.other' },
]

/**
 * Mobile number → OTP → logged in. Calls onSuccess(patient) at the end.
 * In demo mode the API returns the code and we show it on screen (no SMS is sent).
 * For new patients, shows registration form after OTP verification.
 */
export function OtpForm({ onSuccess }) {
  const { t } = useI18n()
  const { setPatient } = useAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState('phone') // 'phone' | 'code' | 'register'
  const [demoCode, setDemoCode] = useState(null)
  const [error, setError] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const codeRef = useRef(null)

  // Registration form state
  const [regData, setRegData] = useState({
    name: '',
    father_husband_name: '',
    email: '',
    gender: '',
    age: '',
    address: '',
  })
  const [regErrors, setRegErrors] = useState({})

  // Countdown for the "Send again" button.
  useEffect(() => {
    if (resendIn <= 0) return
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  useEffect(() => {
    if (stage === 'code') codeRef.current?.focus()
    if (stage === 'register') {
      // Focus first empty field
      setTimeout(() => {
        const firstEmpty = document.querySelector('[data-reg-field]:not([value=""])')
        firstEmpty?.focus()
      }, 100)
    }
  }, [stage])

  async function sendCode(e) {
    e?.preventDefault()
    setError(null)
    if (!VALID_PHONE.test(phone)) {
      setPhoneError(t('form.errors.mobile'))
      return
    }
    setPhoneError(null)
    setBusy(true)
    try {
      const res = await api.post('/auth/otp/request', { phone })
      setDemoCode(res.demo_code ?? null)
      setResendIn(res.resend_in)
      setCode('')
      setStage('code')
    } catch (err) {
      setError(errorMessage(t, err))
      if (err.retryAfter) setResendIn(err.retryAfter)
    } finally {
      setBusy(false)
    }
  }

  async function verify(e) {
    e?.preventDefault()
    if (code.length !== 6 || busy) return
    setError(null)
    setBusy(true)
    try {
      // Try existing patient verify first
      const patient = await api.post('/auth/otp/verify', { phone, code })
      setPatient(patient)
      onSuccess?.(patient)
    } catch (err) {
      // A correct code for a number we don't know yet → ask for the new patient's details.
      if (err.code === 'registration_required') {
        setStage('register')
      } else {
        setError(errorMessage(t, err))
        setCode('')
        if (err.code === 'otp_expired' || err.code === 'otp_too_many_attempts') setResendIn(0)
        codeRef.current?.focus()
      }
    } finally {
      setBusy(false)
    }
  }

  function validateRegistration() {
    const errors = {}
    if (!regData.name.trim()) errors.name = t('form.errors.required')
    if (!regData.gender) errors.gender = t('form.errors.choose')
    if (!regData.age) errors.age = t('form.errors.age')
    else if (regData.age < 0 || regData.age > 120) errors.age = t('form.errors.age')
    if (regData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regData.email)) {
      errors.email = t('form.errors.email')
    }
    setRegErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submitRegistration(e) {
    e?.preventDefault()
    if (!validateRegistration()) return
    setError(null)
    setBusy(true)
    try {
      const patient = await api.post('/auth/otp/verify/register', {
        phone,
        code,
        ...regData,
        age: parseInt(regData.age, 10),
      })
      setPatient(patient)
      onSuccess?.(patient)
    } catch (err) {
      setError(errorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  if (stage === 'phone') {
    return (
      <form onSubmit={sendCode} noValidate className="space-y-5">
        <PhoneField label={t('form.mobile')} hint={t('form.mobileHint')} value={phone} onChange={setPhone} error={phoneError} autoFocus />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" size="lg" fullWidth iconRight="arrowRight" disabled={busy}>
          {busy ? t('common.loading') : t('auth.sendCode')}
        </Button>
        <p className="text-center text-sm text-ink-muted">{t('auth.privacyNote')}</p>
      </form>
    )
  }

  if (stage === 'register') {
    return (
      <form onSubmit={submitRegistration} noValidate className="space-y-4">
        <p className="text-sm text-ink-muted">
          {t('auth.newPatientTitle')}
        </p>

        <Field label={t('form.fullName')} hint={t('form.fullNamePlaceholder')} error={regErrors.name}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              type="text"
              autoComplete="name"
              value={regData.name}
              onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              data-reg-field="name"
              className="block min-h-15 w-full rounded-control border border-line-strong bg-surface px-4 text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          )}
        </Field>

        <Field label={t('form.fatherHusbandName')} hint={t('form.fatherHusbandNameHint')} optional error={regErrors.father_husband_name}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              type="text"
              autoComplete="off"
              value={regData.father_husband_name}
              onChange={(e) => setRegData({ ...regData, father_husband_name: e.target.value })}
              data-reg-field="father_husband_name"
              className="block min-h-15 w-full rounded-control border border-line-strong bg-surface px-4 text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          )}
        </Field>

        <Field label={t('form.email')} hint={t('form.emailHint')} optional error={regErrors.email}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              type="email"
              autoComplete="email"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              data-reg-field="email"
              className="block min-h-15 w-full rounded-control border border-line-strong bg-surface px-4 text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          )}
        </Field>

        <SelectField
          label={t('form.gender')}
          hint={t('form.genderHint')}
          error={regErrors.gender}
          options={[
            { value: '', label: t('form.selectPlaceholder') },
            ...GENDER_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) })),
          ]}
          value={regData.gender}
          onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
        />

        <Field label={t('form.age')} hint={t('form.ageHint')} error={regErrors.age}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              autoComplete="off"
              value={regData.age}
              onChange={(e) => setRegData({ ...regData, age: e.target.value })}
              data-reg-field="age"
              className="block min-h-15 w-full rounded-control border border-line-strong bg-surface px-4 text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          )}
        </Field>

        <TextareaField
          label={t('form.address')}
          hint={t('form.addressHint')}
          optional
          rows={2}
          value={regData.address}
          onChange={(e) => setRegData({ ...regData, address: e.target.value })}
          data-reg-field="address"
        />

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" size="lg" fullWidth icon="checkCircle" disabled={busy}>
          {busy ? t('common.loading') : t('auth.register')}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          <button
            type="button"
            onClick={() => {
              setStage('phone')
              setError(null)
            }}
            className="min-h-11 font-semibold text-primary-700 underline underline-offset-4"
          >
            {t('auth.backToPhone')}
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={verify} noValidate className="space-y-5">
      <p className="text-ink-muted">
        {t('auth.codeSentTo')} <strong className="text-ink">+91 {phone.slice(0, 5)} {phone.slice(5)}</strong>{' '}
        <button
          type="button"
          onClick={() => {
            setStage('phone')
            setError(null)
          }}
          className="min-h-11 font-semibold text-primary-700 underline underline-offset-4"
        >
          {t('auth.changeNumber')}
        </button>
      </p>

      {demoCode && (
        <Alert tone="info" title={t('auth.demoTitle')}>
          {t('auth.demoBody')} <strong className="font-mono text-lg tracking-widest">{demoCode}</strong>
        </Alert>
      )}

      <Field label={t('auth.codeLabel')} hint={t('auth.codeHint')}>
        {({ id, describedBy, invalid }) => (
          <input
            ref={codeRef}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="block min-h-15 w-full rounded-control border border-line-strong bg-surface px-4 text-center font-mono text-2xl tracking-[0.5em] text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
        )}
      </Field>

      {error && <Alert tone="error">{error}</Alert>}

      <Button type="submit" size="lg" fullWidth icon="checkCircle" disabled={busy || code.length !== 6}>
        {busy ? t('common.loading') : t('auth.verify')}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        {resendIn > 0 ? (
          t('auth.resendIn', { seconds: resendIn })
        ) : (
          <button type="button" onClick={sendCode} disabled={busy} className="min-h-11 font-semibold text-primary-700 underline underline-offset-4">
            {t('auth.resend')}
          </button>
        )}
      </p>
    </form>
  )
}


/**
 * Password login form. Calls onSuccess(patient) on success.
 */
export function PasswordLoginForm({ onSuccess }) {
  const { t } = useI18n()
  const { setPatient } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e?.preventDefault()
    setError(null)
    setPhoneError(null)
    if (!VALID_PHONE.test(phone)) {
      setPhoneError(t('form.errors.mobile'))
      return
    }
    if (password.length < 6) {
      setError(t('form.errors.required'))
      return
    }
    setBusy(true)
    try {
      const res = await api.post('/auth/login/password', { phone, password })
      setPatient(res.patient)
      onSuccess?.(res.patient)
    } catch (err) {
      setError(errorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <PhoneField label={t('form.mobile')} hint={t('form.mobileHint')} value={phone} onChange={setPhone} error={phoneError} autoFocus />
      <Field label={t('form.password')} hint={t('form.passwordHint')}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block min-h-15 w-full rounded-control border border-line-strong bg-surface px-4 text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
        )}
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="lg" fullWidth icon="unlock" disabled={busy}>
        {busy ? t('common.loading') : t('auth.loginWithPassword')}
      </Button>
    </form>
  )
}