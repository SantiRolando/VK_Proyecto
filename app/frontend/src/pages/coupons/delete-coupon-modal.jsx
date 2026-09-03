import { Button, Group, Modal, Text } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

export function DeleteCouponModal({ coupon, onClose, onConfirm }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={Boolean(coupon)}
      onClose={onClose}
      title={t('coupons.delete.title')}
      centered
    >
      <Text size="sm">{t('coupons.delete.body')}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t('coupons.cancel')}
        </Button>
        <Button color="red" onClick={onConfirm}>
          {t('coupons.delete.confirm')}
        </Button>
      </Group>
    </Modal>
  )
}
