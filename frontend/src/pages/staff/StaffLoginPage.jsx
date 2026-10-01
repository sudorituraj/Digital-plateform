import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../../auth/staffContext'
import { Alert, Button, Card, Container, Icon, StateMessage, TextField } from '../../components/ui'
import { useApiGet } from '../../hooks/useApiGet'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'

export default function StaffLoginPage() {
  const { t } = useI18n()
  usePageTitle('staffLogin')
  const { status, setStaff } = useStaffAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [demo] = useApiGet('/staff/demo-accounts')

  if (status === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
  if (status === 'staff') return <Navigate to="/staff" replace />

  async function submit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError(t('form.errors.required'))
      return
    }
    setError(null)
    setBusy(true)
    try {
      setStaff(await api.post('/staff/login', { username, password }))
      navigate('/staff', { replace: true })
    } catch (err) {
      setError(errorMessage(t, err))
      setBusy(false)
    }
  }

  return (
    <Container size="narrow" className="max-w-md py-10 sm:py-16">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary-700 text-white">
          <Icon name="clipboard" size={28} />
        </span>
        <h1 className="text-3xl">{t('staff.login.title')}</h1>
        <p className="mt-2 text-ink-muted">{t('staff.login.lead')}</p>
      </div>
      <Card padding="lg">
        <form onSubmit={submit} noValidate className="space-y-5">
          <TextField
            label={t('staff.login.username')}
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label={t('staff.login.password')}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" size="lg" fullWidth disabled={busy}>
            {busy ? t('common.loading') : t('staff.login.submit')}
          </Button>
        </form>
      </Card>

      {demo.state === 'ready' && demo.data.length > 0 && (
        <Card tone="muted" padding="md" className="mt-5">
          <h2 className="font-sans text-base font-semibold">{t('staff.login.demoTitle')}</h2>
          <p className="mb-3 text-sm text-ink-muted">{t('staff.login.demoBody')}</p>
          <ul className="grid gap-2">
            {demo.data.map((a) => (
              <li key={a.username}>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(a.username)
                    setPassword(a.password)
                  }}
                  className="flex min-h-11 w-full items-center justify-between rounded-control bg-surface px-3 text-left ring-1 ring-line hover:ring-primary-300"
                >
                  <span className="font-semibold">{t(`staff.roles.${a.role}`)}</span>
                  <span className="font-mono text-sm text-ink-muted">
                    {a.username} / {a.password}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/" className="font-semibold text-primary-700 underline underline-offset-4">
          {t('staff.login.notStaff')}
        </Link>
      </p>
    </Container>
  )
}
