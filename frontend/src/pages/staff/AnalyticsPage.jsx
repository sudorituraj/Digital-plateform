import { useState } from 'react'
import { BarList, DailyBars, SplitBar, StatFigure } from '../../components/staff/Charts'
import { Button, StateMessage } from '../../components/ui'
import { useApiGet } from '../../hooks/useApiGet'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { errorMessage } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatDay, statusKey } from '../../lib/format'

const RANGES = [7, 30, 90]

/** Simple management numbers — scope §12: counts and a few small charts, not a BI tool. */
export default function AnalyticsPage() {
  const { t, language } = useI18n()
  usePageTitle('analytics')
  const [days, setDays] = useState(30)
  const [result, reload] = useApiGet(`/staff/analytics?days=${days}`)
  const a = result.state === 'ready' ? result.data : null

  return (
    <div className="mx-auto max-w-[96rem] space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t('staff.analytics.title')}</h1>
          {a && (
            <p className="mt-1 text-ink-muted">
              {formatDay(a.start, language, { day: 'numeric', month: 'short' })} – {formatDay(a.end, language, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div role="group" aria-label={t('staff.analytics.range')} className="flex gap-1 rounded-control bg-sunken p-1">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
              className={cn('min-h-10 rounded-[0.6rem] px-4 font-semibold', days === r ? 'bg-surface shadow-sm' : 'text-ink-muted hover:text-ink')}>
              {t('staff.analytics.lastDays', { n: r })}
            </button>
          ))}
        </div>
      </div>

      {result.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
      {result.state === 'error' && (
        <StateMessage kind="error" title={errorMessage(t, result.error)} action={<Button variant="secondary" onClick={reload}>{t('common.tryAgain')}</Button>} />
      )}
      {a && (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatFigure label={t('staff.analytics.totals.appointments')} value={a.totals.appointments} hint={t('staff.analytics.notCancelled')} />
            <StatFigure label={t('status.completed')} value={a.totals.completed} />
            <StatFigure label={t('status.cancelled')} value={a.totals.cancelled} />
            <StatFigure label={t('staff.analytics.totals.pending')} value={a.totals.pending} hint={t('staff.analytics.pendingHint')} />
            <StatFigure label={t('staff.analytics.totals.new')} value={a.totals.new_patients} />
            <StatFigure label={t('staff.analytics.totals.returning')} value={a.totals.returning_patients} />
          </dl>

          <DailyBars title={t('staff.analytics.perDay')} data={a.by_day} />

          <div className="grid gap-6 lg:grid-cols-3">
            <SplitBar
              title={t('staff.analytics.newVsReturning')}
              parts={[
                { label: t('staff.analytics.totals.new'), value: a.totals.new_patients },
                { label: t('staff.analytics.totals.returning'), value: a.totals.returning_patients },
              ]}
            />
            <BarList
              title={t('staff.analytics.byStatus')}
              rows={Object.entries(a.statuses).map(([s, v]) => ({ label: t(`status.${statusKey(s)}`), value: v }))}
            />
            <div className="space-y-6">
              <BarList
                title={t('staff.analytics.bySource')}
                rows={['online', 'walk_in'].map((s) => ({ label: t(`staff.details.sources.${s}`), value: a.sources[s] ?? 0 }))}
              />
              <BarList title={t('staff.analytics.bySlot')} rows={Object.entries(a.slots).map(([s, v]) => ({ label: t(`form.${s}`), value: v }))} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
