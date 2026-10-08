import { routes } from '@app/routes.js'
import { AccountAvatarMenu } from '@components/account-avatar-menu.jsx'
import { LanguageSwitch } from '@components/language-switch.jsx'
import { ThemePicker } from '@components/theme-picker.jsx'
import { CUSTOMER_NAV_ITEMS, matchNavItem, PANEL_NAV_ITEMS } from '@config/navigation.js'
import { useAuth } from '@features/auth/auth-context.js'
import { useI18n } from '@i18n/context.js'
import {
  AppShell,
  Box,
  Burger,
  Divider,
  Drawer,
  Group,
  Image,
  NavLink,
  Stack,
  Text,
  useMantineColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link, Outlet, useLocation } from 'react-router'

const LOGO = '/favicon.svg'
const LOGO_SIZE = 24
const SIDEBAR_WIDTH = 260

// Shell único de la app autenticada (bug squash sesión #1).
//
// El menú dejó de vivir en el header: ahora es una barra lateral SIEMPRE visible
// en desktop, y un drawer colapsable en móvil. Antes había dos layouts distintos
// (cliente y panel) con navegaciones y estéticas diferentes; con uno solo, todas
// las opciones están a un clic en cualquier pantalla y no se desincronizan.
//
// El header queda solo con marca, perfil, tema, cuenta e idioma.
export function AppShellLayout() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { colorScheme } = useMantineColorScheme()
  const [opened, { open, close }] = useDisclosure(false)

  const isAdmin = user?.type === 'Admin'
  const location = useLocation()
  // El Drawer se renderiza en un portal: no siempre hereda
  // `data-mantine-color-scheme` del root, así que se pasa explícito.
  const resolvedScheme = colorScheme === 'auto' ? undefined : colorScheme

  // Un solo ítem resaltado: entre los que matchean por prefijo gana el más
  // específico. Se evalúan juntos para poder compararlos.
  const allItems = isAdmin
    ? [...CUSTOMER_NAV_ITEMS, ...PANEL_NAV_ITEMS]
    : CUSTOMER_NAV_ITEMS
  const activeTo = matchNavItem(location.pathname, allItems)

  const renderNavLink = ({ to, labelKey, icon: Icon }) => (
    <NavLink
      key={to}
      component={Link}
      to={to}
      label={t(labelKey)}
      leftSection={<Icon size={18} stroke={1.5} />}
      active={to === activeTo}
      onClick={close}
    />
  )

  // Cuerpo de la navegación: se reusa en la barra lateral fija y en el drawer.
  const navigation = (
    <>
      <Stack gap={2}>{CUSTOMER_NAV_ITEMS.map(renderNavLink)}</Stack>

      {isAdmin && (
        <>
          {/*
            El estilo del label va en el nodo y no en un `labelProps`: esa prop no existe en
            el Divider de esta versión de Mantine, cae al DOM y React la reporta en consola.
          */}
          <Divider
            my="md"
            labelPosition="left"
            label={
              <Text component="span" size="xs" fw={600}>
                {t('nav.panelSection')}
              </Text>
            }
          />
          <Stack gap={2}>{PANEL_NAV_ITEMS.map(renderNavLink)}</Stack>
        </>
      )}
    </>
  )

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: SIDEBAR_WIDTH,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      withBorder
    >
      <AppShell.Header>
        {/*
          En un teléfono no entra todo: el ancho útil son 320 px y la marca, el selector de
          tema y el de idioma sumaban más que eso, así que el nombre se partía en dos líneas
          dentro de un header de 60 px y en las pantallas más angostas la fila desbordaba.
          Se recorta el padding, el apodo de sección se muestra recién desde `sm` y el tema
          baja al drawer, donde ya estaba duplicado. La marca trunca en vez de envolverse:
          si algún día no entra, termina en puntos suspensivos y no rompe el alto.
        */}
        <Group
          h="100%"
          px={{ base: 'sm', sm: 'md' }}
          gap="sm"
          justify="space-between"
          wrap="nowrap"
        >
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Burger
              opened={opened}
              onClick={open}
              hiddenFrom="sm"
              size="sm"
              aria-label={t('nav.menu')}
            />
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <Image src={LOGO} alt="" w={LOGO_SIZE} h={LOGO_SIZE} radius="sm" />
              <Text component={Link} to={routes.home} fw={700} truncate>
                {t('app.name')}
                {isAdmin && (
                  <Box component="span" visibleFrom="sm">
                    {` · ${t('app.admin')}`}
                  </Box>
                )}
              </Text>
            </Group>
          </Group>
          <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* El tema también se elige desde el drawer en móvil. */}
            <Box visibleFrom="sm">
              <ThemePicker />
            </Box>
            <LanguageSwitch />
            {/* En desktop la cuenta vive en el header, como el botón de cuenta de
                Google. En móvil baja al drawer (ver más abajo). */}
            <Box visibleFrom="sm">
              <AccountAvatarMenu />
            </Box>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow style={{ overflowY: 'auto' }}>
          {navigation}
        </AppShell.Section>

        {isAdmin && (
          <AppShell.Section>
            <Stack gap="xs" pt="sm">
              <Text size="sm" fw={600} truncate>
                {user?.name}
              </Text>
            </Stack>
          </AppShell.Section>
        )}
      </AppShell.Navbar>

      {/* Drawer de móvil: mismo contenido que la barra lateral, con la cabecera
          de marca y el selector de tema fijos arriba. */}
      <Drawer
        opened={opened}
        onClose={close}
        hiddenFrom="sm"
        size="xs"
        withCloseButton={false}
        data-mantine-color-scheme={resolvedScheme}
        styles={{
          body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' },
        }}
      >
        {/* Cuenta, fija arriba del drawer y siempre alcanzable: en móvil el
            avatar hace de acceso a la cuenta como en desktop. */}
        <Group
          justify="space-between"
          wrap="nowrap"
          px="md"
          py="sm"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <Group gap="xs" wrap="nowrap">
            <Image src={LOGO} alt="" w={LOGO_SIZE} h={LOGO_SIZE} radius="sm" />
            <Text fw={700}>{t('app.name')}</Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ThemePicker />
            <AccountAvatarMenu />
          </Group>
        </Group>

        <Box px="sm" py="md" style={{ flex: 1, overflowY: 'auto' }}>
          {navigation}
        </Box>
      </Drawer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
