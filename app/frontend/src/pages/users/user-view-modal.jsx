import {
  Badge,
  Button,
  Group,
  Modal,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { getRoleColor, getRoleLabelKey } from '../../features/users/roles.js'

function Field({ label, children }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{children}</Text>
    </Stack>
  )
}

function getEffectivenessColor(ratio) {
  if (ratio >= 0.8) return 'green'
  if (ratio >= 0.6) return 'yellow'
  return 'red'
}

export function UserViewModal({ user, onClose }) {
  const { t, language } = useI18n()

  const formatDate = (value) => {
    if (!value) return '—'
    return new Date(`${value}T00:00:00`).toLocaleDateString(
      language === 'en' ? 'en-US' : 'es-AR',
      { year: 'numeric', month: 'short', day: 'numeric' },
    )
  }

  return (
    <Modal
      opened={Boolean(user)}
      onClose={onClose}
      title={t('users.view')}
      centered
      size="lg"
    >
      {user && (
        <Stack gap="lg">
          <Group gap="xs">
            <Badge variant="light" color={getRoleColor(user.role)}>
              {t(getRoleLabelKey(user.role))}
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Field label={t('users.form.name')}>{user.name}</Field>
            <Field label={t('users.form.email')}>{user.email}</Field>
            <Field label={t('users.table.generations')}>{user.generations}</Field>
            <Field label={t('users.table.points')}>{user.points}</Field>
            <Field label={t('users.table.lastGeneration')}>
              {formatDate(user.lastGeneration)}
            </Field>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                {t('users.table.effectiveness')}
              </Text>
              {user.effectiveness == null ? (
                <Text size="sm">—</Text>
              ) : (
                <Group gap="xs" wrap="nowrap" align="center">
                  <Progress
                    value={user.effectiveness * 100}
                    color={getEffectivenessColor(user.effectiveness)}
                    size="sm"
                    w={120}
                    radius="xl"
                  />
                  <Text size="sm">{Math.round(user.effectiveness * 100)}%</Text>
                </Group>
              )}
            </Stack>
          </SimpleGrid>

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={onClose}
              leftSection={<IconX size={16} />}
            >
              {t('users.close')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
