import { useCallback, useEffect, useState } from 'react'
import { AppointmentList } from '../../components/staff/AppointmentList'
import { ACTION_TO_STATUS } from '../../components/staff/actions'
import { CancelModal, DetailsModal, RescheduleModal, WalkInModal } from '../../components/staff/Dialogs'
import { Button, Card, StateMessage, useToast } from '../../components/ui'
import { useApiGet } from '../../hooks/useApiGet'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { cn } from '../../lib/cn'
import { addDays, formatDay, statusKey } from '../../lib/format'

const REFRESH_MS = 30_000
const STATUS_TILES = ['request_submitted', 'confirmed', 'checked_in', 'waiting', 'completed', 'cancelled']

function StatTile({ label, value, active, onClick, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-20 flex-col justify-between rounded-control border p-3 text-left transition-colors',
        active ? 'border-primary-700 bg-primary-700 text-white' : 'border-line bg-surface hover:border-primary-300',
        tone === 'accent' && !active && 'border-accent-300 bg-accent-50',
      )}
    >
      <span className={cn('text-sm font-medium', active ? 'text-primary-100' : 'text-ink-muted')}>{label}</span>
      <span className="text-3xl leading-none font-bold tabular-nums">{value ?? '–'}</span>
    </button>
  )
}

export default function ReceptionPage() {
  const { t, language } = useI18n()
  usePageTitle('reception')
  const toast = useToast()

  const [date, setDate] = useState(null) // null = today (the server decides "today" in clinic time)
  const [view, setView] = useState('day')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null) // { kind: 'details'|'reschedule'|'cancel'|'walkIn', a }
  const [busyId, setBusyId] = useState(null)
  const [cancelError, setCancelError] = useState(null)

  // Wait until typing pauses before searching.
  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const dateParam = date ? `date=${date}` : ''
  const [overview, reloadOverview] = useApiGet(`/staff/overview?${dateParam}`)
  const listParams = new URLSearchParams({ view, ...(date && { date }), ...(status && view === 'day' && { status }), ...(q && { q }) })
  const [list, reloadList] = useApiGet(`/staff/appointments?${listParams}`)
  const today = overview.data?.today
  const shownDate = date ?? today

  const reload = useCallback(() => {
    reloadOverview()
    reloadList()
  }, [reloadOverview, reloadList])

  // New online bookings appear without pressing anything.
  useEffect(() => {
    const id = setInterval(reload, REFRESH_MS)
    window.addEventListener('focus', reload)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', reload)
    }
  }, [reload])

  const afterChange = (updated, message) => {
    setOpen((o) => (o?.kind === 'details' && updated ? { kind: 'details', a: updated } : null))
    toast(message)
    reload()
  }

  async function changeStatus(a, newStatus, note) {
    setBusyId(a.request_id)
    try {
      const updated = await api.post(`/staff/appointments/${a.request_id}/status`, { status: newStatus, note })
      const key = statusKey(newStatus)
      afterChange(updated, t(`staff.toast.${key}`, { name: a.patient_name, token: updated.token ?? '' }))
      return true
    } catch (err) {
      toast(errorMessage(t, err), 'error')
      if (err.code === 'changed_elsewhere' || err.code === 'invalid_transition') reload()
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function markPaidCash(a) {
    setBusyId(a.request_id)
    try {
      const updated = await api.post(`/staff/appointments/${a.request_id}/paid-at-clinic`)
      afterChange(updated, t('staff.toast.paidCash', { name: a.patient_name }))
    } catch (err) {
      toast(errorMessage(t, err), 'error')
      reload()
    } finally {
      setBusyId(null)
    }
  }

  function onAction(a, action) {
    if (action === 'paidCash') markPaidCash(a)
    else if (action in ACTION_TO_STATUS) changeStatus(a, ACTION_TO_STATUS[action])
    else {
      setCancelError(null)
      setOpen({ kind: action, a })
    }
  }

  const goToDate = (d) => {
    setView('day')
    setStatus('')
    setDate(d === today ? null : d)
  }

  const filtered = Boolean(status || q)
  const counts = overview.data?.counts

  return (
    <div className="mx-auto max-w-[96rem] space-y-6 px-4 py-6 sm:px-6">
      {/* Heading + date navigation */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t('staff.dash.title')}</h1>
          {shownDate && (
            <p className="mt-1 text-lg text-ink-muted">
              {formatDay(shownDate, language)}
              {shownDate === today && <span className="ml-2 font-semibold text-primary-700">· {t('staff.dash.today')}</span>}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon="arrowLeft" onClick={() => goToDate(addDays(shownDate, -1))} disabled={!shownDate} aria-label={t('staff.dash.prevDay')} />
          <label className="sr-only" htmlFor="staff-date">
            {t('staff.dash.pickDate')}
          </label>
          <input
            id="staff-date"
            type="date"
            value={shownDate ?? ''}
            onChange={(e) => e.target.value && goToDate(e.target.value)}
            className="min-h-11 rounded-control border border-line-strong bg-surface px-3"
          />
          <Button variant="secondary" size="sm" icon="arrowRight" onClick={() => goToDate(addDays(shownDate, 1))} disabled={!shownDate} aria-label={t('staff.dash.nextDay')} />
          {date && (
            <Button variant="ghost" size="sm" onClick={() => goToDate(today)}>
              {t('staff.dash.today')}
            </Button>
          )}
          <Button icon="user" onClick={() => setOpen({ kind: 'walkIn' })}>
            {t('staff.dash.addWalkIn')}
          </Button>
        </div>
      </div>

      {/* Numbers for the day. Tapping a status filters the list. */}
      <section aria-label={t('staff.dash.statsLabel')} className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <StatTile label={t('staff.dash.stats.total')} value={counts?.total} active={view === 'day' && !status} onClick={() => { setView('day'); setStatus('') }} />
        <StatTile
          label={t('staff.dash.stats.pending')}
          value={overview.data?.pending_requests}
          active={view === 'requests'}
          tone="accent"
          onClick={() => setView('requests')}
        />
        {STATUS_TILES.slice(1).map((s) => (
          <StatTile key={s} label={t(`status.${statusKey(s)}`)} value={counts?.[s]} active={view === 'day' && status === s} onClick={() => { setView('day'); setStatus(status === s ? '' : s) }} />
        ))}
        <StatTile label={t('staff.dash.stats.newPatients')} value={overview.data?.new_patients} active={false} onClick={() => { setView('day'); setStatus('') }} />
      </section>

      <Card padding="none" className="overflow-hidden">
        {/* Tabs + search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3 sm:px-5">
          <div role="tablist" aria-label={t('staff.dash.tabsLabel')} className="flex gap-1 rounded-control bg-sunken p-1">
            {['day', 'requests'].map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn('min-h-10 rounded-[0.6rem] px-4 font-semibold', view === v ? 'bg-surface shadow-sm' : 'text-ink-muted hover:text-ink')}
              >
                {t(`staff.dash.tabs.${v}`)}
                {v === 'requests' && overview.data?.pending_requests > 0 && (
                  <span className="ml-2 rounded-full bg-accent-500 px-2 py-0.5 text-xs text-primary-950">{overview.data.pending_requests}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative w-full sm:w-80">
              <label htmlFor="staff-search" className="sr-only">
                {t('staff.dash.searchLabel')}
              </label>
              <input
                id="staff-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('staff.dash.searchPlaceholder')}
                maxLength={50}
                className="min-h-11 w-full rounded-control border border-line-strong bg-surface px-4 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </div>
            {filtered && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus('') }}>
                {t('staff.dash.clearFilters')}
              </Button>
            )}
          </div>
        </div>

        {list.state === 'loading' && <StateMessage kind="loading" title={t('common.loading')} />}
        {list.state === 'error' && (
          <StateMessage
            kind="error"
            title={errorMessage(t, list.error)}
            action={
              <Button variant="secondary" onClick={reload}>
                {t('common.tryAgain')}
              </Button>
            }
          />
        )}
        {list.state === 'ready' &&
          (list.data.items.length ? (
            <AppointmentList
              items={list.data.items}
              today={today}
              showDate={view === 'requests'}
              busyId={busyId}
              onAction={onAction}
              onOpen={(a) => setOpen({ kind: 'details', a })}
            />
          ) : (
            <StateMessage
              kind="empty"
              title={filtered ? t('staff.dash.empty.search') : t(`staff.dash.empty.${view}`)}
              action={
                !filtered && view === 'day' ? (
                  <Button variant="secondary" icon="user" onClick={() => setOpen({ kind: 'walkIn' })}>
                    {t('staff.dash.addWalkIn')}
                  </Button>
                ) : null
              }
            />
          ))}
      </Card>
      <p className="text-right text-sm text-ink-muted" aria-live="polite">
        {list.refreshing ? t('staff.dash.refreshing') : list.state === 'ready' && t('staff.dash.autoRefresh')}
      </p>

      {open?.kind === 'details' && (
        <DetailsModal a={open.a} today={today} busy={busyId === open.a.request_id} onClose={() => setOpen(null)} onAction={onAction} />
      )}
      {open?.kind === 'reschedule' && <RescheduleModal a={open.a} onClose={() => setOpen(null)} onDone={afterChange} />}
      {open?.kind === 'cancel' && (
        <CancelModal
          a={open.a}
          busy={busyId === open.a.request_id}
          error={cancelError}
          onClose={() => setOpen(null)}
          onConfirm={async (note) => {
            setCancelError(null)
            const ok = await changeStatus(open.a, 'cancelled', note)
            if (ok) setOpen(null)
          }}
        />
      )}
      {open?.kind === 'walkIn' && (
        <WalkInModal
          onClose={() => setOpen(null)}
          onDone={(created, message) => {
            if (created.date !== shownDate) goToDate(created.date)
            afterChange(null, message)
          }}
        />
      )}
    </div>
  )
}
