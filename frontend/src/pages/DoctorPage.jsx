import { Link } from 'react-router-dom'
import { ContactActions } from '../components/site/ContactActions'
import { Fact } from '../components/site/Fact'
import { Card, Container, Icon, ImagePlaceholder, NeedsConfirmation, Reveal } from '../components/ui'
import { clinic } from '../config/clinic'
import { SERVICES } from '../config/services'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

/**
 * Screens 3 + 5 merged (DECISIONS.md D2): one profile page for Dr. Neela Singh.
 * Credentials come from config/clinic.js; while they are null the page says "To be confirmed".
 */

export default function DoctorPage() {
  const { t } = useI18n()
  usePageTitle('doctor')
  const d = clinic.doctor

  return (
    <>
      <div className="relative overflow-hidden border-b border-line bg-primary-50/50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-accent-100/50 blur-3xl"
        />
        <Container className="relative grid items-center gap-6 py-8 sm:py-14 md:grid-cols-[18rem_1fr] md:gap-8 lg:grid-cols-[22rem_1fr] lg:gap-14">
          {/* Phones: round avatar placeholder (the tall frame wastes a whole screen). */}
          <span
            data-replace="Doctor portrait (approved photo of Dr. Neela Singh)"
            className="grid size-24 animate-[pop_0.5s_var(--ease-gentle)_both] place-items-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100 text-primary-700 shadow-card ring-4 ring-surface md:hidden"
            role="img"
            aria-label={t('common.photoPlaceholder')}
          >
            <Icon name="user" size={40} />
          </span>
          <div className="relative mx-auto hidden w-full animate-fade-up md:block">
            <div aria-hidden="true" className="absolute -inset-2.5 rotate-2 rounded-[1.75rem] bg-accent-100" />
            <ImagePlaceholder
              subject="Doctor portrait (approved photo of Dr. Neela Singh)"
              caption={t('doctor.photoCaption')}
              icon="user"
              ratio="aspect-[4/5]"
              className="relative"
            />
          </div>
          <div>
            <p className="mb-2 animate-fade-up text-sm font-semibold tracking-wide text-accent-700 uppercase">
              {t('doctor.eyebrow')}
            </p>
            <h1 className="animate-fade-up text-4xl [animation-delay:60ms] sm:text-5xl">{t('meta.doctor')}</h1>
            <p className="mt-2 animate-fade-up text-lg font-medium text-primary-700 [animation-delay:100ms]">
              {t('doctor.role')}
            </p>
            <p className="mt-4 max-w-2xl animate-fade-up text-lg text-ink-muted [animation-delay:140ms]">
              {t('doctor.lead')}
            </p>
            <ContactActions className="mt-7 animate-fade-up [animation-delay:200ms]" />
          </div>
        </Container>
      </div>

      <Container className="grid gap-6 py-12 sm:py-16 lg:grid-cols-[1.3fr_1fr]">
        <Reveal as={Card} padding="lg">
          <h2 className="text-2xl">{t('doctor.profileTitle')}</h2>
          <dl className="mt-2 divide-y divide-line">
            <Fact icon="fileText" label={t('doctor.qualifications')} value={d.qualifications && t('doctor.qualificationsValue')} unverified />
            <Fact icon="stethoscope" label={t('doctor.specialization')} value={d.specialization && t('doctor.specializationValue')} unverified />
            <Fact icon="clock" label={t('doctor.experience')} value={d.experience} />
            <Fact icon="languages" label={t('doctor.languages')} value={d.languages?.join(', ')} />
          </dl>
        </Reveal>

        <div className="space-y-6">
          <Reveal as={Card} padding="lg" delay={80}>
            <h2 className="text-2xl">{t('doctor.availabilityTitle')}</h2>
            <dl className="mt-2 divide-y divide-line">
              <Fact icon="calendar" label={t('doctor.days')} value={t('contact.hoursValue')} />
              <Fact icon="info" label={t('doctor.fee')} value={d.consultationFee != null ? t('doctor.consultationFeeValue') : null} unverified />
            </dl>
          </Reveal>
          <Reveal as={Card} tone="brand" padding="lg" delay={140}>
            <h2 className="text-2xl text-white">{t('doctor.consultTitle')}</h2>
            <p className="mt-2 text-primary-100">{t('doctor.consultBody')}</p>
          </Reveal>
        </div>

        <Reveal as="section" aria-labelledby="areas-title" className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="areas-title" className="text-2xl">
              {t('doctor.areasTitle')}
            </h2>
            <NeedsConfirmation />
          </div>
          <ul className="mt-5 flex flex-wrap gap-3">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-line-strong bg-surface px-4 font-medium transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  <Icon name={s.icon} size={18} className="text-primary-700" />
                  {t(`services.items.${s.key}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </>
  )
}
