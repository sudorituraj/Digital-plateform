import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'
import { ToastContext } from './toastContext'

const TONES = {
  success: ['bg-primary-900 text-white', 'checkCircle'],
  error: ['bg-danger-700 text-white', 'alertCircle'],
}

/**
 * Short confirmations ("Checked in — token 3") announced to screen readers, gone after 4 s.
 * The list is a "popover", so it sits in the browser's top layer — above an open <dialog> too.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  const region = useRef(null)

  // Re-open the popover whenever toasts change, so it is always the top-most layer.
  useEffect(() => {
    const el = region.current
    if (!el?.showPopover) return // very old browsers: stays a normal fixed element
    if (el.matches(':popover-open')) el.hidePopover()
    if (toasts.length) el.showPopover()
  }, [toasts])

  const show = useCallback((message, tone = 'success') => {
    const id = ++nextId.current
    setToasts((list) => [...list.slice(-2), { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        ref={region}
        popover="manual"
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-auto bottom-4 z-50 m-0 flex w-full flex-col items-center gap-2 overflow-visible border-0 bg-transparent p-0 px-4 [&:not(:popover-open)]:flex"
      >
        {toasts.map((toast) => {
          const [cls, icon] = TONES[toast.tone] ?? TONES.success
          return (
            <p
              key={toast.id}
              className={cn('flex animate-fade-up items-center gap-2.5 rounded-control px-4 py-3 font-medium shadow-raised', cls)}
            >
              <Icon name={icon} size={20} />
              {toast.message}
            </p>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
