import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { formatRupees } from '../../lib/card'
import { cn } from '../../lib/cn'
import { Button, Icon } from '../ui'
import { usePaymentLine } from '../../hooks/usePaymentLine'
import { PaymentBadge } from './PaymentStatus'
import { PaymentPanel } from './PaymentPanel'

const ICONS = { paid: 'checkCircle', free: 'heart', pending: 'rupee', refunded: 'receipt' }

/** Payment section of the appointment page: status, receipt, or "Pay now". */
export function AppointmentPayment({ appointment, justPaid, onPaid }) {
  const { t, language } = useI18n()
  const line = usePaymentLine()
  const [open, setOpen] = useState(false)
  const p = appointment.payment
  if (!p) return null
  const canPay = p.status === 'pending' && !['cancelled', 'completed'].includes(appointment.status)

  return (
    <section aria-labelledby="payment-heading" className="border-t border-line px-5 py-5 sm:px-7">
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full',
            p.status === 'paid' && 'bg-success-50 text-success-600',
            p.status === 'free' && 'bg-primary-50 text-primary-700',
            p.status === 'pending' && 'bg-warning-50 text-warning-700',
            p.status === 'refunded' && 'bg-sunken text-ink-muted',
            justPaid && 'animate-[pop_0.5s_var(--ease-gentle)_both]',
          )}
        >
          <Icon name={ICONS[p.status]} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="payment-heading" className="text-lg">
              {t('pay.fee')}
            </h2>
            <PaymentBadge payment={p} />
          </div>
          <p className="mt-0.5 break-words text-ink-muted">
            {p.status === 'pending' ? t('pay.pendingLine', { amount: formatRupees(p.amount, language) }) : line(p)}
          </p>
          {p.status === 'refunded' && <p className="mt-1 text-sm text-ink-muted">{t('pay.refundedNote')}</p>}
        </div>
      </div>
      {canPay && !open && (
        <Button size="lg" fullWidth icon="lock" className="mt-4" onClick={() => setOpen(true)}>
          {t('pay.payNow', { amount: formatRupees(p.amount, language) })}
        </Button>
      )}
      {canPay && open && (
        <PaymentPanel
          className="mt-5 animate-fade-up"
          appointment={appointment}
          onPaid={(updated) => {
            setOpen(false)
            onPaid(updated)
          }}
          onLater={() => setOpen(false)}
        />
      )}
    </section>
  )
}
