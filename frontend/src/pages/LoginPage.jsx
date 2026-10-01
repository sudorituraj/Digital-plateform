import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { OtpForm, PasswordLoginForm } from '../components/booking/OtpForm'
import { Card, Container, Icon, StateMessage, Tabs } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

/** Only allow redirects back into this site (never to another domain). */
function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/my-appointments'
}

export default function LoginPage() {
  const { t } = useI18n()
  usePageTitle('login')
  const { status } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [mode, setMode] = useState('otp')

  if (status === 'loading') return <StateMessage kind="loading" title={t('common.loading')} className="py-24" />
  if (status === 'patient') return <Navigate to={next} replace />

  return (
    <Container size="narrow" className="max-w-lg py-10 sm:py-16">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary-700 text-white">
          <Icon name="user" size={28} />
        </span>
        <h1 className="text-3xl sm:text-4xl">{t('auth.title')}</h1>
        <p className="mt-2 text-ink-muted">{t('auth.lead')}</p>
      </div>
      <Card padding="lg">
        <Tabs
          tabs={[
            { id: 'otp', label: t('auth.tabOtp') },
            { id: 'password', label: t('auth.tabPassword') },
          ]}
          value={mode}
          onChange={setMode}
          label={t('auth.title')}
        />
        <div className="mt-6" role="tabpanel" id={`${mode}-panel`} aria-labelledby={`${mode}-tab`}>
          {mode === 'otp' ? (
            <OtpForm onSuccess={() => navigate(next, { replace: true })} />
          ) : (
            <PasswordLoginForm onSuccess={() => navigate(next, { replace: true })} />
          )}
        </div>
        <div className="mt-6 text-center text-sm">
          <p className="text-ink-muted">{t('auth.newAccount')}</p>
          <p className="mt-1">
            {mode === 'otp' ? (
              <>
                {t('auth.alreadyHaveAccount')} <button onClick={() => setMode('password')} className="font-semibold text-primary-700 underline underline-offset-4">{t('auth.loginWithPassword')}</button>
              </>
            ) : (
              <>
                {t('auth.noPassword')} <button onClick={() => setMode('otp')} className="font-semibold text-primary-700 underline underline-offset-4">{t('auth.useOtpInstead')}</button>
              </>
            )}
          </p>
        </div>
      </Card>
    </Container>
  )
}