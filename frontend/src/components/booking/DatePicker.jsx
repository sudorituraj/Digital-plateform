import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { dayDiff, formatDay } from '../../lib/format'

const FIRST_BATCH = 14

/** Big tappable day buttons (no calendar typing). Shows two weeks, with "more dates" on request. */
export function DatePicker({ dates, today, value, onChange, error }) {
  const { t, language } = useI18n()
  const [showAll, setShowAll] = useState(() => value && dates.indexOf(value) >= FIRST_BATCH)
  const visible = showAll ? dates : dates.slice(0, FIRST_BATCH)

  return (
    <fieldset>
      <legend className="mb-3 text-lg font-semibold text-ink">{t('book.chooseDay')}</legend>
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5 lg:grid-cols-8">
        {visible.map((iso) => {
          const diff = dayDiff(iso, today)
          const checked = value === iso
          const special = diff === 0 ? t('book.today') : diff === 1 ? t('book.tomorrow') : null
          return (
            <label
              key={iso}
              className={cn(
                'press relative flex min-h-[4.75rem] cursor-pointer flex-col items-center justify-center rounded-control border px-1 py-2 text-center transition-colors duration-150',
                'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-400',
                checked
                  ? 'animate-[pop_0.3s_var(--ease-gentle)] border-primary-700 bg-primary-700 text-white shadow-card'
                  : 'border-line-strong bg-surface text-ink hover:border-primary-300 hover:bg-primary-50',
              )}
            >
              <input type="radio" name="booking-date" value={iso} checked={checked} onChange={() => onChange(iso)} className="sr-only" />
              <span className={cn('text-xs font-semibold uppercase', checked ? 'text-primary-100' : 'text-ink-muted')}>
                {special ?? formatDay(iso, language, { weekday: 'short' })}
              </span>
              <span className="text-2xl leading-tight font-bold">{formatDay(iso, language, { day: 'numeric' })}</span>
              <span className={cn('text-xs', checked ? 'text-primary-100' : 'text-ink-muted')}>
                {formatDay(iso, language, { month: 'short' })}
              </span>
            </label>
          )
        })}
      </div>
      {!showAll && dates.length > FIRST_BATCH && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 min-h-11 font-semibold text-primary-700 underline underline-offset-4"
        >
          {t('book.moreDates')}
        </button>
      )}
      {error && (
        <p className="mt-2 text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
