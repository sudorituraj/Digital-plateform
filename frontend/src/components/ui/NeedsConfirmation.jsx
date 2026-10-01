import { env } from '../../config/env'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'

/**
 * Small marker placed next to any fact the clinic has not yet verified.
 * Hidden when VITE_SHOW_CONFIRMATION_MARKERS=false (e.g. for a clean client walkthrough).
 */
export function NeedsConfirmation({ className }) {
  const { t } = useI18n()
  if (!env.showConfirmationMarkers) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-dashed border-accent-500 bg-accent-50 px-1.5 py-px align-middle text-xs font-medium text-accent-700',
        className,
      )}
    >
      {t('common.needsConfirmation')}
    </span>
  )
}
