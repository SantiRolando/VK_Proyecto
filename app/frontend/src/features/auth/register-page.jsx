import { isApiError } from '@api/client/api-error.js'
import { routes, safeReturnTo } from '@app/routes.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { useAuth } from '@features/auth/auth-context.js'
import { registerSchema } from '@features/auth/auth-schema.js'
import { AuthShell } from '@features/auth/auth-shell.jsx'
import { useI18n } from '@i18n/context.js'
import { Anchor, Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

// Registro (FR-009): nombre, email, contraseña y WhatsApp obligatorio.
// Si el invitado trae generaciones previas, el controller las migra y crea
// el perfil por defecto (US2).
export function RegisterPage() {
  const { t } = useI18n()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))

  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    whatsappPhone: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
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
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setBusy(true)
    setServerError(null)
    try {
      await register(parsed.data)
      navigate(returnTo ?? routes.home)
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.register.title')}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            label={t('auth.register.name')}
            value={values.name}
            onChange={setField('name')}
            error={errorText('name')}
            required
          />
          <TextInput
            label={t('auth.register.email')}
            type="email"
            value={values.email}
            onChange={setField('email')}
            error={errorText('email')}
            required
          />
          <PasswordInput
            label={t('auth.register.password')}
            value={values.password}
            onChange={setField('password')}
            error={errorText('password')}
            required
          />
          <TextInput
            label={t('auth.register.phone')}
            description={t('auth.register.phoneHint')}
            value={values.whatsappPhone}
            onChange={setField('whatsappPhone')}
            error={errorText('whatsappPhone')}
            required
          />

          {serverError && (
            <ErrorState error={serverError} onRetry={() => setServerError(null)} />
          )}

          <Button type="submit" loading={busy}>
            {t('auth.register.submit')}
          </Button>
        </Stack>
      </form>

      <Stack gap="xs" mt="lg" ta="center">
        <Text size="sm" c="dimmed">
          {t('auth.register.haveAccount')}{' '}
          <Anchor
            component={Link}
            to={
              returnTo
                ? `${routes.login}?returnTo=${encodeURIComponent(returnTo)}`
                : routes.login
            }
          >
            {t('auth.login.title')}
          </Anchor>
        </Text>
      </Stack>
    </AuthShell>
  )
}
