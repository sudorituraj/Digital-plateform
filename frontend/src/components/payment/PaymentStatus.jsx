import { useI18n } from '../../i18n/useI18n'
import { Badge } from '../ui'

const TONES = { paid: 'success', free: 'primary', pending: 'warning', refunded: 'neutral' }

/** Small badge: Paid / Free follow-up / Payment pending / Refunded. */
export function PaymentBadge({ payment, className }) {
  const { t } = useI18n()
  if (!payment) return null
  return (
    <Badge tone={TONES[payment.status]} className={className}>
      {t(`pay.status.${payment.status}`)}
    </Badge>
  )
}
