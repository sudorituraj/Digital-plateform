import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { AuthContext } from './context'

/** Knows whether a patient is logged in. The session itself is an httpOnly cookie set by the API. */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', patient: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .get('/auth/session')
      .then(({ patient }) => !cancelled && setState({ status: patient ? 'patient' : 'guest', patient }))
      // Server unreachable: public pages behave as for a guest; account pages offer "Try again".
      .catch((error) => !cancelled && setState({ status: 'error', patient: null, error }))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', patient: null })
    setAttempt((n) => n + 1)
  }, [])

  const setPatient = useCallback((patient) => setState({ status: 'patient', patient }), [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    // loggedOut tells protected pages to go home rather than to the login screen.
    setState({ status: 'guest', patient: null, loggedOut: true })
  }, [])

  // Called once the patient has landed on the home page after logging out.
  const clearLoggedOut = useCallback(() => setState((s) => (s.loggedOut ? { ...s, loggedOut: false } : s)), [])

  const value = useMemo(
    () => ({ ...state, setPatient, logout, clearLoggedOut, retry }),
    [state, setPatient, logout, clearLoggedOut, retry],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
