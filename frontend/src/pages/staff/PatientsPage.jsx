import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PatientFormModal } from '../../components/staff/PatientFormModal'
import { Badge, Button, Card, Icon, StateMessage, StatusBadge, useToast } from '../../components/ui'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatDay, statusKey } from '../../lib/format'

const FILTERS = ['all', 'upcoming', 'follow_up', 'new']

export default function PatientsPage() {
  const { t, language } = useI18n()
  usePageTitle('patients')
  const toast = useToast()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [show, setShow] = useState('all')
  const [pages, setPages] = useState({ key: null, items: [], total: 0, hasMore: false, state: 'loading' })
  const [adding, setAdding] = useState(false)
  const key = `${q}|${show}`

  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  // First page whenever the search or filter changes.
  useEffect(() => {
    let cancelled = false
    api
      .get(`/staff/patients?${new URLSearchParams({ show, ...(q && { q }) })}`)
      .then((d) => !cancelled && setPages({ key, items: d.items, total: d.total, hasMore: d.has_more, state: 'ready' }))
      .catch((error) => !cancelled && setPages({ key, items: [], state: 'error', error }))
    return () => {
      cancelled = true
    }
  }, [q, show, key])

  async function loadMore() {
    const d = await api.get(`/staff/patients?${new URLSearchParams({ show, offset: pages.items.length, ...(q && { q }) })}`)
    setPages((p) => ({ ...p, items: [...p.items, ...d.items], hasMore: d.has_more }))
  }

  const list = pages.key === key ? pages : { state: 'loading' }
  const short = (iso) => formatDay(iso, language, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="mx-auto max-w-[96rem] space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t('staff.patients.title')}</h1>
          {list.state === 'ready' && <p className="mt-1 text-ink-muted">{t('staff.patients.count', { n: list.total })}</p>}
        </div>
        <Button icon="user" onClick={() => setAdding(true)}>
          {t('staff.patients.add')}
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3 sm:px-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('staff.patients.filterLabel')}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={show === f}
                onClick={() => setShow(f)}
                className={cn(
                  'min-h-10 rounded-full px-4 text-sm font-semibold ring-1 ring-inset',
                  show === f ? 'bg-primary-700 text-white ring-primary-700' : 'bg-surface text-ink ring-line-strong hover:ring-primary-300',
                )}
              >
                {t(`staff.patients.filters.${f}`)}
              </button>
            ))}
          </div>
          <label htmlFor="patient-search" className="sr-only">
            {t('staff.patients.searchLabel')}
          </label>
          <input
            id="patient-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('staff.patients.searchPlaceholder')}
            maxLength={50}
            className="min-h-11 w-full rounded-control border border-line-strong bg-surface px-4 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 sm:w-80"
          />
        </div>

        {list.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
        {list.state === 'error' && <StateMessage kind="error" title={errorMessage(t, list.error)} />}
        {list.state === 'ready' && !list.items.length && (
          <StateMessage kind="empty" title={q ? t('staff.dash.empty.search') : t('staff.patients.empty')} />
        )}
        {list.state === 'ready' && list.items.length > 0 && (
          <ul className="divide-y divide-line">
            {list.items.map((p) => (
              <li key={p.patient_code}>
                <Link
                  to={`/staff/patients/${p.patient_code}`}
                  className="grid gap-3 px-4 py-4 hover:bg-primary-50/40 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{p.name ?? t('staff.patients.noName')}</span>
                    <span className="block text-sm text-ink-muted">
                      {[p.patient_code, p.age != null && t('staff.dash.years', { age: p.age }), p.gender && t(`form.${p.gender}`), p.phone]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="text-sm">
                    <span className="block text-ink-muted">{t('staff.patients.lastVisit')}</span>
                    {p.last_visit ? short(p.last_visit) : t('staff.patients.never')}
                    {p.visits_count > 0 && <span className="text-ink-muted"> · {t('staff.patients.visits', { n: p.visits_count })}</span>}
                  </span>
                  <span className="text-sm">
                    {p.next_appointment ? (
                      <>
                        <span className="block text-ink-muted">{t('staff.patients.next')}</span>
                        {short(p.next_appointment.date)} · {t(`form.${p.next_appointment.time_slot}`)}{' '}
                        <StatusBadge status={statusKey(p.next_appointment.status)} />
                      </>
                    ) : p.follow_up_date ? (
                      <>
                        <span className="block text-ink-muted">{t('staff.patients.followUp')}</span>
                        <Badge tone={p.follow_up_date <= new Date().toISOString().slice(0, 10) ? 'warning' : 'accent'}>{short(p.follow_up_date)}</Badge>
                      </>
                    ) : null}
                  </span>
                  <Icon name="arrowRight" className="hidden text-ink-subtle sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {list.state === 'ready' && list.hasMore && (
          <div className="border-t border-line p-4 text-center">
            <Button variant="secondary" onClick={loadMore}>
              {t('staff.patients.loadMore')}
            </Button>
          </div>
        )}
      </Card>

      {adding && (
        <PatientFormModal
          onClose={() => setAdding(false)}
          onSaved={(p) => {
            toast(t('staff.patients.added', { name: p.name, code: p.patient_code }))
            navigate(`/staff/patients/${p.patient_code}`)
          }}
        />
      )}
    </div>
  )
}
