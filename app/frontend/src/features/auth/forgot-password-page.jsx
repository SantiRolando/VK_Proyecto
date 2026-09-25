import { useState } from 'react'
import { Alert, Anchor, Button, Stack, TextInput } from '@mantine/core'
import { Link } from 'react-router'
import { useI18n } from '../../i18n/context.js'
import { routes } from '../../app/routes.js'
import { authService } from '../../api/services/auth-service.js'
import { isApiError } from '../../api/client/api-error.js'
import { ErrorState } from '../../components/feedback/error-state.jsx'
import { collectFieldErrors } from '../../utils/zod-errors.js'
import { forgotPasswordSchema } from './auth-schema.js'
import { AuthShell } from './auth-shell.jsx'

// Recuperación de contraseña (FR-010). En modo mock no se envía nada: el
// reset se completa en `/reset-password` con cualquier token.
export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setBusy(true)
    setServerError(null)
    try {
      await authService.forgotPassword({ email: parsed.data.email })
      setSent(true)
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.forgot.title')}>
      {sent ? (
        <Stack gap="md">
          <Alert variant="light" color="teal">
            {t('auth.forgot.sent')}
          </Alert>
          <Anchor component={Link} to={routes.login} size="sm">
            {t('auth.forgot.back')}
          </Anchor>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <TextInput
              label={t('auth.forgot.email')}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.currentTarget.value)
                setErrors((current) => ({ ...current, email: undefined }))
              }}
              error={errors.email ? t(`validation.${errors.email}`) : null}
              required
            />
            {serverError && <ErrorState error={serverError} onRetry={() => setServerError(null)} />}
            <Button type="submit" loading={busy}>
              {t('auth.forgot.submit')}
            </Button>
          </Stack>
        </form>
      )}
    </AuthShell>
  )
}
