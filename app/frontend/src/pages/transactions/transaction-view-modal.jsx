import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { getCouponById, getCustomerById } from '../../mocks/transactions.js'
import {
  getDirectionColor,
  getDirectionLabelKey,
  getReasonColor,
  getReasonLabelKey,
} from '../../features/transactions/transactions-options.js'
import { getProductById, getProductLabel } from './product-helpers.js'

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

export function TransactionViewModal({ item, onClose }) {
  const { t, language } = useI18n()

  const formatDate = (value) => {
    if (!value) return '—'
    return new Date(`${value}T00:00:00`).toLocaleDateString(
      language === 'en' ? 'en-US' : 'es-AR',
      { year: 'numeric', month: 'short', day: 'numeric' },
    )
  }

  const isSale = item?.reason === 'venta'
  const customer = isSale ? getCustomerById(item.customerId) : null
  const coupon = isSale ? getCouponById(item.couponId) : null
  const totalUnits =
    item?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0

  return (
    <Modal
      opened={Boolean(item)}
      onClose={onClose}
      title={t('transactions.view')}
      centered
      size="lg"
    >
      {item && (
        <Stack gap="lg">
          <Group gap="xs">
            <Badge variant="light" color={getDirectionColor(item.direction)}>
              {t(getDirectionLabelKey(item.direction))}
            </Badge>
            <Badge variant="light" color={getReasonColor(item.reason)}>
              {t(getReasonLabelKey(item.reason))}
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Field label={t('transactions.table.id')}>#{item.id}</Field>
            <Field label={t('transactions.form.date')}>{formatDate(item.date)}</Field>
          </SimpleGrid>

          {isSale && (
            <>
              <Divider />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Field label={t('transactions.form.customer')}>
                  {customer?.name ?? '—'}
                </Field>
                <Field label={t('transactions.form.coupon')}>
                  {coupon?.code ?? '—'}
                </Field>
                <Field label={t('transactions.form.delivery')}>
                  {item.delivery
                    ? t('transactions.delivery.yes')
                    : t('transactions.delivery.no')}
                </Field>
                <Field label={t('transactions.form.address')}>
                  {item.address || '—'}
                </Field>
              </SimpleGrid>
            </>
          )}

          <Divider />

          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fw={600}>{t('transactions.view.lines.title')}</Text>
              <Badge variant="light" color="gray">
                {totalUnits} {t('transactions.table.units')}
              </Badge>
            </Group>
            <Table
              withTableBorder
              striped
              verticalSpacing="xs"
              horizontalSpacing="xs"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('transactions.form.product')}</Table.Th>
                  <Table.Th>{t('transactions.form.quantity')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {item.lines.map((line, index) => {
                  const product = getProductById(line.productId)
                  return (
                    <Table.Tr key={index}>
                      <Table.Td>
                        {getProductLabel(product, t) ?? `#${line.productId}`}
                      </Table.Td>
                      <Table.Td>{line.quantity}</Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Stack>

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={onClose}
              leftSection={<IconX size={16} />}
            >
              {t('transactions.close')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
