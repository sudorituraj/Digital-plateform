import { useI18n } from '../../i18n/useI18n'
import { Icon } from '../ui/Icon'
import { NeedsConfirmation } from '../ui/NeedsConfirmation'

/**
 * A labelled fact (e.g. "Qualifications"). If `value` is empty the fact is not yet
 * confirmed by the clinic: we show "To be confirmed" instead of inventing anything.
 */
export function Fact({ icon, label, value, unverified = false }) {
  const { t } = useI18n()
  const missing = value == null || value === ''
  return (
    <div className={icon ? 'relative py-4 pl-14' : 'py-4'}>
      <dt className="text-sm font-semibold text-ink-muted">
        {icon && (
          <span className="absolute top-4 left-0 grid size-10 place-items-center rounded-full bg-primary-50 text-primary-700" aria-hidden="true">
            <Icon name={icon} size={20} />
          </span>
        )}
        {label}
      </dt>
      <dd className="mt-0.5">
        {missing ? <span className="text-ink-muted italic">{t('common.toBeConfirmed')}</span> : value}
        {(missing || unverified) && <NeedsConfirmation className="ml-2" />}
      </dd>
    </div>
  )
}
