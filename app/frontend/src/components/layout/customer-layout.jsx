import { AppShell, Group, Text, UnstyledButton } from '@mantine/core'
import {
  IconClock,
  IconPackage,
  IconRuler,
  IconUser,
} from '@tabler/icons-react'
import { Link, Outlet, useLocation } from 'react-router'
import { useI18n } from '../../i18n/context.js'
import { LanguageSwitch } from '../language-switch.jsx'
import { routes } from '../../app/routes.js'

const NAV_ITEMS = [
  { to: routes.fit(), key: 'nav.fit', icon: IconRuler },
  { to: routes.catalog(), key: 'nav.catalog', icon: IconPackage },
  { to: routes.accountHistory, key: 'nav.history', icon: IconClock },
  { to: routes.accountProfiles, key: 'nav.account', icon: IconUser },
]

function CustomerNavItem({ to, labelKey, icon: Icon, vertical = false }) {
  const { t } = useI18n()
  const location = useLocation()
  const active = location.pathname === to
  const color = active ? 'vikinga' : 'gray.6'

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
      <Icon size={vertical ? 22 : 18} stroke={1.5} color={`var(--mantine-color-${color}-6)`} />
      <Text size={vertical ? 'xs' : 'sm'} c={color} fw={active ? 600 : 400}>
        {t(labelKey)}
      </Text>
    </UnstyledButton>
  )
}

// Shell cliente mobile-first: header con logo + idioma y barra inferior de
// navegación en móvil (Medir · Catálogo · Historial · Cuenta); en desktop
// los mismos accesos pasan al header. El selector de perfil global se
// agrega en US5 (requiere la API de perfiles).
export function CustomerLayout() {
  const { t } = useI18n()

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      padding="md"
      withBorder
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Text component={Link} to={routes.home} fw={700}>
              {t('app.name')}
            </Text>
            <Group gap="xs" visibleFrom="sm" wrap="nowrap">
              {NAV_ITEMS.map((item) => (
                <CustomerNavItem key={item.key} {...item} />
              ))}
            </Group>
          </Group>
          <LanguageSwitch />
        </Group>
      </AppShell.Header>

      <AppShell.Footer hiddenFrom="sm">
        <Group h="100%" gap={0} align="stretch" justify="space-around" wrap="nowrap">
          {NAV_ITEMS.map((item) => (
            <CustomerNavItem key={item.key} {...item} vertical />
          ))}
        </Group>
      </AppShell.Footer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
