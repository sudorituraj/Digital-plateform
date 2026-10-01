import { useI18n } from '../../i18n/useI18n'
import { formatRupees } from '../../lib/card'
import { formatDay } from '../../lib/format'
import { Icon } from '../ui'

/** What the chosen day will cost: free follow-up (≤ 14 days since the last visit) or the consultation fee. */
export function FeeNote({ quote }) {
  const { t, language } = useI18n()
  const day = (iso) => formatDay(iso, language, { day: 'numeric', month: 'long' })
  if (!quote.required) {
    return (
      <div role="status" className="flex animate-fade-in gap-3.5 rounded-control bg-success-50 p-4 text-success-700 ring-1 ring-success-600/25">
        <span className="grid size-10 shrink-0 animate-[pop_0.5s_var(--ease-gentle)_both] place-items-center rounded-full bg-success-600 text-white">
          <Icon name="heart" size={20} />
        </span>
        <div>
          <p className="font-semibold">{t('pay.freeTitle')}</p>
          <p className="text-sm">
            {t('pay.freeBody', { last: day(quote.last_visit), until: day(quote.free_until), days: quote.free_days })}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div role="status" className="flex animate-fade-in gap-3.5 rounded-control bg-accent-50 p-4 ring-1 ring-accent-200">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-500 text-white">
        <Icon name="rupee" size={20} />
      </span>
      <div>
        <p className="font-semibold">{t('pay.feeTitle', { amount: formatRupees(quote.amount, language) })}</p>
        <p className="text-sm text-ink-muted">
          {quote.last_visit
            ? t('pay.feeAfterFree', { last: day(quote.last_visit), days: quote.free_days })
            : t('pay.feeNew', { days: quote.free_days })}
        </p>
      </div>
    </div>
  )
}
