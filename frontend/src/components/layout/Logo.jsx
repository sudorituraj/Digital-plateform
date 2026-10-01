import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'

/** Temporary wordmark. Replace the mark with the clinic's own logo if they have one. */
export function Logo({ tone = 'light', className }) {
  const { t } = useI18n()
  const dark = tone === 'dark'
  return (
    <Link to="/" className={cn('group flex min-h-11 items-center gap-3', className)} aria-label={t('common.clinicName')}>
      <svg viewBox="0 0 64 64" className="size-10 shrink-0 sm:size-11" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={dark ? '#fbf8f4' : 'var(--color-primary-700)'} />
        <path
          d="M32 16v32M16 32h32"
          stroke={dark ? 'var(--color-primary-800)' : '#fbf8f4'}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="46" cy="18" r="5" fill="var(--color-accent-400)" />
      </svg>
      <span className="min-w-0 leading-tight">
        <span className={cn('block font-display text-base font-bold whitespace-nowrap sm:text-lg', dark ? 'text-white' : 'text-primary-900')}>
          {t('common.clinicShortName')}
        </span>
        <span className={cn('block text-[0.78rem] sm:text-sm', dark ? 'text-primary-200' : 'text-ink-muted')}>
          {t('common.clinicSubName')} · {t('common.location')}
        </span>
      </span>
    </Link>
  )
}
