import { env } from '../config/env'

/** Error thrown for any non-2xx API response. `code` matches errors.<code> in the locale files. */
export class ApiError extends Error {
  constructor(status, body) {
    const info = body?.error ?? {}
    super(info.message ?? `Request failed (${status})`)
    this.status = status
    this.code = info.code ?? (status === 0 ? 'network' : 'server_error')
    this.fields = info.fields ?? []
    this.retryAfter = info.retry_after
    this.attemptsLeft = info.attempts_left
    this.requestId = info.request_id
    this.patientCode = info.patient_code
  }
}

/**
 * Small fetch wrapper: JSON in/out, session cookie included, one error type.
 *   await api.get('/me')
 *   await api.post('/appointments', { ... })
 */
async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      credentials: 'include', // send the httpOnly session cookie
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, null) // offline / server unreachable
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body),
}

/** Translated, patient-friendly message for any error. */
export function errorMessage(t, error) {
  const key = `errors.${error?.code ?? 'server_error'}`
  const text = t(key, { seconds: error?.retryAfter ?? '', attempts: error?.attemptsLeft ?? '' })
  return text === key ? t('errors.server_error') : text
}
