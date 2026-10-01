import { useEffect, useId, useRef, useState } from 'react'
import { useCountUp } from '../../hooks/useCountUp'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { formatDay } from '../../lib/format'

/*
 * Small, dependency-free charts following the dataviz rules: thin bars (≤ 24px) with 4px rounded
 * ends on a single baseline, hairline recessive grid, text in ink colours (never the series colour),
 * hover AND keyboard-focus tooltips, and a table view so nothing depends on seeing colour.
 */

export function StatFigure({ label, value, hint }) {
  const shown = useCountUp(value)
  return (
    <div className="rounded-control border border-line bg-surface p-4">
      <dt className="text-sm font-medium text-ink-muted">{label}</dt>
      <dd className="mt-1 text-4xl font-semibold tabular-nums">{value == null ? '–' : shown.toLocaleString('en-IN')}</dd>
      {hint && <dd className="mt-1 text-xs text-ink-subtle">{hint}</dd>}
    </div>
  )
}

/** Width of an element, kept up to date (for fitting axis labels). */
function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

/** Appointments per day (one series). Hover or focus a bar for the day's numbers. */
export function DailyBars({ data, title }) {
  const { t, language } = useI18n()
  const [active, setActive] = useState(null)
  const [asTable, setAsTable] = useState(false)
  const [axisRef, axisWidth] = useWidth()
  const tableId = useId()
  const max = Math.max(1, ...data.map((d) => d.booked))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const H = 180
  const n = data.length
  const label = (d) => formatDay(d.date, language, { day: 'numeric', month: 'short' })
  // x labels: one per ~70px, counted back from today so today is always labelled
  const maxLabels = Math.max(2, Math.floor((axisWidth || 560) / 70))
  const every = Math.ceil(n / maxLabels)

  return (
    <figure className="rounded-card border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <figcaption className="font-sans text-lg font-semibold">{title}</figcaption>
        <button type="button" onClick={() => setAsTable((v) => !v)} aria-expanded={asTable} aria-controls={tableId}
          className="min-h-11 text-sm font-semibold text-primary-700 underline underline-offset-4">
          {asTable ? t('staff.analytics.showChart') : t('staff.analytics.showTable')}
        </button>
      </div>

      {!asTable && (
        <div className="relative">
          <div className="flex">
            {/* y axis */}
            <div className="relative mr-2 w-7 shrink-0 text-right text-xs text-ink-subtle" style={{ height: H }} aria-hidden="true">
              {ticks.map((v) => (
                <span key={v} className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ top: H - (v / top) * H }}>
                  {v}
                </span>
              ))}
            </div>
            <div className="relative flex-1" style={{ height: H }}>
              {ticks.map((v) => (
                <div key={v} className="absolute inset-x-0 h-px bg-chart-grid" style={{ top: H - (v / top) * H }} aria-hidden="true" />
              ))}
              <ol className="absolute inset-0 flex items-end gap-[2px]" aria-label={title}>
                {data.map((d, i) => (
                  <li key={d.date} className="relative flex h-full flex-1 items-end justify-center">
                    <button
                      type="button"
                      className="group flex h-full w-full items-end justify-center outline-offset-2"
                      onPointerEnter={() => setActive(i)}
                      onPointerLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      aria-label={`${label(d)}: ${t('staff.analytics.tooltip', { booked: d.booked, completed: d.completed, cancelled: d.cancelled })}`}
                    >
                      <span
                        className={cn('w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity', active != null && active !== i && 'opacity-40')}
                        style={{ height: `${(d.booked / top) * 100}%`, minHeight: d.booked ? 2 : 0 }}
                      />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          {/* x labels */}
          <div ref={axisRef} className="ml-9 mt-2 flex text-xs text-ink-subtle" aria-hidden="true">
            {data.map((d, i) => (
              <span key={d.date} className="flex-1 text-center whitespace-nowrap">
                {(n - 1 - i) % every === 0 ? label(d) : ''}
              </span>
            ))}
          </div>
          {active != null && (
            <div
              role="tooltip"
              className={cn(
                'pointer-events-none absolute top-0 z-10 rounded-control bg-primary-950 px-3 py-2 text-sm whitespace-nowrap text-white shadow-raised',
                // keep the tooltip inside the chart near the edges
                active / n < 0.2 ? 'translate-x-2' : active / n > 0.8 ? '-translate-x-[calc(100%+0.5rem)]' : '-translate-x-1/2',
              )}
              style={{ left: `calc(2.25rem + (100% - 2.25rem) * ${(active + 0.5) / n})` }}
            >
              <p className="font-semibold">{formatDay(data[active].date, language, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              <p><strong className="tabular-nums">{data[active].booked}</strong> {t('staff.analytics.booked')}</p>
              <p><strong className="tabular-nums">{data[active].completed}</strong> {t('status.completed')}</p>
              <p><strong className="tabular-nums">{data[active].cancelled}</strong> {t('status.cancelled')}</p>
            </div>
          )}
        </div>
      )}

      {asTable && (
        <div id={tableId} className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th scope="col" className="py-2 pr-3 font-semibold">{t('book.day')}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">{t('staff.analytics.booked')}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">{t('status.completed')}</th>
                <th scope="col" className="py-2 text-right font-semibold">{t('status.cancelled')}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="py-1.5 pr-3">{formatDay(d.date, language, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="py-1.5 pr-3 text-right">{d.booked}</td>
                  <td className="py-1.5 pr-3 text-right">{d.completed}</td>
                  <td className="py-1.5 text-right">{d.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  )
}

/** Part-to-whole of two groups (e.g. new vs returning): one bar, 2px gap, legend + direct values. */
export function SplitBar({ title, parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  const colors = ['bg-chart-1', 'bg-chart-2']
  return (
    <figure className="rounded-card border border-line bg-surface p-5">
      <figcaption className="mb-4 font-sans text-lg font-semibold">{title}</figcaption>
      <div className="flex h-6 gap-[2px] overflow-hidden rounded-[4px] bg-sunken" aria-hidden="true">
        {total > 0 &&
          parts.map((p, i) => p.value > 0 && <span key={p.label} className={colors[i]} style={{ width: `${(p.value / total) * 100}%` }} />)}
      </div>
      <ul className="mt-4 grid gap-2">
        {parts.map((p, i) => (
          <li key={p.label} className="flex items-center gap-2.5">
            <span className={cn('size-3 shrink-0 rounded-sm', colors[i])} aria-hidden="true" />
            <span className="flex-1">{p.label}</span>
            <span className="font-semibold tabular-nums">{p.value}</span>
            <span className="w-12 text-right text-sm text-ink-muted tabular-nums">{total ? Math.round((p.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/** Ranked horizontal bars (one series): label, thin bar, value at the tip. */
export function BarList({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <figure className="rounded-card border border-line bg-surface p-5">
      <figcaption className="mb-4 font-sans text-lg font-semibold">{title}</figcaption>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[minmax(6rem,9rem)_1fr_2.5rem] items-center gap-3">
            <span className="text-sm">{r.label}</span>
            <span className="h-4 rounded-sm bg-sunken" aria-hidden="true">
              <span className="block h-full rounded-r-[4px] bg-chart-1" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 3 : 0 }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function niceTicks(max) {
  const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : Math.ceil(max / 50) * 10
  const out = []
  for (let v = 0; v <= max + step - 1; v += step) out.push(v)
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step)
  return out
}
