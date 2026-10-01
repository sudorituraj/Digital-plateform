import { cn } from '../../lib/cn'
import { Icon } from './Icon'

/**
 * Full-width empty / error / loading message so a screen is never blank.
 *   <StateMessage kind="empty" title="No appointments today" />
 *   <StateMessage kind="loading" title={t('common.loading')} />
 */
export function StateMessage({ kind = 'empty', title, body, action, className }) {
  const styles = {
    empty: { icon: 'inbox', ring: 'bg-sunken text-ink-muted' },
    error: { icon: 'alertCircle', ring: 'bg-danger-50 text-danger-700' },
    success: { icon: 'checkCircle', ring: 'bg-success-50 text-success-700' },
    info: { icon: 'info', ring: 'bg-primary-50 text-primary-700' },
  }
  const s = styles[kind] ?? styles.empty
  return (
    <div
      className={cn('flex flex-col items-center px-6 py-12 text-center', className)}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-busy={kind === 'loading' || undefined}
    >
      {kind === 'loading' ? (
        <span className="mb-4 size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
      ) : (
        <span className={cn('mb-4 grid size-14 place-items-center rounded-full', s.ring)}>
          <Icon name={s.icon} size={28} />
        </span>
      )}
      {title && <p className="text-lg font-semibold text-ink">{title}</p>}
      {body && <p className="mt-1 max-w-md text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
