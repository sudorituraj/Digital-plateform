import { PageHeader } from '../components/site/PageHeader'
import { AvatarIllustration } from '../components/ui/AvatarIllustration'
import { Button, Card, Icon, Reveal, Section } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

const TIPS = [
  { icon: 'calendar', key: 'tip1' },
  { icon: 'pill', key: 'tip2' },
  { icon: 'baby', key: 'tip3' },
  { icon: 'stethoscope', key: 'tip4' },
  { icon: 'heart', key: 'tip5' },
]

const WARNINGS = [
  { icon: 'alert', key: 'heavyBleeding' },
  { icon: 'alertCircle', key: 'irregularCycles' },
  { icon: 'alertCircle', key: 'severePain' },
  { icon: 'alertCircle', key: 'missedPeriods' },
  { icon: 'alertCircle', key: 'spotting' },
]

export default function PeriodsEducationPage() {
  const { t } = useI18n()
  usePageTitle('education.periods')

  return (
    <>
      <PageHeader
        eyebrow={t('education.title')}
        title={t('education.periods.title')}
        lead={t('education.periods.description')}
      />

      <Section id="normal-cycle">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl">{t('education.periods.normalCycle')}</h2>
            <div className="mt-5 space-y-4 text-lg text-ink-muted">
              <p>{t('education.periods.normalCycle')}</p>
              <p>{t('education.periods.normalDuration')}</p>
            </div>
          </Reveal>
          <Reveal delay={100} className="relative mx-auto w-[calc(100%-1rem)] max-w-sm md:w-full md:max-w-none">
            <div aria-hidden="true" className="absolute -inset-3 -rotate-2 rounded-[1.75rem] bg-purple-100/50" />
            <AvatarIllustration name="teenGirl" size={200} className="relative" />
          </Reveal>
        </div>
      </Section>

      <Section id="when-to-see-doctor" tone="tinted">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <h2 className="text-2xl">{t('education.periods.whenToSeeDoctor')}</h2>
        </div>
        <Reveal as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WARNINGS.map((warning, i) => (
            <Reveal key={warning.key} as="li" delay={i * 80} className="p-4 rounded-card bg-surface border border-line">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-50 text-danger-700 mb-3">
                <Icon name={warning.icon} size={20} />
              </span>
              <p className="font-medium text-ink">{t(`education.periods.${warning.key}`)}</p>
            </Reveal>
          ))}
        </Reveal>
      </Section>

      <Section id="period-tips">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <h2 className="text-2xl">{t('common.learnMore')}</h2>
        </div>
        <Reveal as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((tip, i) => (
            <Reveal key={tip.key} as="li" delay={i * 80} className="p-5 rounded-card bg-surface border border-line hover:border-primary-300 hover:shadow-raised transition-all duration-300">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-700 mb-3">
                <Icon name={tip.icon} size={24} />
              </span>
              <p className="font-medium text-ink">{t(`education.periods.${tip.key}`)}</p>
            </Reveal>
          ))}
        </Reveal>
      </Section>

      <Section tone="surface" id="cta">
        <Card className="text-center max-w-2xl mx-auto p-8 sm:p-12">
          <p className="text-lg text-ink-muted mb-6">
            {t('education.periods.tip5')}
          </p>
          <Button to="/book" size="lg" icon="calendar">
            {t('common.bookAppointment')}
          </Button>
        </Card>
      </Section>
    </>
  )
}