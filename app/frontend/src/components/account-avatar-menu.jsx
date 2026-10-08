import { routes } from '@app/routes.js'
import { useActiveProfile } from '@features/account/active-profile-context.js'
import { useResolvedProfile } from '@features/account/hooks/use-profiles.js'
import { useAuth } from '@features/auth/auth-context.js'
import { useIsAdmin } from '@features/auth/hooks/use-is-admin.js'
import { useI18n } from '@i18n/context.js'
import { Avatar, Badge, Button, Menu, Text, UnstyledButton } from '@mantine/core'
import {
  IconCheck,
  IconHistory,
  IconId,
  IconLayoutDashboard,
  IconLogout,
  IconReceipt,
  IconUserCog,
} from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router'

/** Iniciales para el avatar: "Ana Rodríguez" -> "AR". */
function initialsOf(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts.at(-1)[0]).toUpperCase()
}

/*
  Avatar de cuenta: quién sos, qué perfil está activo, y desde ahí la cuenta y el logout. Para
  invitados muestra un botón de ingreso.
*/
export function AccountAvatarMenu({ size = 'md' }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { setProfileId } = useActiveProfile()
  const { profile, profiles } = useResolvedProfile()
  const isAdmin = useIsAdmin()

  const handleLogout = async () => {
    await logout()
    navigate(routes.login)
  }

  if (!isAuthenticated) {
    return (
      <Button component={Link} to={routes.login} variant="subtle" size="sm">
        {t('auth.login.title')}
      </Button>
    )
  }

  return (
    <Menu position="bottom-end" width={260} withinPortal shadow="md">
      <Menu.Target>
        <UnstyledButton
          aria-label={t('account.menu.label')}
          className="flex items-center gap-2 rounded-full p-0.5"
        >
          <Avatar size={size} radius="xl" color="blue">
            {initialsOf(user?.name)}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {/* Identidad: quién está logueado. */}
        <Menu.Label>
          <Text size="sm" fw={600} truncate>
            {user?.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {user?.email}
          </Text>
        </Menu.Label>

        <Menu.Divider />

        {/* Perfil de medidas activo y cambio rápido. */}
        {profile && (
          <>
            <Menu.Label>{t('account.menu.profile')}</Menu.Label>
            {profiles.map((item) => (
              <Menu.Item
                key={item.id}
                leftSection={
                  item.id === profile.id ? (
                    <IconCheck size={16} />
                  ) : (
                    <IconUserCog size={16} />
                  )
                }
                rightSection={
                  item.isDefault ? (
                    <Badge variant="light" color="green" size="xs">
                      {t('account.profiles.default')}
                    </Badge>
                  ) : null
                }
                onClick={() => setProfileId(item.id)}
              >
                {item.name}
              </Menu.Item>
            ))}
            <Menu.Divider />
          </>
        )}

        <Menu.Item
          component={Link}
          to={routes.accountInfo}
          leftSection={<IconId size={16} />}
        >
          {t('account.info.title')}
        </Menu.Item>
        <Menu.Item
          component={Link}
          to={routes.accountHistory}
          leftSection={<IconHistory size={16} />}
        >
          {t('nav.history')}
        </Menu.Item>
        <Menu.Item
          component={Link}
          to={routes.accountOrders}
          leftSection={<IconReceipt size={16} />}
        >
          {t('nav.orders')}
        </Menu.Item>

        {isAdmin && (
          <>
            <Menu.Divider />
            <Menu.Item
              component={Link}
              to={routes.admin}
              leftSection={<IconLayoutDashboard size={16} />}
            >
              {t('nav.admin')}
            </Menu.Item>
          </>
        )}

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
