import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { NeedsConfirmation } from '../ui/NeedsConfirmation'

/** Service summary card. The whole card is one link to the service detail page. */
export function ServiceCard({ service, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`
  const { t } = useI18n()
  const base = `services.items.${service.key}`
  return (
    <Card as="article" interactive className="group relative flex h-full flex-col">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700 transition-colors duration-300 group-hover:bg-primary-700 group-hover:text-white">
          <Icon name={service.icon} size={24} />
        </span>
        {!service.verified && <NeedsConfirmation className="relative z-10 text-right" />}
      </div>
      <Heading className="text-xl">
        <Link to={`/services/${service.slug}`} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-accent-400">
          {t(`${base}.title`)}
        </Link>
      </Heading>
      <p className="mt-2 flex-1 text-ink-muted">{t(`${base}.short`)}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary-700">
        {t('common.learnMore')}
        <Icon name="arrowRight" size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </Card>
  )
}
