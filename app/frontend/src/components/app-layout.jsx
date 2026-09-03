import { AppShell, Burger, Group, NavLink, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconReportAnalytics,
  IconRuler,
  IconTicket,
  IconUsers,
} from '@tabler/icons-react'
import {
  Link,
  NavLink as RouterNavLink,
  Outlet,
  useLocation,
} from 'react-router'
import { useI18n } from '../i18n/context.js'
import { LanguageSwitch } from './language-switch.jsx'

const NAV_ITEMS = [
  { to: '/generator', key: 'nav.generator', icon: IconRuler },
  { to: '/reports', key: 'reports.title', icon: IconReportAnalytics },
  { to: '/users', key: 'nav.users', icon: IconUsers },
  { to: '/coupons', key: 'nav.coupons', icon: IconTicket },
]

export function AppLayout() {
  const { t } = useI18n()
  const location = useLocation()
  const [opened, { toggle, close }] = useDisclosure(false)

  const items = NAV_ITEMS.map(({ to, key, icon: Icon }) => (
    <NavLink
      key={to}
      component={RouterNavLink}
      to={to}
      label={t(key)}
      leftSection={<Icon size={18} stroke={1.5} />}
      active={location.pathname === to}
      onClick={close}
    />
  ))

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header bg="black">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="white"
              aria-label={t('nav.menu')}
            />
            <Text component={Link} to="/" c="white" fw={700}>
              {t('app.name')}
            </Text>
          </Group>
          <LanguageSwitch />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap="xs">{items}</Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
