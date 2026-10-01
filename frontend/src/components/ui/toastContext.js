import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

/** const toast = useToast(); toast('Saved', 'success') */
export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
