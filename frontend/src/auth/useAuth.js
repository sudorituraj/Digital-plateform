import { useContext } from 'react'
import { AuthContext } from './context'

/**
 * const { status, patient, setPatient, logout } = useAuth()
 * status: 'loading' | 'guest' | 'patient' | 'error' (server unreachable — call retry())
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
