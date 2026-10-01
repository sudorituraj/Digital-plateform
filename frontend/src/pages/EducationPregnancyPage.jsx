import { PageHeader } from '../components/site/PageHeader'
import { Button, Card, Icon, Reveal, Section } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

const TRIMESTERS = [
  { key: 'firstTrimester', icon: 'baby', color: 'bg-green-100 text-green-700' },
  { key: 'secondTrimester', icon: 'heart', color: 'bg-pink-100 text-pink-700' },
  { key: 'thirdTrimester', icon: 'calendar', color: 'bg-orange-100 text-orange-700' },
]

const WARNINGS = [
  { icon: 'alert', key: 'bleeding' },
  { icon: 'alertCircle', key: 'severeHeadache' },
  { icon: 'alertCircle', key: 'abdominalPain' },
  { icon: 'alertCircle', key: 'reducedMovement' },
  { icon: 'alertCircle', key: 'fever' },
]

const PRENATAL_BENEFITS = [
  { icon: 'checkCircle', key: 'care1' },
  { icon: 'checkCircle', key: 'care2' },
  { icon: 'checkCircle', key: 'care3' },
  { icon: 'checkCircle', key: 'care4' },
]

export default function PregnancyEducationPage() {
  const { t } = useI18n()
  usePageTitle('education.pregnancy')

  return (
    <>
      <PageHeader
        eyebrow={t('education.title')}
        title={t('education.pregnancy.title')}
        lead={t('education.pregnancy.description')}
      />

      <Section id="trimesters">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <h2 className="text-2xl">{t('education.pregnancy.firstTrimester').split(' ')[0]} {t('education.pregnancy.firstTrimester').split(' ')[1]}</h2>
        </div>
        <Reveal as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRIMESTERS.map((trimester, i) => (
            <Reveal key={trimester.key} as="li" delay={i * 100} className="p-5 rounded-card bg-surface border border-line hover:border-primary-300 hover:shadow-raised transition-all duration-300">
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${trimester.color} mb-3`}>
                <Icon name={trimester.icon} size={24} />
              </span>
              <h3 className="font-semibold text-ink mb-2">{t(`education.pregnancy.${trimester.key}`)}</h3>
              <p className="text-sm text-ink-muted">{t(`education.pregnancy.${trimester.key}Tips`)}</p>
            </Reveal>
          ))}
        </Reveal>
      </Section>

      <Section id="warning-signs" tone="tinted">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <h2 className="text-2xl">{t('education.pregnancy.warningSigns')}</h2>
        </div>
        <Reveal as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WARNINGS.map((warning, i) => (
            <Reveal key={warning.key} as="li" delay={i * 80} className="p-4 rounded-card bg-surface border border-danger-200">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-50 text-danger-700 mb-3">
                <Icon name={warning.icon} size={20} />
              </span>
              <p className="font-medium text-ink">{t(`education.pregnancy.${warning.key}`)}</p>
            </Reveal>
          ))}
        </Reveal>
      </Section>

      <Section id="prenatal-care">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <h2 className="text-2xl">{t('education.pregnancy.prenatalCare')}</h2>
        </div>
        <Reveal as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRENATAL_BENEFITS.map((benefit, i) => (
            <Reveal key={benefit.key} as="li" delay={i * 80} className="flex items-start gap-3 p-4 rounded-card bg-surface border border-line">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-50 text-success-700">
                <Icon name={benefit.icon} size={20} />
              </span>
              <p className="pt-1 text-sm text-ink-muted">{t(`education.pregnancy.${benefit.key}`)}</p>
            </Reveal>
          ))}
        </Reveal>
      </Section>

      <Section tone="surface" id="cta">
        <Card className="text-center max-w-2xl mx-auto p-8 sm:p-12">
          <p className="text-lg text-ink-muted mb-6">
            {t('education.pregnancy.prenatalCare')}
          </p>
          <Button to="/book" size="lg" icon="calendar">
            {t('common.bookAppointment')}
          </Button>
        </Card>
      </Section>
    </>
  )
}