import { routes } from '@app/routes.js'
import { LanguageSwitch } from '@components/language-switch.jsx'
import { useAuth } from '@features/auth/auth-context.js'
import { useI18n } from '@i18n/context.js'
import { AppShell, Burger, Button, Group, NavLink, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconArrowsRightLeft,
  IconLayoutDashboard,
  IconMessageCircle,
  IconPackage,
  IconReceipt,
  IconRuler,
  IconSettings,
  IconShirt,
  IconTicket,
  IconUsers,
} from '@tabler/icons-react'
import {
  Link,
  Outlet,
  NavLink as RouterNavLink,
  useLocation,
  useNavigate,
} from 'react-router'

const NAV_ITEMS = [
  { to: routes.admin, key: 'nav.dashboard', icon: IconLayoutDashboard },
  { to: routes.adminSales, key: 'nav.sales', icon: IconReceipt },
  { to: routes.adminInventory, key: 'nav.inventory', icon: IconPackage },
  { to: routes.adminMovements, key: 'nav.movements', icon: IconArrowsRightLeft },
  { to: routes.adminProducts, key: 'nav.products', icon: IconShirt },
  { to: routes.adminMissingSizes, key: 'nav.missingSizes', icon: IconRuler },
  { to: routes.adminComments, key: 'nav.comments', icon: IconMessageCircle },
  { to: routes.adminCoupons, key: 'nav.coupons', icon: IconTicket },
  { to: routes.adminSettings, key: 'nav.settings', icon: IconSettings },
  { to: routes.adminAssistant, key: 'nav.assistant', icon: IconUsers },
]

// Shell admin: navbar colapsable (Burger en móvil) con las secciones del
// panel, header con usuario/idioma y logout en el pie de la navbar.
export function AdminLayout() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [opened, { toggle, close }] = useDisclosure(false)

  const handleLogout = async () => {
    await logout()
    navigate(routes.home)
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={t('nav.menu')}
            />
            <Text component={Link} to={routes.admin} fw={700}>
              {t('app.name')} · {t('app.admin')}
            </Text>
          </Group>
          <LanguageSwitch />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow>
          <Stack gap="xs">
            {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                component={RouterNavLink}
                to={to}
                label={t(key)}
                leftSection={<Icon size={18} stroke={1.5} />}
                active={location.pathname === to}
                onClick={close}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Stack gap="xs" pt="sm">
            <Text size="sm" fw={600} truncate>
              {user?.name}
            </Text>
            <Button variant="light" size="sm" onClick={handleLogout}>
              {t('nav.logout')}
            </Button>
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
