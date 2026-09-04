import { Button, Group, Modal, Text } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

export function DeleteStockModal({ item, onClose, onConfirm }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={Boolean(item)}
      onClose={onClose}
      title={t('stock.delete.title')}
      centered
    >
      <Text size="sm">{t('stock.delete.body')}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t('stock.cancel')}
        </Button>
        <Button color="red" onClick={onConfirm}>
          {t('stock.delete.confirm')}
        </Button>
      </Group>
    </Modal>
  )
}
