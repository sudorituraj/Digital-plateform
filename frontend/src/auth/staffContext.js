import { createContext, useContext } from 'react'

export const StaffAuthContext = createContext(null)

/**
 * const { status, staff, setStaff, logout } = useStaffAuth()
 * status: 'loading' | 'guest' | 'staff' | 'error' (server unreachable — call retry())
 * staff: { username, name, role }
 */
export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext)
  if (!ctx) throw new Error('useStaffAuth must be used inside <StaffAuthProvider>')
  return ctx
}
