import { CtaBand } from '../components/site/CtaBand'
import { PageHeader } from '../components/site/PageHeader'
import { Button, Card, Container, Icon, NeedsConfirmation, Reveal } from '../components/ui'
import { telLink, whatsappLink } from '../config/clinic'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

// Draft guidance taken from the scope (§6 Screen 9). Must be approved by the clinic before launch.
const LISTS = [
  { title: 'bringTitle', icon: 'clipboard', items: [['fileText', 'bring1'], ['pill', 'bring2'], ['calendar', 'bring3']] },
  { title: 'dayTitle', icon: 'clock', items: [['clock', 'day1'], ['user', 'day2'], ['phone', 'day3']] },
]

export default function BeforeVisitPage() {
  const { t } = useI18n()
  usePageTitle('beforeVisit')

  return (
    <>
      <PageHeader eyebrow={t('beforeVisit.eyebrow')} title={t('beforeVisit.title')} lead={t('beforeVisit.lead')}>
        <NeedsConfirmation />
      </PageHeader>

      <Container className="grid gap-6 py-12 sm:py-16 lg:grid-cols-2">
        {LISTS.map((list, i) => (
          <Reveal as={Card} padding="lg" key={list.title} delay={i * 100}>
            <h2 className="flex items-center gap-3 text-2xl">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary-700 text-white">
                <Icon name={list.icon} size={22} />
              </span>
              {t(`beforeVisit.${list.title}`)}
            </h2>
            <ul className="mt-6 space-y-4">
              {list.items.map(([icon, key]) => (
                <li key={key} className="flex items-start gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-50 text-accent-700">
                    <Icon name={icon} size={18} />
                  </span>
                  <span className="pt-1 text-[1.0625rem]">{t(`beforeVisit.${key}`)}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}

        <Reveal
          as={Card}
          tone="muted"
          padding="lg"
          delay={150}
          className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-2"
        >
          <div>
            <h2 className="text-2xl">{t('beforeVisit.questionsTitle')}</h2>
            <p className="mt-1 text-ink-muted">{t('beforeVisit.questionsBody')}</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <Button href={telLink()} variant="secondary" icon="phone">
              {t('common.call')}
            </Button>
            <Button href={whatsappLink(t('common.whatsappMessage'))} variant="whatsapp" icon="whatsapp">
              {t('common.whatsapp')}
            </Button>
          </div>
        </Reveal>
      </Container>
      <CtaBand />
    </>
  )
}
