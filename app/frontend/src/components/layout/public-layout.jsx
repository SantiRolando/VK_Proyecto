import { routes } from '@app/routes.js'
import { LanguageSwitch } from '@components/language-switch.jsx'
import { ThemePicker } from '@components/theme-picker.jsx'
import { useI18n } from '@i18n/context.js'
import { AppShell, Group, Image, Text } from '@mantine/core'
import { Link, Outlet } from 'react-router'

// Layout público: header mínimo (logo + idioma) para las pantallas de autenticación.
export function PublicLayout() {
  const { t } = useI18n()

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Image src="/favicon.svg" alt="" w={24} h={24} radius="sm" />
            <Text component={Link} to={routes.home} fw={700}>
              {t('app.name')}
            </Text>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <ThemePicker />
            <LanguageSwitch />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
