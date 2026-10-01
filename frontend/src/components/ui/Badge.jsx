import { APPOINTMENT_STATUSES } from '../../config/appointmentStatus'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'

const TONES = {
  neutral: 'bg-sunken text-ink-muted ring-line',
  primary: 'bg-primary-50 text-primary-800 ring-primary-200',
  accent: 'bg-accent-50 text-accent-700 ring-accent-200',
  success: 'bg-success-50 text-success-700 ring-success-600/25',
  warning: 'bg-warning-50 text-warning-700 ring-warning-600/25',
  danger: 'bg-danger-50 text-danger-700 ring-danger-600/25',
  info: 'bg-info-50 text-info-700 ring-info-600/25',
}

export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const { t } = useI18n()
  return (
    <Badge tone={APPOINTMENT_STATUSES[status] ?? 'neutral'} dot>
      {t(`status.${status}`)}
    </Badge>
  )
}
