import { routes } from '@app/routes.js'
import { LanguageSwitch } from '@components/language-switch.jsx'
import { ProfileSelector } from '@components/profile-selector.jsx'
import { useAuth } from '@features/auth/auth-context.js'
import { useI18n } from '@i18n/context.js'
import { AppShell, Box, Button, Group, Menu, Text, UnstyledButton } from '@mantine/core'
import {
  IconClock,
  IconHistory,
  IconLogout,
  IconPackage,
  IconReceipt,
  IconRuler,
  IconUser,
} from '@tabler/icons-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'

const NAV_ITEMS = [
  { to: routes.fit(), labelKey: 'nav.fit', icon: IconRuler },
  { to: routes.catalog(), labelKey: 'nav.catalog', icon: IconPackage },
  { to: routes.accountHistory, labelKey: 'nav.history', icon: IconClock },
  { to: routes.accountProfiles, labelKey: 'nav.account', icon: IconUser },
]

function CustomerNavItem({ to, labelKey, icon: Icon, vertical = false }) {
  const { t } = useI18n()
  const location = useLocation()
  const active = location.pathname === to
  const color = active ? 'vikinga' : 'gray'
  const shade = active ? 6 : 7

  return (
    <UnstyledButton
      component={Link}
      to={to}
      className={
        vertical
          ? 'flex flex-1 flex-col items-center gap-0.5 py-2'
          : 'flex items-center gap-1.5 px-2 py-1'
      }
    >
      <Icon
        size={vertical ? 22 : 18}
        stroke={1.5}
        color={`var(--mantine-color-${color}-${shade})`}
      />
      <Text size={vertical ? 'xs' : 'sm'} c={`${color}.${shade}`} fw={active ? 600 : 400}>
        {t(labelKey)}
      </Text>
    </UnstyledButton>
  )
}

// Menú de cuenta del header: historial, compras, perfil y logout. Para
// invitados, botón de iniciar sesión (T048).
function AccountMenu() {
  const { t } = useI18n()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(routes.home)
  }

  if (!isAuthenticated) {
    return (
      <Button
        component={Link}
        to={routes.login}
        variant="subtle"
        size="sm"
        leftSection={<IconUser size={16} />}
      >
        {t('auth.login.title')}
      </Button>
    )
  }

  return (
    <Menu position="bottom-end" withinPortal shadow="sm">
      <Menu.Target>
        <Button variant="subtle" size="sm" leftSection={<IconUser size={16} />}>
          <span className="max-w-[6rem] truncate">{user?.name}</span>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconHistory size={16} />}
          onClick={() => navigate(routes.accountHistory)}
        >
          {t('nav.history')}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconReceipt size={16} />}
          onClick={() => navigate(routes.accountOrders)}
        >
          {t('nav.orders')}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconUser size={16} />}
          onClick={() => navigate(routes.accountProfiles)}
        >
          {t('nav.account')}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
        >
          {t('nav.logout')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

// Shell cliente mobile-first: header con logo, navegación e idioma y barra
// inferior de navegación en móvil (Medir · Catálogo · Historial · Cuenta);
// en desktop los mismos accesos pasan al header. El selector de perfil
// global se agrega en US5 (requiere la API de perfiles).
export function CustomerLayout() {
  const { t } = useI18n()

  return (
    <AppShell header={{ height: 60 }} footer={{ height: 60 }} padding="md" withBorder>
      <AppShell.Header>
        <Group
          h="100%"
          px={{ base: 'xs', sm: 'md' }}
          justify="space-between"
          gap="xs"
          wrap="nowrap"
        >
          <Group gap="md" wrap="nowrap">
            <Text component={Link} to={routes.home} fw={700}>
              {t('app.name')}
            </Text>
            <Group gap="xs" visibleFrom="sm" wrap="nowrap">
              {NAV_ITEMS.map((item) => (
                <CustomerNavItem key={item.labelKey} {...item} />
              ))}
            </Group>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Box visibleFrom="sm">
              <ProfileSelector />
            </Box>
            <AccountMenu />
            <LanguageSwitch />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Footer hiddenFrom="sm">
        <Group h="100%" gap={0} align="stretch" justify="space-around" wrap="nowrap">
          {NAV_ITEMS.map((item) => (
            <CustomerNavItem key={item.labelKey} {...item} vertical />
          ))}
        </Group>
      </AppShell.Footer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
