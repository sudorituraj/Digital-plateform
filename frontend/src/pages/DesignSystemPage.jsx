import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  ChoiceChips,
  Container,
  ImagePlaceholder,
  NeedsConfirmation,
  PhoneField,
  Reveal,
  SelectField,
  StateMessage,
  StatusBadge,
  TextareaField,
  TextField,
} from '../components/ui'
import { APPOINTMENT_STATUSES } from '../config/appointmentStatus'
import { useI18n } from '../i18n/useI18n'

/*
 * INTERNAL reference page (/design-system) — only routed in demo mode.
 * Section headings are English because this page is for the team, not patients.
 * Component content uses real locale strings so every language can be checked here.
 */

const SWATCHES = [
  ['primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]],
  ['accent', [50, 100, 200, 300, 400, 500, 600, 700]],
]
const NEUTRALS = ['canvas', 'surface', 'sunken', 'line', 'line-strong', 'ink-subtle', 'ink-muted', 'ink']
const FEEDBACK = ['success-600', 'warning-600', 'danger-600', 'info-600', 'whatsapp']

function Block({ title, children }) {
  return (
    <Reveal as="section" className="border-t border-line py-10">
      <h2 className="mb-6 font-sans text-sm font-semibold tracking-wide text-ink-muted uppercase">{title}</h2>
      {children}
    </Reveal>
  )
}

function Swatch({ token }) {
  return (
    <div className="text-xs">
      <div className="h-12 rounded-lg ring-1 ring-black/5 ring-inset" style={{ background: `var(--color-${token})` }} />
      <p className="mt-1 font-mono text-ink-muted">{token}</p>
    </div>
  )
}

export default function DesignSystemPage() {
  const { t } = useI18n()
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('female')
  const [time, setTime] = useState('morning')
  const [submitted, setSubmitted] = useState(false)
  const phoneError = submitted && phone.length !== 10 ? t('form.errors.mobile') : undefined

  return (
    <Container className="py-12">
      <h1 className="text-4xl">Design system</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Tokens and reusable components for the Saran Nursing Home platform. Switch language at the top to check
        every component in English, Hindi, Bhojpuri and Hinglish.
      </p>

      <Block title="Colour tokens">
        <div className="space-y-6">
          {SWATCHES.map(([name, steps]) => (
            <div key={name} className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
              {steps.map((s) => (
                <Swatch key={s} token={`${name}-${s}`} />
              ))}
            </div>
          ))}
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {NEUTRALS.map((n) => (
              <Swatch key={n} token={n} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {FEEDBACK.map((n) => (
              <Swatch key={n} token={n} />
            ))}
          </div>
        </div>
      </Block>

      <Block title="Typography">
        <div className="space-y-4">
          <p className="text-5xl font-display font-bold">{t('home.title')}</p>
          <p className="text-3xl font-display font-bold">{t('meta.beforeVisit')}</p>
          <p className="text-xl font-display font-semibold">{t('comingSoon.title')}</p>
          <p className="max-w-2xl text-lg">{t('home.subtitle')}</p>
          <p className="text-ink-muted">{t('comingSoon.body')}</p>
          <p className="text-sm text-ink-muted">{t('form.mobileHint')}</p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon="calendar">{t('common.bookAppointment')}</Button>
          <Button variant="secondary" icon="phone">
            {t('common.call')}
          </Button>
          <Button variant="whatsapp" icon="whatsapp">
            {t('common.whatsapp')}
          </Button>
          <Button variant="accent" iconRight="arrowRight">
            {t('common.learnMore')}
          </Button>
          <Button variant="ghost" icon="mapPin">
            {t('common.getDirections')}
          </Button>
          <Button disabled>{t('form.continue')}</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="mt-4 rounded-card bg-primary-800 p-5">
          <Button variant="inverse" icon="calendar">
            {t('common.bookAppointment')}
          </Button>
        </div>
      </Block>

      <Block title="Badges & appointment status">
        <div className="flex flex-wrap gap-2.5">
          {Object.keys(APPOINTMENT_STATUSES).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Badge>Neutral</Badge>
          <Badge tone="primary">Primary</Badge>
          <Badge tone="accent">Accent</Badge>
          <NeedsConfirmation />
        </div>
      </Block>

      <Block title="Alerts">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert tone="success" title={t('alerts.success')} />
          <Alert tone="info">{t('alerts.info')}</Alert>
          <Alert tone="warning">{t('alerts.warning')}</Alert>
          <Alert tone="error">{t('alerts.error')}</Alert>
        </div>
      </Block>

      <Block title="Forms">
        <Card padding="lg" className="max-w-xl">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitted(true)
            }}
            className="space-y-5"
          >
            <TextField label={t('form.fullName')} placeholder={t('form.fullNamePlaceholder')} autoComplete="name" />
            <PhoneField label={t('form.mobile')} hint={t('form.mobileHint')} value={phone} onChange={setPhone} error={phoneError} />
            <div className="grid grid-cols-[7rem_1fr] gap-4">
              <TextField label={t('form.age')} type="number" inputMode="numeric" min={0} max={120} />
              <SelectField
                label={t('form.gender')}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={['female', 'male', 'other'].map((v) => ({ value: v, label: t(`form.${v}`) }))}
              />
            </div>
            <ChoiceChips
              legend={t('form.preferredTime')}
              name="preferred-time"
              value={time}
              onChange={setTime}
              options={[
                { value: 'morning', label: t('form.morning') },
                { value: 'afternoon', label: t('form.afternoon') },
                { value: 'midday', label: t('form.midday') },
              ]}
            />
            <TextField label={t('form.email')} type="email" optional autoComplete="email" />
            <TextareaField label={t('form.reason')} placeholder={t('form.reasonPlaceholder')} optional />
            <Button type="submit" size="lg" fullWidth iconRight="arrowRight">
              {t('form.continue')}
            </Button>
          </form>
        </Card>
      </Block>

      <Block title="Cards & media">
        <div className="grid gap-5 md:grid-cols-3">
          {['stethoscope', 'heart', 'fileText'].map((icon, i) => (
            <Reveal key={icon} delay={i * 80}>
              <Card interactive className="h-full">
                <ImagePlaceholder subject="Service photo" ratio="aspect-[16/9]" className="mb-4" />
                <p className="font-display text-xl font-semibold">{t(`nav.${['doctor', 'services', 'beforeVisit'][i]}`)}</p>
                <p className="mt-1 text-ink-muted">{t('comingSoon.body')}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Block>

      <Block title="Loading, empty & error states">
        <div className="grid gap-5 md:grid-cols-3">
          <Card padding="none">
            <StateMessage kind="loading" title={t('common.loading')} />
          </Card>
          <Card padding="none">
            <StateMessage kind="empty" title={t('notFound.title')} body={t('notFound.body')} />
          </Card>
          <Card padding="none">
            <StateMessage kind="error" title={t('alerts.error')} action={<Button variant="secondary" size="sm">{t('common.tryAgain')}</Button>} />
          </Card>
        </div>
      </Block>
    </Container>
  )
}
