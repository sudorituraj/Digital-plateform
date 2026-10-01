import { Link } from 'react-router-dom'
import { SERVICES } from '../../config/services'
import { useI18n } from '../../i18n/useI18n'
import { Icon } from '../ui/Icon'

/** "What brings you in?" — one tap starts a booking with the reason already filled in. */
export function ConcernChips() {
  const { t } = useI18n()
  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold text-ink-muted">{t('home.concernsTitle')}</p>
      <ul className="swipe-row -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {SERVICES.map((s) => (
          <li key={s.slug} className="shrink-0 snap-start">
            <Link
              to={`/book?service=${s.slug}`}
              className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-[0.95rem] font-medium text-ink ring-1 ring-line hover:bg-primary-50 hover:ring-primary-200"
            >
              <Icon name={s.icon} size={18} className="text-primary-700" />
              {t(`services.items.${s.key}.title`)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
