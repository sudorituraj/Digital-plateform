import { MapEmbed } from '../components/site/MapEmbed'
import { PageHeader } from '../components/site/PageHeader'
import { Button, Card, Container, Icon, NeedsConfirmation, Reveal } from '../components/ui'
import { clinic, mapsLink, telLink, whatsappLink } from '../config/clinic'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-sans text-sm font-semibold text-ink-muted">{label}</h2>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  const { t } = useI18n()
  usePageTitle('contact')

  return (
    <>
      <PageHeader eyebrow={t('contact.eyebrow')} title={t('contact.title')} lead={t('contact.lead')} />
      <Container className="grid gap-6 py-12 sm:py-16 lg:grid-cols-[1fr_1.35fr]">
        <Reveal as={Card} padding="lg" className="divide-y divide-line">
          <InfoRow icon="mapPin" label={t('contact.address')}>
            <address className="text-lg font-medium not-italic">
              {t('common.clinicName')}
              <span key="line1" className="block font-normal text-ink-muted">
                {t('contact.addressLine1')}
              </span>
              <span key="line2" className="block font-normal text-ink-muted">
                {t('contact.addressLine2')}
              </span>
              <span key="line3" className="block font-normal text-ink-muted">
                {t('contact.addressLine3')}
              </span>
            </address>
            <div className="mt-1.5">
              <NeedsConfirmation />
            </div>
            <Button href={mapsLink()} size="sm" icon="mapPin" className="mt-3">
              {t('common.getDirections')}
            </Button>
          </InfoRow>

          <InfoRow icon="building" label={t('contact.landmark')}>
            {clinic.landmark ? (
              <>
                {t('contact.landmarkFull')}
                <NeedsConfirmation className="ml-2" />
              </>
            ) : (
              <span className="text-ink-muted italic">{t('common.toBeConfirmed')}</span>
            )}
          </InfoRow>

          <InfoRow icon="phone" label={t('contact.phone')}>
            <a href={telLink()} className="inline-flex min-h-11 items-center text-lg font-semibold text-primary-800 hover:underline">
              {clinic.phoneDisplay}
            </a>
            <NeedsConfirmation className="ml-2" />
          </InfoRow>

          <InfoRow icon="whatsapp" label={t('contact.whatsapp')}>
            <Button
              href={whatsappLink(t('common.whatsappMessage'))}
              variant="whatsapp"
              size="sm"
              icon="whatsapp"
              className="mt-1"
            >
              {t('contact.whatsappBody')}
            </Button>
          </InfoRow>

          <InfoRow icon="clock" label={t('contact.hours')}>
            <span className="text-ink-muted italic">{t('common.toBeConfirmed')}</span>
            <NeedsConfirmation className="ml-2" />
          </InfoRow>
        </Reveal>

        <Reveal delay={100} className="flex flex-col gap-4">
          <MapEmbed className="h-80 sm:h-[28rem] lg:h-full lg:min-h-[32rem]" />
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            <Button href={telLink()} variant="secondary" icon="phone">
              {t('common.call')}
            </Button>
            <Button href={whatsappLink(t('common.whatsappMessage'))} variant="whatsapp" icon="whatsapp">
              {t('common.whatsapp')}
            </Button>
          </div>
        </Reveal>
      </Container>
    </>
  )
}
