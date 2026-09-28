import { routes } from '@app/routes.js'
import { useActiveProfile } from '@features/account/active-profile-context.js'
import { useResolvedProfile } from '@features/account/hooks/use-profiles.js'
import { useAuth } from '@features/auth/auth-context.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Menu } from '@mantine/core'
import { IconUserCog } from '@tabler/icons-react'
import { useNavigate } from 'react-router'

// Selector de perfil activo (US5/T073): visible para clientes logueados.
// Cambiar de perfil re-precarga el formulario de medición y separa el historial
// (las generaciones se guardan con `profileId`).
export function ProfileSelector() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { setProfileId } = useActiveProfile()
  const { profile, profiles } = useResolvedProfile()

  if (!isAuthenticated || !profile) return null

  return (
    <Menu position="bottom-end" withinPortal shadow="sm">
      <Menu.Target>
        <Button
          variant="light"
          size="compact-md"
          leftSection={<IconUserCog size={14} />}
          maw={160}
        >
          <span className="max-w-[7rem] truncate">{profile.name}</span>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {profiles.map((item) => (
          <Menu.Item
            key={item.id}
            onClick={() => setProfileId(item.id)}
            rightSection={
              item.isDefault ? (
                <Badge variant="light" color="vikinga" size="xs">
                  {t('account.profiles.default')}
                </Badge>
              ) : null
            }
          >
            {item.name}
          </Menu.Item>
        ))}

        <Menu.Divider />
        <Menu.Item onClick={() => navigate(routes.accountProfiles)}>
          {t('account.profiles.manage')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
