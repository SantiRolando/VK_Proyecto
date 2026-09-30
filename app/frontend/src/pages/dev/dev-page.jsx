// Herramientas de demo (T034): solo se monta en modo mock.
// Permite restablecer la base de datos y entrar como un usuario sembrado
// sin pasar por el login.

import { setSession } from '@api/client/session.js'
import { devService } from '@api/services/dev-service.js'
import { routes } from '@app/routes.js'
import { useI18n } from '@i18n/context.js'
import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useState } from 'react'

const DEMO_USERS = [
  { id: 1, name: 'Admin', email: 'admin@vikinga.test' },
  { id: 2, name: 'Ana (cliente con datos)', email: 'ana@example.test' },
  { id: 3, name: 'Cliente vacío', email: 'nuevo@example.test' },
]

export function DevPage() {
  const { t } = useI18n()
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleReset = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await devService.reset()
      setMessage(t('dev.resetDone'))
    } catch {
      setError(t('dev.resetError'))
    } finally {
      setBusy(false)
    }
  }

  const handleLoginAs = async (userId) => {
    setError(null)
    try {
      const { user, token, refreshToken } = await devService.loginAs(userId)
      setSession(token, user, refreshToken)
      window.location.assign(routes.home)
    } catch {
      setError(t('dev.loginError'))
    }
  }

  return (
    <Container size="sm" py="xl">
      <Title order={1}>{t('dev.title')}</Title>
      <Text c="dimmed" mt="xs">
        {t('dev.subtitle')}
      </Text>

      <Paper withBorder radius="md" p="lg" mt="lg">
        <Stack gap="md">
          <Button onClick={handleReset} loading={busy}>
            {t('dev.reset')}
          </Button>

          {message && <Text c="teal">{message}</Text>}
          {error && <Text c="red">{error}</Text>}

          <Text fw={600}>{t('dev.users')}</Text>
          <Group gap="xs">
            {DEMO_USERS.map((user) => (
              <Button
                key={user.id}
                variant="outline"
                size="sm"
                onClick={() => handleLoginAs(user.id)}
              >
                {user.name}
              </Button>
            ))}
          </Group>
        </Stack>
      </Paper>
    </Container>
  )
}
