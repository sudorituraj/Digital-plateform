import { useI18n } from '../i18n/useI18n'
import { formatRupees } from '../lib/card'
import { formatDay } from '../lib/format'

/** One line describing a payment, e.g. "₹300 · UPI · DEMO-1A2B3C4D". */
export function usePaymentLine() {
  const { t, language } = useI18n()
  return (p) => {
    if (p.status === 'free') return t('pay.freeLine', { until: formatDay(p.free_until, language, { day: 'numeric', month: 'long' }) })
    const parts = [formatRupees(p.amount, language)]
    if (p.method) parts.push(t(`pay.methods.${p.method}`))
    if (p.card_last4) parts.push(`•••• ${p.card_last4}`)
    if (p.bank) parts.push(t(`pay.banks.${p.bank}`))
    if (p.reference) parts.push(p.reference)
    return parts.join(' · ')
  }
}
