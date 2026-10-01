import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'

/** Booking progress: full labels on larger screens, "Step 2 of 4" + bar on phones. */
export function Stepper({ steps, current }) {
  const { t } = useI18n()
  const index = steps.indexOf(current)
  return (
    <nav aria-label={t('book.progressLabel')}>
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-ink-muted">
          {t('book.stepOf', { n: index + 1, total: steps.length })} · <span className="text-ink">{t(`book.steps.${current}`)}</span>
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-primary-600 transition-[width] duration-500 ease-(--ease-gentle)"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, i) => {
          const done = i < index
          const active = i === index
          return (
            <li key={step} className="flex flex-1 items-center gap-2" aria-current={active ? 'step' : undefined}>
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors duration-300',
                  done && 'bg-primary-700 text-white',
                  active && 'bg-primary-700 text-white ring-4 ring-primary-100',
                  !done && !active && 'bg-sunken text-ink-muted',
                )}
              >
                {done ? <Icon name="check" size={18} label={t('book.stepDone')} /> : i + 1}
              </span>
              <span className={cn('text-sm font-semibold whitespace-nowrap', active ? 'text-ink' : 'text-ink-muted')}>
                {t(`book.steps.${step}`)}
              </span>
              {i < steps.length - 1 && (
                <span className={cn('mx-1 h-0.5 flex-1 rounded-full', done ? 'bg-primary-600' : 'bg-line')} aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
