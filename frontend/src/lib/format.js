// Date helpers. Appointment dates are plain "YYYY-MM-DD" strings in clinic time (India).

const LOCALES = { en: 'en-IN', hi: 'hi-IN', bho: 'hi-IN', hinglish: 'en-IN' }

/** "2026-09-27" → Date at local midnight (never shifted by time zones). */
export function parseDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDay(iso, language, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat(LOCALES[language] ?? 'en-IN', options).format(parseDay(iso))
}

export function dayDiff(iso, todayIso) {
  return Math.round((parseDay(iso) - parseDay(todayIso)) / 86400000)
}

/** API uses snake_case statuses; locale keys and badges use camelCase. */
export const statusKey = (status) => status.replace(/_(\w)/g, (_, c) => c.toUpperCase())

/** "2026-09-29T08:15:00Z" → "1:45 pm" in clinic-friendly local format. */
export function formatTime(isoDateTime, language) {
  return new Intl.DateTimeFormat(LOCALES[language] ?? 'en-IN', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(isoDateTime),
  )
}

/** Add days to a "YYYY-MM-DD" string. */
export function addDays(iso, days) {
  const d = parseDay(iso)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
