import { routes } from '@app/routes.js'
import { LanguageSwitch } from '@components/language-switch.jsx'
import { useI18n } from '@i18n/context.js'
import { AppShell, Group, Text } from '@mantine/core'
import { Link, Outlet } from 'react-router'

// Layout público: header mínimo (logo + idioma) para las pantallas de
// autenticación. La landing (`/` y `/about`) tiene su propio header.
export function PublicLayout() {
  const { t } = useI18n()

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Text component={Link} to={routes.home} fw={700}>
            {t('app.name')}
          </Text>
          <LanguageSwitch />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
