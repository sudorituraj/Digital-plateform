import { useEffect, useId, useRef } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

/**
 * Accessible dialog built on the native <dialog> element: it traps focus, closes on Esc,
 * and makes the page behind it inert — no extra code needed.
 *   <Modal open={open} onClose={close} title="Reschedule">…</Modal>
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const { t } = useI18n()
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault() // Esc: let React decide (keeps state and DOM in sync)
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()} // click on the backdrop
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-card bg-surface p-0 text-ink shadow-raised backdrop:bg-primary-950/45 open:animate-fade-in',
        widths[size],
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <h2 id={titleId} className="font-sans text-xl font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-sunken"
            >
              <Icon name="close" label={t('staff.details.close')} />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
