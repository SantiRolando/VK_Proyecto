import { Button, Group, Modal, Text } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

export function DeleteTransactionModal({ item, onClose, onConfirm }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={Boolean(item)}
      onClose={onClose}
      title={t('transactions.delete.title')}
      centered
    >
      <Text size="sm">{t('transactions.delete.body')}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t('transactions.cancel')}
        </Button>
        <Button color="red" onClick={onConfirm}>
          {t('transactions.delete.confirm')}
        </Button>
      </Group>
    </Modal>
  )
}
