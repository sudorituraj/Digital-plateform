import { CtaBand } from '../components/site/CtaBand'
import { PageHeader } from '../components/site/PageHeader'
import { ServiceCard } from '../components/site/ServiceCard'
import { Button, Card, Container, Icon, Reveal } from '../components/ui'
import { telLink, whatsappLink } from '../config/clinic'
import { SERVICES } from '../config/services'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

export default function ServicesPage() {
  const { t } = useI18n()
  usePageTitle('services')

  return (
    <>
      <PageHeader eyebrow={t('services.eyebrow')} title={t('services.title')} lead={t('services.lead')} />
      <Container className="py-12 sm:py-16">
        <ul className="grid gap-5 sm:grid-cols-2">
          {SERVICES.map((service, i) => (
            <Reveal as="li" key={service.slug} delay={i * 70}>
              <ServiceCard service={service} headingLevel={2} />
            </Reveal>
          ))}
        </ul>

        <Reveal as={Card} tone="muted" className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <Icon name="info" size={24} className="mt-0.5 shrink-0 text-primary-700" />
            <div>
              <h2 className="font-sans text-lg font-semibold">{t('services.notListedTitle')}</h2>
              <p className="text-ink-muted">{t('services.notListedBody')}</p>
            </div>
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
