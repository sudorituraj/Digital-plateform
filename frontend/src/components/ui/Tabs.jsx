import { useRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * Accessible tab bar. Render the active panel yourself with:
 *   <div role="tabpanel" id={`${value}-panel`} aria-labelledby={`${value}-tab`}>…</div>
 * Keyboard: ←/→ move between tabs (and select them), Home/End jump to the ends.
 */
export function Tabs({ tabs, value, onChange, label, className }) {
  const refs = useRef([])
  const onKeyDown = (e, i) => {
    const last = tabs.length - 1
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={cn('grid grid-cols-2 gap-1 rounded-control bg-sunken p-1', className)}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => (refs.current[i] = el)}
          type="button"
          role="tab"
          id={`${tab.id}-tab`}
          aria-selected={value === tab.id}
          aria-controls={`${tab.id}-panel`}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
          className={cn(
            'min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition-colors',
            value === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
