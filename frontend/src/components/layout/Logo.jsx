import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'

/** Clinic emblem + name. */
export function Logo({ tone = 'light', className }) {
  const { t } = useI18n()
  const dark = tone === 'dark'
  return (
    <Link to="/" className={cn('group flex min-h-11 items-center gap-3', className)} aria-label={t('common.clinicName')}>
      {/* The clinic's own emblem, cleaned up from the sign at the clinic (see public/images/clinic). */}
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:rotate-[-6deg] sm:size-12">
        <img src="/images/clinic/emblem-96.png" alt="" width="96" height="96" className="size-[86%]" />
      </span>
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
