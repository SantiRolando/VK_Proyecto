import {
  Badge,
  Button,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'

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

function formatCouponValue(coupon) {
  return coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`
}

export function CouponViewModal({ coupon, onClose }) {
  const { t, language } = useI18n()

  const formatDate = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(
      language === 'en' ? 'en-US' : 'es-AR',
      { year: 'numeric', month: 'short', day: 'numeric' },
    )

  return (
    <Modal
      opened={Boolean(coupon)}
      onClose={onClose}
      title={t('coupons.view')}
      centered
      size="lg"
    >
      {coupon && (
        <Stack gap="lg">
          <Group gap="xs">
            <Badge
              variant="light"
              color={coupon.type === 'percentage' ? 'blue' : 'teal'}
            >
              {t(
                coupon.type === 'percentage'
                  ? 'coupons.type.percentage'
                  : 'coupons.type.fixed',
              )}
            </Badge>
            <Badge variant="light" color={coupon.active ? 'green' : 'gray'}>
              {t(
                coupon.active
                  ? 'coupons.status.active'
                  : 'coupons.status.inactive',
              )}
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Field label={t('coupons.table.code')}>{coupon.code}</Field>
            <Field label={t('coupons.table.value')}>
              {formatCouponValue(coupon)}
            </Field>
            <Field label={t('coupons.table.uses')}>
              {coupon.used}/{coupon.maxUses}
            </Field>
            <Field label={t('coupons.form.startDate')}>
              {formatDate(coupon.startDate)}
            </Field>
            <Field label={t('coupons.form.endDate')}>
              {formatDate(coupon.endDate)}
            </Field>
          </SimpleGrid>

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={onClose}
              leftSection={<IconX size={16} />}
            >
              {t('coupons.close')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
