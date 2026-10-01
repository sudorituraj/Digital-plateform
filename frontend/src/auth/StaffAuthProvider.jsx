import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { StaffAuthContext } from './staffContext'

/** Staff login state. Separate from patients: the API uses a different session cookie. */
export function StaffAuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', staff: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .get('/staff/session')
      .then(({ staff }) => !cancelled && setState({ status: staff ? 'staff' : 'guest', staff }))
      // Server down ≠ logged out: keep the person where they are and offer "Try again".
      .catch((error) => !cancelled && setState({ status: 'error', staff: null, error }))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', staff: null })
    setAttempt((n) => n + 1)
  }, [])

  const setStaff = useCallback((staff) => setState({ status: 'staff', staff }), [])
  const logout = useCallback(async () => {
    await api.post('/staff/logout').catch(() => {})
    setState({ status: 'guest', staff: null })
  }, [])

  const value = useMemo(() => ({ ...state, setStaff, logout, retry }), [state, setStaff, logout, retry])
  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
}
