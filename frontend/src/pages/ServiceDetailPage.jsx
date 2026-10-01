import { Link, useParams } from 'react-router-dom'
import { ContactActions } from '../components/site/ContactActions'
import { ServiceCard } from '../components/site/ServiceCard'
import { Card, Container, Icon, NeedsConfirmation, Reveal } from '../components/ui'
import { findService, SERVICES } from '../config/services'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'
import NotFoundPage from './NotFoundPage'

function ServiceDetail({ service }) {
  const { t } = useI18n()
  const base = `services.items.${service.key}`
  usePageTitle('services', { title: t(`${base}.title`) })
  const others = SERVICES.filter((s) => s.slug !== service.slug)

  return (
    <>
      <div className="relative overflow-hidden border-b border-line bg-primary-50/50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-accent-100/50 blur-3xl"
        />
        <Container className="relative py-10 sm:py-14">
          <Link
            to="/services"
            className="mb-5 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-700 hover:underline"
          >
            <Icon name="arrowLeft" size={18} />
            {t('services.backToServices')}
          </Link>
          <div className="flex animate-fade-up items-start gap-4">
            <span className="hidden size-16 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white sm:grid">
              <Icon name={service.icon} size={30} />
            </span>
            <div>
              <h1 className="text-3xl sm:text-5xl">{t(`${base}.title`)}</h1>
              {!service.verified && <NeedsConfirmation className="mt-3" />}
            </div>
          </div>
          <p className="mt-5 max-w-2xl animate-fade-up text-lg text-ink-muted [animation-delay:80ms] sm:text-xl">
            {t(`${base}.body`)}
          </p>
          <ContactActions bookTo={`/book?service=${service.slug}`} className="mt-7 animate-fade-up [animation-delay:160ms]" />
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <Reveal as={Card} padding="lg">
          <h2 className="text-2xl">{t('services.howTitle')}</h2>
          <ol className="mt-5 grid gap-5 md:grid-cols-3">
            {['how1', 'how2', 'how3'].map((key, i) => (
              <li key={key} className="flex gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-700 font-semibold text-white">
                  {i + 1}
                </span>
                <p className="pt-1">{t(`services.${key}`)}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <section aria-labelledby="other-services" className="mt-14">
          <h2 id="other-services" className="text-2xl sm:text-3xl">
            {t('services.otherTitle')}
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={i * 70}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </ul>
        </section>
      </Container>
    </>
  )
}

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const service = findService(slug)
  // key resets scroll-reveal state when moving between services.
  return service ? <ServiceDetail key={service.slug} service={service} /> : <NotFoundPage />
}
