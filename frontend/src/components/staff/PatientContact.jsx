import { useI18n } from '../../i18n/useI18n'
import { Icon } from '../ui'

/** Call / WhatsApp the patient straight from the list. */
export function PatientContact({ a, message }) {
  const { t } = useI18n()
  const text = message ?? t('staff.whatsappTemplate', { name: a.patient_name, id: a.request_id })
  const btn = 'inline-flex size-10 items-center justify-center rounded-control ring-1 ring-inset'
  return (
    <span className="flex items-center gap-1.5">
      <a href={`tel:+91${a.patient_phone}`} className={`${btn} text-primary-800 ring-line-strong hover:bg-primary-50`}>
        <Icon name="phone" size={18} label={t('staff.actions.callPatient', { name: a.patient_name })} />
      </a>
      <a
        href={`https://wa.me/91${a.patient_phone}?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} bg-whatsapp text-white ring-whatsapp hover:bg-whatsapp-dark`}
      >
        <Icon name="whatsapp" size={18} label={t('staff.actions.whatsappPatient', { name: a.patient_name })} />
      </a>
      <span className="ml-1 hidden font-mono text-sm text-ink-muted xl:inline">{a.patient_phone}</span>
    </span>
  )
}
