import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { formatDay, statusKey } from '../../lib/format'
import { Badge, Button, StatusBadge } from '../ui'
import { ACTION_ICONS, quickActions } from './actions'
import { PatientContact } from './PatientContact'

function PatientCell({ a }) {
  const { t } = useI18n()
  return (
    <div className="min-w-0">
      <Link to={`/staff/patients/${a.patient_code}`} className="font-semibold break-words text-ink underline-offset-4 hover:text-primary-700 hover:underline">
        {a.patient_name}
      </Link>
      <p className="text-sm text-ink-muted">
        {[a.patient_age != null && t('staff.dash.years', { age: a.patient_age }), a.patient_gender && t(`form.${a.patient_gender}`), a.patient_code]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <p className="mt-1 flex flex-wrap gap-1.5">
        {a.first_visit && <Badge tone="accent">{t('staff.dash.firstVisit')}</Badge>}
        {a.source === 'walk_in' && <Badge>{t('staff.dash.walkInTag')}</Badge>}
      </p>
    </div>
  )
}

function Token({ a }) {
  return a.token ? (
    <span className="grid size-10 place-items-center rounded-xl bg-primary-700 text-lg font-bold text-white">{a.token}</span>
  ) : (
    <span className="grid size-10 place-items-center text-ink-subtle" aria-hidden="true">
      –
    </span>
  )
}

function Actions({ a, today, busyId, onAction, onOpen }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-2">
      {quickActions(a, today).map((action, i) => (
        <Button
          key={action}
          size="sm"
          variant={i === 0 ? 'primary' : 'secondary'}
          icon={ACTION_ICONS[action]}
          disabled={busyId === a.request_id}
          onClick={() => onAction(a, action)}
        >
          {t(`staff.actions.${action}`)}
        </Button>
      ))}
      <Button size="sm" variant="ghost" onClick={() => onOpen(a)} aria-label={`${t('staff.actions.details')} — ${a.patient_name}`}>
        {t('staff.actions.details')}
      </Button>
    </div>
  )
}

/** Table on large screens, cards on phones/tablets. `showDate` for the multi-day requests view. */
export function AppointmentList({ items, today, showDate, busyId, onAction, onOpen }) {
  const { t, language } = useI18n()
  const when = (a) =>
    showDate ? `${formatDay(a.date, language, { weekday: 'short', day: 'numeric', month: 'short' })} · ${t(`form.${a.time_slot}`)}` : t(`form.${a.time_slot}`)

  return (
    <>
      <table className="hidden w-full border-separate border-spacing-0 lg:table">
        <thead>
          <tr className="text-left text-sm text-ink-muted">
            {['token', 'patient', showDate ? 'date' : 'time', 'status', 'contact', 'actions'].map((c) => (
              <th key={c} scope="col" className="border-b border-line px-3 py-2.5 font-semibold first:pl-5">
                {t(`staff.dash.columns.${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.request_id} className="align-middle transition-colors hover:bg-primary-50/40">
              <td className="border-b border-line py-3 pr-3 pl-5">
                <Token a={a} />
              </td>
              <td className="border-b border-line px-3 py-3">
                <PatientCell a={a} />
              </td>
              <td className="border-b border-line px-3 py-3 whitespace-nowrap">{when(a)}</td>
              <td className="border-b border-line px-3 py-3">
                <StatusBadge status={statusKey(a.status)} />
              </td>
              <td className="border-b border-line px-3 py-3">
                <PatientContact a={a} />
              </td>
              <td className="border-b border-line px-3 py-3">
                <Actions a={a} today={today} busyId={busyId} onAction={onAction} onOpen={onOpen} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-line lg:hidden">
        {items.map((a) => (
          <li key={a.request_id} className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <Token a={a} />
              <div className="min-w-0 flex-1">
                <PatientCell a={a} />
              </div>
              <StatusBadge status={statusKey(a.status)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pl-13">
              <span className="text-sm font-medium">{when(a)}</span>
              <PatientContact a={a} />
            </div>
            <div className="pl-13">
              <Actions a={a} today={today} busyId={busyId} onAction={onAction} onOpen={onOpen} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
