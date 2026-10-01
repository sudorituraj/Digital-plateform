import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { statusKey } from '../../lib/format'
import { Icon } from '../ui/Icon'

// The normal path an appointment follows. "Waiting" is part of checked-in on this simple view.
const PATH = ['request_submitted', 'confirmed', 'checked_in', 'completed']

/** Where is my appointment? Simple 4-step progress. Cancelled shows a single clear state. */
export function StatusTimeline({ status }) {
  const { t } = useI18n()
  if (status === 'cancelled') {
    return (
      <p className="flex items-center gap-2 font-semibold text-danger-700">
        <Icon name="alertCircle" /> {t('status.cancelled')}
      </p>
    )
  }
  const current = PATH.indexOf(status === 'waiting' ? 'checked_in' : status)
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label={t('appointment.progressLabel')}>
      {PATH.map((step, i) => {
        const reached = i <= current
        return (
          <li key={step} className="flex flex-col items-center text-center" aria-current={i === current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', i === 0 ? 'invisible' : reached ? 'bg-primary-600' : 'bg-line')} />
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full',
                  reached ? 'bg-primary-700 text-white' : 'bg-sunken text-ink-subtle',
                  i === current && 'ring-4 ring-primary-100',
                )}
              >
                {reached ? <Icon name="check" size={16} /> : <span className="size-2 rounded-full bg-current" />}
              </span>
              <span className={cn('h-0.5 flex-1', i === PATH.length - 1 ? 'invisible' : i < current ? 'bg-primary-600' : 'bg-line')} />
            </div>
            <span className={cn('mt-2 text-xs leading-snug font-medium sm:text-sm', reached ? 'text-ink' : 'text-ink-muted')}>
              {t(`status.${statusKey(step)}`)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
