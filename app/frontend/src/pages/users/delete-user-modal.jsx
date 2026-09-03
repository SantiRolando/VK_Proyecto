import { Button, Group, Modal, Text } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

export function DeleteUserModal({ user, onClose, onConfirm }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={Boolean(user)}
      onClose={onClose}
      title={t('users.delete.title')}
      centered
    >
      <Text size="sm">{t('users.delete.body')}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t('users.cancel')}
        </Button>
        <Button color="red" onClick={onConfirm}>
          {t('users.delete.confirm')}
        </Button>
      </Group>
    </Modal>
  )
}
