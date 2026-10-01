import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

/**
 * Stand-in for a real clinic photo. Clearly marked so it is replaced before launch.
 * `subject` is a short English note for the team (e.g. "Clinic exterior") and is
 * kept in data-replace for easy searching: document.querySelectorAll('[data-replace]')
 */
export function ImagePlaceholder({ subject, caption, icon = 'image', ratio = 'aspect-[4/3]', className }) {
  const { t } = useI18n()
  return (
    <div
      data-replace={subject}
      role="img"
      aria-label={caption ? `${caption} — ${t('common.photoPlaceholder')}` : t('common.photoPlaceholder')}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-card text-primary-700',
        'bg-[radial-gradient(circle_at_30%_20%,var(--color-primary-100),transparent_60%),radial-gradient(circle_at_80%_90%,var(--color-accent-100),transparent_55%)] bg-sunken',
        ratio,
        className,
      )}
    >
      <Icon name={icon} size={32} className="opacity-70" />
      {caption && <span className="px-4 text-center font-semibold text-primary-900">{caption}</span>}
      <span className="px-4 text-center text-sm font-medium text-ink-muted">{t('common.photoPlaceholder')}</span>
    </div>
  )
}
