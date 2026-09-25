import { useState } from 'react'
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { Link } from 'react-router'
import { useI18n } from '../../i18n/context.js'
import { routes } from '../../app/routes.js'
import { env } from '../../config/env.js'
import { authService } from '../../api/services/auth-service.js'
import { isApiError } from '../../api/client/api-error.js'
import { ErrorState } from '../../components/feedback/error-state.jsx'
import { collectFieldErrors } from '../../utils/zod-errors.js'
import { resetPasswordSchema } from './auth-schema.js'
import { AuthShell } from './auth-shell.jsx'

// Nueva contraseña (FR-010). En modo mock cualquier token es válido.
export function ResetPasswordPage() {
  const { t } = useI18n()
  const [values, setValues] = useState({ email: '', token: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const setField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.currentTarget.value }))
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
              label={t('auth.reset.token')}
              description={env.isMock ? t('auth.reset.tokenHint') : undefined}
              value={values.token}
              onChange={setField('token')}
              error={errorText('token')}
              required
            />
            <PasswordInput
              label={t('auth.reset.password')}
              value={values.password}
              onChange={setField('password')}
              error={errorText('password')}
              required
            />
            {serverError && <ErrorState error={serverError} onRetry={() => setServerError(null)} />}
            <Button type="submit" loading={busy}>
              {t('auth.reset.submit')}
            </Button>
          </Stack>
        </form>
      )}
    </AuthShell>
  )
}
