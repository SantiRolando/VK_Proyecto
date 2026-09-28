import { routes } from '@app/routes.js'
import { useAuth } from '@features/auth/auth-context.js'
import { useI18n } from '@i18n/context.js'
import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import {
  IconClock,
  IconLogin,
  IconRuler,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router'

// Home (FR-001): tres caminos — probar sin registrarse, crear cuenta o
// iniciar sesión. Con sesión activa, acceso directo a medir/historial/cuenta.
export function HomePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <Container size="xs" py="xl">
      <Stack gap="xl" className="text-center">
        <div>
          <Title order={1}>{t('home.title')}</Title>
          <Text c="dimmed" mt="xs">
            {t('home.subtitle')}
          </Text>
        </div>

        {isAuthenticated ? (
          <Stack gap="sm">
            <Button
              size="lg"
              leftSection={<IconRuler size={18} />}
              onClick={() => navigate(routes.fit())}
            >
              {t('home.logged')}
            </Button>
            <Button
              variant="light"
              leftSection={<IconClock size={18} />}
              onClick={() => navigate(routes.accountHistory)}
            >
              {t('home.history')}
            </Button>
            <Button
              variant="subtle"
              leftSection={<IconUser size={18} />}
              onClick={() => navigate(routes.accountProfiles)}
            >
              {t('home.account')}
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Button
              size="lg"
              leftSection={<IconRuler size={18} />}
              onClick={() => navigate(routes.fit())}
            >
              {t('home.guest')}
            </Button>
            <Text size="xs" c="dimmed">
              {t('home.guestHint')}
            </Text>

            <Group grow>
              <Button
                variant="light"
                leftSection={<IconUserPlus size={16} />}
                onClick={() => navigate(routes.register)}
              >
                {t('home.register')}
              </Button>
              <Button
                variant="outline"
                leftSection={<IconLogin size={16} />}
                onClick={() => navigate(routes.login)}
              >
                {t('home.login')}
              </Button>
            </Group>
            <Text size="xs" c="dimmed">
              {t('home.registerHint')}
            </Text>
          </Stack>
        )}

        <Paper withBorder radius="md" p="md">
          <Button variant="subtle" size="xs" onClick={() => navigate(routes.about)}>
            {t('home.about')}
          </Button>
        </Paper>
      </Stack>
    </Container>
  )
}
