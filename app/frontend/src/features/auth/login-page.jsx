import { isApiError } from '@api/client/api-error.js'
import { routes, safeReturnTo } from '@app/routes.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { env } from '@config/env.js'
import { useAuth } from '@features/auth/auth-context.js'
import { loginSchema } from '@features/auth/auth-schema.js'
import { AuthShell } from '@features/auth/auth-shell.jsx'
import { useI18n } from '@i18n/context.js'
import {
  Anchor,
  Button,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconLogin } from '@tabler/icons-react'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

// Credenciales demo: las de la base mock, o las del perfil `demo` del backend
// en modo híbrido. En modo `http` no se muestran.
const DEMO_CREDENTIALS = env.isMock
  ? [
      { email: 'admin@vikinga.test', password: 'admin123' },
      { email: 'ana@example.test', password: 'cliente123' },
      { email: 'nuevo@example.test', password: 'cliente123' },
    ]
  : [
      { email: 'admin@vkfit.demo', password: 'Demo12345' },
      { email: 'ana.perez@vkfit.demo', password: 'Demo12345' },
    ]

/*
  Login unificado de clientes y admins: según el rol se redirige a
  `/admin` o al `returnTo`/home.
*/
export function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))

  const [values, setValues] = useState({ email: '', password: '' })
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
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setBusy(true)
    setServerError(null)
    try {
      const user = await login(parsed.data.email, parsed.data.password)
      navigate(user.type === 'Admin' ? routes.admin : (returnTo ?? routes.account))
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.login.title')}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            label={t('auth.login.email')}
            type="email"
            value={values.email}
            onChange={setField('email')}
            error={errorText('email')}
            required
          />
          <PasswordInput
            label={t('auth.login.password')}
            value={values.password}
            onChange={setField('password')}
            error={errorText('password')}
            required
          />

          {serverError && (
            <ErrorState error={serverError} onRetry={() => setServerError(null)} />
          )}

          <Button type="submit" loading={busy} rightSection={<IconLogin size={18} />}>
            {t('auth.login.submit')}
          </Button>
        </Stack>
      </form>

      <Stack gap="xs" mt="lg" ta="center">
        <Anchor component={Link} to={routes.loginOtp} size="sm">
          {t('auth.login.otp')}
        </Anchor>
        <Anchor component={Link} to={routes.forgotPassword} size="sm">
          {t('auth.login.forgot')}
        </Anchor>
        <Divider />
        <Text size="sm" c="dimmed">
          {t('auth.login.noAccount')}{' '}
          <Anchor
            component={Link}
            to={
              returnTo
                ? `${routes.register}?returnTo=${encodeURIComponent(returnTo)}`
                : routes.register
            }
          >
            {t('auth.register.title')}
          </Anchor>
        </Text>
      </Stack>

      {env.showDevHints && (
        <>
          <Divider mt="lg" />
          <Stack gap="xs" mt="md">
            <Text size="sm" fw={600}>
              {t('auth.login.demo')}
            </Text>
            {DEMO_CREDENTIALS.map((credential) => (
              <Group
                key={credential.email}
                justify="space-between"
                gap="xs"
                wrap="nowrap"
              >
                <div>
                  <Text size="xs" fw={600}>
                    {credential.email}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {credential.password}
                  </Text>
                </div>
                <Button
                  variant="light"
                  size="xs"
                  type="button"
                  onClick={() =>
                    setValues({ email: credential.email, password: credential.password })
                  }
                >
                  {t('auth.login.demoUse')}
                </Button>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </AuthShell>
  )
}
