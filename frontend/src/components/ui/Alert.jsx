import { cn } from '../../lib/cn'
import { Icon } from './Icon'

const TONES = {
  success: { cls: 'bg-success-50 text-success-700 border-success-600/25', icon: 'checkCircle' },
  info: { cls: 'bg-info-50 text-info-700 border-info-600/25', icon: 'info' },
  warning: { cls: 'bg-warning-50 text-warning-700 border-warning-600/25', icon: 'alert' },
  error: { cls: 'bg-danger-50 text-danger-700 border-danger-600/25', icon: 'alertCircle' },
}

/** Inline message. Errors are announced immediately; others politely. */
export function Alert({ tone = 'info', title, children, className }) {
  const { cls, icon } = TONES[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control border px-4 py-3.5', cls, className)}
    >
      <Icon name={icon} size={22} className="mt-0.5 shrink-0" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-[0.95rem] text-ink">{children}</div>}
      </div>
    </div>
  )
}
