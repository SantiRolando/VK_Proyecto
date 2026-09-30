import { isApiError } from '@api/client/api-error.js'
import { authService } from '@api/services/auth-service.js'
import { routes, safeReturnTo } from '@app/routes.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { env } from '@config/env.js'
import { useAuth } from '@features/auth/auth-context.js'
import { otpRequestSchema, otpVerifySchema } from '@features/auth/auth-schema.js'
import { AuthShell } from '@features/auth/auth-shell.jsx'
import { useI18n } from '@i18n/context.js'
import { Anchor, Button, Stack, Text, TextInput } from '@mantine/core'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

// Ingreso por código de un solo uso (FR-010): pedir código al email y canjearlo
// por una sesión. En modo mock el código es siempre 123456; contra el backend
// (fuera de producción) el código queda en el log del servidor.
export function OtpPage() {
  const { t } = useI18n()
  const { adoptSession } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))

  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleRequest = async (event) => {
    event.preventDefault()
    const parsed = otpRequestSchema.safeParse({ email })
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setBusy(true)
    setServerError(null)
    try {
      await authService.requestOtp({ email: parsed.data.email })
      setStep('code')
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    const parsed = otpVerifySchema.safeParse({ email, code })
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setBusy(true)
    setServerError(null)
    try {
      const auth = await authService.loginWithOtp(parsed.data)
      adoptSession(auth)
      navigate(auth.user.type === 'Admin' ? routes.admin : (returnTo ?? routes.account))
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.otp.title')}>
      {step === 'email' ? (
        <form onSubmit={handleRequest} noValidate>
          <Stack gap="md">
            <TextInput
              label={t('auth.otp.email')}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.currentTarget.value)
                setErrors((current) => ({ ...current, email: undefined }))
              }}
              error={errors.email ? t(`validation.${errors.email}`) : null}
              required
            />
            {serverError && (
              <ErrorState error={serverError} onRetry={() => setServerError(null)} />
            )}
            <Button type="submit" loading={busy}>
              {t('auth.otp.request')}
            </Button>
          </Stack>
        </form>
      ) : (
        <form onSubmit={handleVerify} noValidate>
          <Stack gap="md">
            <Text c="dimmed" size="sm" style={{ wordBreak: 'break-word' }}>
              {t('auth.otp.sent')} <b>{email}</b>
            </Text>
            <TextInput
              label={t('auth.otp.code')}
              value={code}
              onChange={(event) => {
                setCode(event.currentTarget.value)
                setErrors((current) => ({ ...current, code: undefined }))
              }}
              error={errors.code ? t(`validation.${errors.code}`) : null}
              required
            />
            {env.showDevHints && (
              <Text size="xs" c="dimmed">
                {t(env.isMock ? 'auth.otp.mockHint' : 'auth.otp.devHint')}
              </Text>
            )}
            {serverError && (
              <ErrorState error={serverError} onRetry={() => setServerError(null)} />
            )}
            <Button type="submit" loading={busy}>
              {t('auth.otp.verify')}
            </Button>
            <Anchor
              component="button"
              type="button"
              size="sm"
              onClick={() => setStep('email')}
            >
              {t('auth.otp.changeEmail')}
            </Anchor>
          </Stack>
        </form>
      )}

      <Stack gap="xs" mt="lg" ta="center">
        <Anchor component={Link} to={routes.login} size="sm">
          {t('auth.otp.back')}
        </Anchor>
      </Stack>
    </AuthShell>
  )
}
