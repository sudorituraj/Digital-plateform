import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { cardBrand, digits, expiryValid, formatCardNumber, formatExpiry, formatRupees, luhnValid } from '../../lib/card'
import { cn } from '../../lib/cn'
import { Alert, Button, Icon, SelectField, TextField } from '../ui'

const METHODS = [
  ['upi', 'smartphone'],
  ['card', 'card'],
  ['netbanking', 'bank'],
]
const BANKS = ['sbi', 'pnb', 'bob', 'hdfc', 'icici', 'axis', 'other']
const BRAND_LABEL = { visa: 'VISA', mastercard: 'Mastercard', rupay: 'RuPay', amex: 'AMEX' }

/**
 * DEMO checkout for one appointment: UPI, card or net banking. No real gateway — the server simulates it.
 * Card numbers never leave the browser; only the brand and last 4 digits are sent.
 */
export function PaymentPanel({ appointment, onPaid, onLater, className }) {
  const { t, language } = useI18n()
  const [method, setMethod] = useState('upi')
  const [form, setForm] = useState({ upi: '', number: '', expiry: '', cvv: '', name: '', bank: '' })
  const [errors, setErrors] = useState({})
  const [state, setState] = useState({ busy: false, error: null })
  const amount = formatRupees(appointment.payment.amount, language)
  const brand = cardBrand(form.number)

  const set = (field, format = (v) => v) => (e) => setForm((f) => ({ ...f, [field]: format(e.target.value) }))

  const validate = () => {
    const e = {}
    if (method === 'upi' && !/^[A-Za-z0-9._-]{2,40}@[A-Za-z]{2,20}$/.test(form.upi.trim())) e.upi = t('pay.errors.upi')
    if (method === 'card') {
      if (!luhnValid(form.number)) e.number = t('pay.errors.cardNumber')
      if (!expiryValid(form.expiry)) e.expiry = t('pay.errors.expiry')
      if (!/^\d{3,4}$/.test(form.cvv)) e.cvv = t('pay.errors.cvv')
      if (form.name.trim().length < 2) e.name = t('form.errors.required')
    }
    if (method === 'netbanking' && !form.bank) e.bank = t('form.errors.choose')
    return e
  }

  const pay = async (e) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`pay-${Object.keys(found)[0]}`)?.focus()
      return
    }
    const body =
      method === 'upi'
        ? { method, upi_id: form.upi.trim() }
        : method === 'card'
          ? { method, card_brand: brand ?? 'other', card_last4: digits(form.number).slice(-4) }
          : { method, bank: form.bank }
    setState({ busy: true, error: null })
    // A short pause so the "processing" step is visible, like a real checkout.
    const [result] = await Promise.allSettled([
      api.post(`/appointments/${appointment.request_id}/pay`, body),
      new Promise((r) => setTimeout(r, 1400)),
    ])
    if (result.status === 'fulfilled') {
      onPaid(result.value)
    } else {
      setState({ busy: false, error: errorMessage(t, result.reason) })
    }
  }

  return (
    <form onSubmit={pay} noValidate className={cn('relative space-y-6', className)}>
      <div className="flex items-end justify-between gap-4 rounded-control bg-gradient-to-br from-primary-700 to-primary-900 p-5 text-white shadow-raised">
        <div>
          <p className="text-sm text-primary-100">{t('pay.feeLabel')}</p>
          <p className="font-display text-4xl font-bold tracking-tight">{amount}</p>
          <p className="mt-1 text-sm text-primary-100">
            {t('appointment.requestId')}: <span className="font-mono">{appointment.request_id}</span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Icon name="lock" size={14} />
          {t('pay.secure')}
        </span>
      </div>

      <Alert tone="warning" title={t('pay.demoTitle')}>
        {t('pay.demoBody')}
      </Alert>

      <fieldset>
        <legend className="mb-2 font-semibold">{t('pay.chooseMethod')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(([id, icon]) => (
            <label
              key={id}
              className={cn(
                'press flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-control border px-1 text-center text-sm leading-tight font-semibold transition-colors',
                'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-400',
                method === id
                  ? 'animate-[pop_0.3s_var(--ease-gentle)] border-primary-600 bg-primary-50 text-primary-800 ring-1 ring-primary-600'
                  : 'border-line-strong bg-surface text-ink hover:border-primary-300',
              )}
            >
              <input
                type="radio"
                name="pay-method"
                value={id}
                checked={method === id}
                onChange={() => {
                  setMethod(id)
                  setErrors({})
                  setState({ busy: false, error: null })
                }}
                className="sr-only"
              />
              <Icon name={icon} size={24} />
              {t(`pay.methods.${id}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div key={method} className="animate-fade-in space-y-5">
        {method === 'upi' && (
          <TextField
            id="pay-upi"
            label={t('pay.upiId')}
            placeholder="name@okaxis"
            hint={t('pay.upiHint')}
            autoComplete="off"
            autoCapitalize="none"
            inputMode="email"
            value={form.upi}
            onChange={set('upi')}
            error={errors.upi}
          />
        )}
        {method === 'card' && (
          <>
            <div className="relative">
              <TextField
                id="pay-number"
                label={t('pay.cardNumber')}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                autoComplete="cc-number"
                value={form.number}
                onChange={set('number', formatCardNumber)}
                error={errors.number}
              />
              {BRAND_LABEL[brand] && (
                <span className="absolute top-10 right-3 animate-fade-in rounded bg-primary-900 px-2 py-1 text-xs font-bold tracking-wide text-white">
                  {BRAND_LABEL[brand]}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="pay-expiry"
                label={t('pay.expiry')}
                placeholder={t('pay.expiryPlaceholder')}
                inputMode="numeric"
                autoComplete="cc-exp"
                value={form.expiry}
                onChange={set('expiry', formatExpiry)}
                error={errors.expiry}
              />
              <TextField
                id="pay-cvv"
                label={t('pay.cvv')}
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                value={form.cvv}
                onChange={set('cvv', (v) => digits(v).slice(0, 4))}
                error={errors.cvv}
              />
            </div>
            <TextField
              id="pay-name"
              label={t('pay.nameOnCard')}
              autoComplete="cc-name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
            />
          </>
        )}
        {method === 'netbanking' && (
          <SelectField
            id="pay-bank"
            label={t('pay.bank')}
            value={form.bank}
            onChange={set('bank')}
            error={errors.bank}
            options={[{ value: '', label: t('pay.chooseBank') }, ...BANKS.map((b) => ({ value: b, label: t(`pay.banks.${b}`) }))]}
          />
        )}
      </div>

      <details className="rounded-control bg-sunken/70 px-4 py-3 text-sm text-ink-muted">
        <summary className="min-h-8 cursor-pointer font-semibold text-ink">{t('pay.testTitle')}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t('pay.testCard')}</li>
          <li>{t('pay.testDeclined')}</li>
          <li>{t('pay.testUpiFail')}</li>
        </ul>
      </details>

      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" fullWidth icon="lock" disabled={state.busy}>
          {t('pay.payAmount', { amount })}
        </Button>
        {onLater && (
          <Button variant="ghost" fullWidth onClick={onLater} disabled={state.busy}>
            {t('pay.later')}
          </Button>
        )}
      </div>

      {state.busy && (
        <div
          role="status"
          className="absolute -inset-2 z-10 grid animate-fade-in place-items-center rounded-card bg-surface/92 backdrop-blur-sm"
        >
          <div className="text-center">
            <span className="relative mx-auto grid size-20 place-items-center">
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600 motion-reduce:animate-none" />
              <Icon name="lock" size={28} className="text-primary-700" />
            </span>
            <p className="mt-4 font-display text-xl font-bold">{t('pay.processing')}</p>
            <p className="mt-1 text-sm text-ink-muted">{t('pay.doNotClose')}</p>
          </div>
        </div>
      )}
    </form>
  )
}
