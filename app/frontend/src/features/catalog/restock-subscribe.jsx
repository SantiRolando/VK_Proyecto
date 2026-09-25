import { useState } from 'react'
import { Alert, Button, Stack, Text } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router'
import { useI18n } from '../../i18n/context.js'
import { routes } from '../../app/routes.js'
import { useAuth } from '../auth/auth-context.js'
import { ErrorState } from '../../components/feedback/error-state.jsx'
import { isApiError } from '../../api/client/api-error.js'
import { useSubscribeRestock } from './hooks/use-subscribe-restock.js'

// Suscripción al aviso de reposición (US3). Requiere cuenta: un invitado ve
// la invitación a ingresar/registrarse y vuelve a este punto.
export function RestockSubscribe({ line, sizeId }) {
  const { t } = useI18n()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const subscribe = useSubscribeRestock()
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const returnTo = encodeURIComponent(location.pathname + location.search)

  if (!isAuthenticated) {
    return (
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          {t('catalog.subscribeLogin')}
        </Text>
        <Button
          variant="light"
          onClick={() => navigate(`${routes.login}?returnTo=${returnTo}`)}
        >
          {t('auth.login.title')}
        </Button>
      </Stack>
    )
  }

  if (done) {
    return (
      <Alert variant="light" color="teal">
        {t('catalog.subscribeDone')}
      </Alert>
    )
  }

  const handleSubscribe = async () => {
    setError(null)
    try {
      await subscribe.mutateAsync({ line, sizeId })
      setDone(true)
    } catch (subscribeError) {
      setError(isApiError(subscribeError) ? subscribeError : null)
    }
  }

  return (
    <Stack gap="xs">
      <Button onClick={handleSubscribe} loading={subscribe.isPending}>
        {t('catalog.subscribe')}
      </Button>
      {error && <ErrorState error={error} onRetry={handleSubscribe} />}
    </Stack>
  )
}
