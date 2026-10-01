/**
 * Which buttons reception sees for an appointment. Mirrors backend/app/lifecycle.py —
 * the server checks again, so this only decides what to show.
 */
export const ACTION_TO_STATUS = { confirm: 'confirmed', checkIn: 'checked_in', waiting: 'waiting', complete: 'completed' }

export function availableActions(a, today) {
  const isToday = a.date === today
  const actions = []
  if (a.status === 'request_submitted') actions.push('confirm')
  if (['request_submitted', 'confirmed'].includes(a.status) && isToday) actions.push('checkIn')
  if (a.status === 'checked_in') actions.push('waiting')
  if (['checked_in', 'waiting'].includes(a.status) && a.date <= today) actions.push('complete')
  if (['request_submitted', 'confirmed'].includes(a.status)) actions.push('reschedule')
  if (!['completed', 'cancelled'].includes(a.status)) actions.push('cancel')
  return actions
}

/** The one or two buttons shown directly in the list (the rest are in Details). */
export function quickActions(a, today) {
  return availableActions(a, today).filter((x) => x in ACTION_TO_STATUS).slice(0, 2)
}

export const ACTION_ICONS = {
  confirm: 'check',
  checkIn: 'user',
  waiting: 'clock',
  complete: 'checkCircle',
  reschedule: 'calendar',
  cancel: 'close',
}
