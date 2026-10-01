import { Link } from 'react-router-dom'
import { ContactActions } from '../components/site/ContactActions'
import { CtaBand } from '../components/site/CtaBand'
import { EducationPreview } from '../components/site/EducationPreview'
import { MapEmbed } from '../components/site/MapEmbed'
import { ServiceCard } from '../components/site/ServiceCard'
import { AppointmentStatusCard } from '../components/booking/AppointmentStatusCard'
import {
  Button,
  Card,
  Container,
  Icon,
  ImagePlaceholder,
  NeedsConfirmation,
  Reveal,
  Section,
  StatusBadge,
} from '../components/ui'
import { clinic, mapsLink, telLink } from '../config/clinic'
import { SERVICES } from '../config/services'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

function Hero() {
  const { t } = useI18n()
  const trust = [
    ['stethoscope', t('home.trust.doctor')],
    ['mapPin', t('home.trust.local')],
    ['calendar', t('home.trust.easy')],
  ]
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-primary-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -left-40 size-96 rounded-full bg-accent-100/40 blur-3xl"
      />
      <Container className="relative grid items-center gap-12 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <p className="mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-semibold text-primary-800 ring-1 ring-line">
            <Icon name="mapPin" size={16} className="text-accent-500" />
            {t('home.eyebrow')}
          </p>
          <h1 className="animate-fade-up text-4xl [animation-delay:80ms] sm:text-5xl lg:text-6xl">{t('home.title')}</h1>
          <p className="mt-5 max-w-xl animate-fade-up text-lg text-ink-muted [animation-delay:160ms] sm:text-xl">
            {t('home.subtitle')}
          </p>
          <ContactActions className="mt-8 animate-fade-up [animation-delay:240ms]" />
          <ul className="mt-8 grid animate-fade-up gap-3 [animation-delay:320ms] sm:grid-cols-3 sm:gap-4">
            {trust.map(([icon, text]) => (
              <li key={icon} className="flex items-center gap-2.5 text-[0.95rem] font-medium text-ink-muted">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">
                  <Icon name={icon} size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual: clinic photo placeholder + a sample appointment card to show how booking looks. */}
        <div className="relative animate-fade-up pb-36 [animation-delay:200ms] sm:pb-24 lg:pb-8">
          <ImagePlaceholder
            subject="Hero: clinic exterior or reception"
            caption={t('about.gallery.exterior')}
            icon="building"
            ratio="aspect-[4/3.4]"
            className="shadow-card"
          />
          <Card
            as="figure"
            padding="sm"
            aria-label={`${t('common.example')}: ${t('home.preview.title')}`}
            className="absolute right-3 -bottom-4 w-[min(19rem,88%)] shadow-raised sm:-right-4 lg:-bottom-12 lg:-left-10 lg:right-auto"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{t('home.preview.title')}</p>
              <span className="rounded-md bg-sunken px-1.5 py-0.5 text-xs font-medium text-ink-muted">
                {t('common.example')}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-ink-muted">{t('home.preview.patient')}</dt>
                <dd className="font-medium">{t('home.preview.patientName')}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t('home.preview.when')}</dt>
                <dd className="font-medium">{t('home.preview.whenValue')}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusBadge status="requestSubmitted" />
              <Icon name="arrowRight" size={16} className="text-ink-subtle" />
              <StatusBadge status="confirmed" />
            </div>
            <p className="mt-2.5 text-sm text-ink-muted">{t('home.preview.note')}</p>
          </Card>
        </div>
      </Container>
    </section>
  )
}

function Steps() {
  const { t } = useI18n()
  const steps = [
    ['send', 's1'],
    ['checkCircle', 's2'],
    ['building', 's3'],
  ]
  return (
    <Section eyebrow={t('home.steps.eyebrow')} title={t('home.steps.title')} tone="surface" id="how-it-works">
      <ol className="grid gap-5 md:grid-cols-3">
        {steps.map(([icon, key], i) => (
          <Reveal as="li" key={key} delay={i * 90} className="relative">
            <div className="flex h-full gap-4 rounded-card bg-canvas p-5 ring-1 ring-line sm:p-6 md:flex-col">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white">
                  <Icon name={icon} size={22} />
                </span>
                <span className="hidden text-sm font-semibold text-accent-700 md:inline">
                  {t('common.stepLabel', { n: i + 1 })}
                </span>
              </div>
              <div>
                <h3 className="text-xl">{t(`home.steps.${key}Title`)}</h3>
                <p className="mt-1.5 text-ink-muted">{t(`home.steps.${key}Body`)}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}

function DoctorHighlight() {
  const { t } = useI18n()
  return (
    <Section id="doctor-highlight">
      <div className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal className="relative mx-auto w-[calc(100%-1rem)] max-w-sm md:w-full md:max-w-none">
          <div aria-hidden="true" className="absolute -inset-3 -rotate-2 rounded-[1.75rem] bg-accent-100" />
          <ImagePlaceholder
            subject="Doctor portrait (approved photo of Dr. Neela Singh)"
            caption={t('doctor.photoCaption')}
            icon="user"
            ratio="aspect-[4/5]"
            className="relative"
          />
        </Reveal>
        <Reveal delay={100}>
          <p className="mb-2 text-sm font-semibold tracking-wide text-accent-700 uppercase">{t('home.doctor.eyebrow')}</p>
          <h2 id="doctor-highlight-title" className="text-3xl sm:text-4xl">
            {t('home.doctor.title')}
          </h2>
          <p className="mt-2 font-medium text-primary-700">{t('doctor.role')}</p>
          <p className="mt-4 text-lg text-ink-muted">{t('home.doctor.body')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/book" size="lg" icon="calendar">
              {t('common.bookAppointment')}
            </Button>
            <Button to="/doctor" size="lg" variant="secondary" iconRight="arrowRight">
              {t('common.viewProfile')}
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

function ServicesPreview() {
  const { t } = useI18n()
  return (
    <Section
      eyebrow={t('home.services.eyebrow')}
      title={t('home.services.title')}
      description={t('home.services.body')}
      tone="tinted"
      id="services-preview"
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((service, i) => (
          <Reveal as="li" key={service.slug} delay={i * 70}>
            <ServiceCard service={service} />
          </Reveal>
        ))}
      </ul>
      <div className="mt-8">
        <Button to="/services" variant="ghost" iconRight="arrowRight">
          {t('common.viewAllServices')}
        </Button>
      </div>
    </Section>
  )
}

function VisitChecklist() {
  const { t } = useI18n()
  const items = [
    ['fileText', 'bring1'],
    ['pill', 'bring2'],
    ['clipboard', 'bring3'],
  ]
  return (
    <Section id="before-visit-preview">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <Reveal>
          <p className="mb-2 text-sm font-semibold tracking-wide text-accent-700 uppercase">{t('home.visit.eyebrow')}</p>
          <h2 className="text-3xl sm:text-4xl">{t('home.visit.title')}</h2>
          <p className="mt-3 text-lg text-ink-muted">{t('home.visit.body')}</p>
          <Button to="/before-your-visit" variant="secondary" iconRight="arrowRight" className="mt-6">
            {t('home.visit.cta')}
          </Button>
        </Reveal>
        <Reveal as="ul" delay={100} className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
          {items.map(([icon, key]) => (
            <li key={key} className="flex items-start gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-50 text-accent-700">
                <Icon name={icon} size={20} />
              </span>
              <span className="pt-1.5 font-medium">{t(`beforeVisit.${key}`)}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </Section>
  )
}

function LocationPreview() {
  const { t } = useI18n()
  return (
    <Section
      eyebrow={t('home.location.eyebrow')}
      title={t('home.location.title')}
      description={t('home.location.body')}
      tone="surface"
      id="location"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Reveal as={Card} className="flex flex-col gap-5">
          <div className="flex gap-3.5">
            <Icon name="mapPin" size={22} className="mt-0.5 shrink-0 text-primary-700" />
            <div>
              <p className="text-sm font-semibold text-ink-muted">{t('contact.address')}</p>
              <p className="font-medium">{clinic.addressLines.join(', ')}</p>
              <NeedsConfirmation className="mt-1" />
            </div>
          </div>
          <div className="flex gap-3.5">
            <Icon name="clock" size={22} className="mt-0.5 shrink-0 text-primary-700" />
            <div>
              <p className="text-sm font-semibold text-ink-muted">{t('contact.hours')}</p>
              <p className="text-ink-muted italic">{t('common.toBeConfirmed')}</p>
              <NeedsConfirmation className="mt-1" />
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button href={mapsLink()} icon="mapPin">
              {t('common.getDirections')}
            </Button>
            <Button href={telLink()} variant="secondary" icon="phone">
              {t('common.callClinic')}
            </Button>
          </div>
          <Link to="/contact" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-700 hover:underline">
            {t('meta.contact')}
            <Icon name="arrowRight" size={18} />
          </Link>
        </Reveal>
        <Reveal delay={100}>
          <MapEmbed className="h-72 sm:h-full sm:min-h-80" />
        </Reveal>
      </div>
    </Section>
  )
}

export default function HomePage() {
  usePageTitle('home')
  return (
    <>
      <Hero />
      <AppointmentStatusCard />
      <Steps />
      <DoctorHighlight />
      <ServicesPreview />
      {clinic.features.healthEducation && <EducationPreview />}
      <VisitChecklist />
      <LocationPreview />
      <CtaBand />
    </>
  )
}
