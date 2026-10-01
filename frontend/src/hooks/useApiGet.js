import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

/**
 * Load data from the API with loading / error / ready states.
 *   const [result, reload] = useApiGet('/appointments/mine')
 *   result.state: 'loading' | 'error' (result.error) | 'ready' (result.data)
 * Pass null as the path to skip the request (e.g. when nobody is logged in).
 * reload() refreshes quietly: the old data stays on screen (result.refreshing = true) until the new data arrives.
 */
export function useApiGet(path) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: null })
  const key = `${path}#${attempt}`

  useEffect(() => {
    if (path == null) return
    let cancelled = false
    api
      .get(path)
      .then((data) => !cancelled && setResult({ key, path, state: 'ready', data }))
      .catch((error) => !cancelled && setResult({ key, path, state: 'error', error }))
    return () => {
      cancelled = true
    }
  }, [path, key])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  if (result.key === key) return [result, reload]
  // Same path, newer attempt: keep showing the previous data while refreshing.
  if (result.path === path && result.state === 'ready') return [{ ...result, refreshing: true }, reload]
  // A result for an older path means the new request is still loading.
  return [{ state: 'loading' }, reload]
}
