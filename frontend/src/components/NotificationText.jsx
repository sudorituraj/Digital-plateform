import { useI18n } from '../i18n/useI18n'
import { formatRupees } from '../lib/card'
import { formatDay } from '../lib/format'

export const NOTIFICATION_ICONS = {
  submitted: 'send',
  confirmed: 'checkCircle',
  reminder: 'clock',
  rescheduled: 'calendar',
  cancelled: 'alertCircle',
  follow_up: 'heart',
  paid: 'receipt',
}

/** Turns a stored notification (type + params) into text in the reader's language. */
export function useNotificationText() {
  const { t, language } = useI18n()
  return (n) => {
    const p = n.params ?? {}
    const vars = {
      id: n.request_id ?? '',
      date: p.date ? formatDay(p.date, language, { weekday: 'long', day: 'numeric', month: 'long' }) : '',
      time: p.time_slot ? t(`form.${p.time_slot}`) : '',
      amount: p.amount ? formatRupees(Number(p.amount), language) : '',
      reference: p.reference ?? '',
      followUp: p.follow_up_date ? formatDay(p.follow_up_date, language, { weekday: 'long', day: 'numeric', month: 'long' }) : '',
    }
    return { title: t(`notifications.types.${n.type}.title`, vars), body: t(`notifications.types.${n.type}.body`, vars) }
  }
}
