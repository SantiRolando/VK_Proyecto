import { isApiError } from '@api/client/api-error.js'
import { authService } from '@api/services/auth-service.js'
import { routes } from '@app/routes.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { env } from '@config/env.js'
import { resetPasswordSchema } from '@features/auth/auth-schema.js'
import { AuthShell } from '@features/auth/auth-shell.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

/*
  Nueva contraseña: email, código recibido por mail y clave nueva.
  En modo mock el código es siempre 123456.
*/
export function ResetPasswordPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState({
    email: searchParams.get('email') ?? '',
    code: '',
    newPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const setField = (field) => (event) => {
    // Se lee el valor en el momento del evento: React puede ejecutar el updater
    // más tarde, cuando `currentTarget` ya es null.
    const { value } = event.currentTarget
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const errorText = (field) => {
    if (!errors[field]) return null
    return t(`validation.${errors[field]}`)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const parsed = resetPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setBusy(true)
    setServerError(null)
    try {
      await authService.resetPassword(parsed.data)
      setDone(true)
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.reset.title')}>
      {done ? (
        <Stack gap="md">
          <Alert variant="light" color="teal">
            {t('auth.reset.success')}
          </Alert>
          <Button component={Link} to={routes.login}>
            {t('auth.reset.login')}
          </Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <TextInput
              label={t('auth.reset.email')}
              type="email"
              value={values.email}
              onChange={setField('email')}
              error={errorText('email')}
              required
            />
            <TextInput
              label={t('auth.reset.code')}
              description={env.isMock ? t('auth.otp.mockHint') : t('auth.reset.codeHint')}
              value={values.code}
              onChange={setField('code')}
              error={errorText('code')}
              inputMode="numeric"
              required
            />
            <PasswordInput
              label={t('auth.reset.password')}
              value={values.newPassword}
              onChange={setField('newPassword')}
              error={errorText('newPassword')}
              required
            />
            {serverError && (
              <ErrorState error={serverError} onRetry={() => setServerError(null)} />
            )}
            <Button type="submit" loading={busy}>
              {t('auth.reset.submit')}
            </Button>
          </Stack>
        </form>
      )}
    </AuthShell>
  )
}
