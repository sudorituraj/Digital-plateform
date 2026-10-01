import { Link } from 'react-router-dom'
import { ClinicPhoto } from '../components/site/ClinicPhoto'
import { ConcernChips } from '../components/site/ConcernChips'
import { CtaBand } from '../components/site/CtaBand'
import { EducationPreview } from '../components/site/EducationPreview'
import { MapEmbed } from '../components/site/MapEmbed'
import { OpenStatus } from '../components/site/OpenStatus'
import { QuickActions } from '../components/site/QuickActions'
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
} from '../components/ui'
import { clinic, mapsLink, telLink } from '../config/clinic'
import { SERVICES } from '../config/services'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

function Hero() {
  const { t } = useI18n()
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-primary-100/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 -left-40 size-96 rounded-full bg-accent-100/40 blur-3xl" />
      <Container className="relative grid items-center gap-7 pt-4 pb-10 sm:pt-10 sm:pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
        {/* Photo first on phones (it is what people recognise), on the right on large screens. */}
        <div className="relative min-w-0 animate-rise lg:order-2">
          <ClinicPhoto priority>
            <OpenStatus tone="dark" />
          </ClinicPhoto>
        </div>

        <div className="min-w-0 lg:order-1">
          <p className="mb-3 hidden animate-rise items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-semibold text-primary-800 ring-1 ring-line [animation-delay:60ms] sm:inline-flex">
            <Icon name="mapPin" size={16} className="text-accent-500" />
            {t('home.eyebrow')}
          </p>
          <h1 className="animate-rise text-[2.35rem] leading-[1.1] [animation-delay:120ms] sm:text-5xl lg:text-6xl">{t('home.title')}</h1>
          <p className="mt-4 max-w-xl animate-rise text-lg text-ink-muted [animation-delay:180ms] sm:text-xl">{t('home.subtitle')}</p>

          <div className="mt-6 animate-rise [animation-delay:240ms]">
            <Link
              to="/book"
              className="press group relative flex min-h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary-700 px-6 text-lg font-semibold text-white shadow-raised hover:bg-primary-800 sm:w-auto sm:inline-flex"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <Icon name="calendar" size={22} />
              {t('common.bookAppointment')}
              <Icon name="arrowRight" size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
              <Icon name="clock" size={16} />
              {t('home.hoursLine')}
            </p>
          </div>

          <QuickActions showBook={false} className="mt-6 sm:max-w-md" />
          <div className="mt-7 animate-rise [animation-delay:560ms]">
            <ConcernChips />
          </div>
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
      {/* Phones: a vertical timeline. Larger screens: three cards. */}
      <ol className="relative grid gap-5 md:grid-cols-3">
        <span aria-hidden="true" className="absolute top-6 bottom-6 left-6 w-0.5 bg-gradient-to-b from-primary-600 via-primary-300 to-accent-300 md:hidden" />
        {steps.map(([icon, key], i) => (
          <Reveal as="li" key={key} delay={i * 120} className="relative">
            <div className="flex h-full gap-4 md:flex-col md:rounded-card md:bg-canvas md:p-6 md:ring-1 md:ring-line">
              <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-card ring-4 ring-surface md:ring-0">
                <Icon name={icon} size={22} />
                <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-accent-400 text-xs font-bold text-primary-950">
                  {i + 1}
                </span>
              </span>
              <div className="pt-1 md:pt-0">
                <h3 className="text-xl">{t(`home.steps.${key}Title`)}</h3>
                <p className="mt-1 text-ink-muted">{t(`home.steps.${key}Body`)}</p>
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
        <Reveal className="relative mx-auto hidden w-full md:block">
          <div aria-hidden="true" className="absolute -inset-3 -rotate-2 rounded-[1.75rem] bg-accent-100" />
          <ImagePlaceholder
            subject="Doctor portrait (approved photo of Dr. Neela Singh)"
            caption={t('doctor.photoCaption')}
            icon="user"
            ratio="aspect-[4/5]"
            className="relative"
          />
        </Reveal>
        <Reveal delay={100} className="min-w-0">
          <p className="mb-2 text-sm font-semibold tracking-wide text-accent-700 uppercase">{t('home.doctor.eyebrow')}</p>
          {/* Phones: compact identity row instead of a tall empty photo frame. */}
          <div className="mb-4 flex items-center gap-4 md:hidden">
            <span
              data-replace="Doctor portrait (approved photo of Dr. Neela Singh)"
              className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100 text-primary-700 ring-4 ring-surface shadow-card"
            >
              <Icon name="user" size={34} />
            </span>
            <span className="text-sm text-ink-muted">{t('common.photoPlaceholder')}</span>
          </div>
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
      {/* Phones: swipe sideways (cards peek in from the right). Larger screens: a grid. */}
      <ul className="swipe-row -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {SERVICES.map((service, i) => (
          <Reveal as="li" key={service.slug} delay={i * 70} className="w-[78%] shrink-0 snap-center sm:w-auto">
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
              <p className="font-medium">{t('contact.hoursValue')}</p>
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
