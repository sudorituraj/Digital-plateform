import { CtaBand } from '../components/site/CtaBand'
import { EducationPreview } from '../components/site/EducationPreview'
import { PageHeader } from '../components/site/PageHeader'
import { Card, Icon, ImagePlaceholder, NeedsConfirmation, Reveal, Section } from '../components/ui'
import { clinic } from '../config/clinic'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

const HELP = [
  ['calendar', 'help1'],
  ['mapPin', 'help2'],
  ['languages', 'help3'],
]

// Photos to request from the clinic (scope §19). `subject` is kept in data-replace for the team.
const GALLERY = [
  ['exterior', 'building', 'Clinic exterior'],
  ['reception', 'user', 'Reception desk'],
  ['waiting', 'home', 'Waiting area'],
  ['consultation', 'stethoscope', 'Consultation room'],
]

export default function AboutPage() {
  const { t } = useI18n()
  usePageTitle('about')

  return (
    <>
      <PageHeader eyebrow={t('about.eyebrow')} title={t('about.title')} lead={t('about.lead')} />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl">{t('about.introTitle')}</h2>
            <div className="mt-5 space-y-4 text-lg text-ink-muted">
              <p>{t('about.intro1')}</p>
              <p>{t('about.intro2')}</p>
            </div>
          </Reveal>
          {/* History and facilities are shown only once the clinic confirms them. */}
          <Reveal delay={100} className="space-y-4">
            {['history', 'facilities'].map((key) => (
              <Card key={key} tone="muted" padding="sm" className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-primary-700">
                  <Icon name={key === 'history' ? 'clock' : 'building'} size={20} />
                </span>
                <div>
                  <h3 className="font-sans text-lg font-semibold">{t(`about.${key}`)}</h3>
                  <p className="text-ink-muted italic">{t('common.toBeConfirmed')}</p>
                  <NeedsConfirmation className="mt-1.5" />
                </div>
              </Card>
            ))}
          </Reveal>
        </div>
      </Section>

      <Section title={t('about.galleryTitle')} tone="surface" id="gallery">
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {GALLERY.map(([key, icon, subject], i) => (
            <Reveal as="li" key={key} delay={i * 70}>
              <ImagePlaceholder subject={subject} caption={t(`about.gallery.${key}`)} icon={icon} ratio="aspect-square" />
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section title={t('about.helpTitle')} id="help">
        <ul className="grid gap-5 md:grid-cols-3">
          {HELP.map(([icon, key], i) => (
            <Reveal as="li" key={key} delay={i * 80}>
              <Card className="h-full">
                <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary-50 text-primary-700">
                  <Icon name={icon} size={24} />
                </span>
                <h3 className="text-xl">{t(`about.${key}Title`)}</h3>
                <p className="mt-1.5 text-ink-muted">{t(`about.${key}Body`)}</p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Section>

      {clinic.features.healthEducation && <EducationPreview />}

      <CtaBand />
    </>
  )
}