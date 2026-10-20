import { DateTime } from '@components/date-time.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { StockDirection } from '@constants/enums.js'
import {
  useTransaction,
  useVariantIndex,
} from '@features/admin/inventory/hooks/use-inventory.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Drawer, Group, Stack, Table, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

const DIRECTION_COLORS = {
  [StockDirection.Inbound]: 'teal',
  [StockDirection.Outbound]: 'orange',
}

/*
  Detalle de un movimiento: la cabecera y sus líneas, que el listado no trae. Las líneas llegan
  con el `variantId` solo, así que el SKU se resuelve contra el índice de variantes.
*/
export function MovementDetail({ transactionId, opened, onClose }) {
  const { t } = useI18n()
  const isDesktop = useMediaQuery('(min-width: 48em)', false)
  const detail = useTransaction(transactionId)
  const index = useVariantIndex()

  const transaction = detail.data

  function variantLabel(variantId) {
    const row = index.data?.get(variantId)
    if (!row) return t('admin.movements.detail.variant', { id: variantId })
    return [row.sku, row.product?.model, row.size?.code].filter(Boolean).join(' · ')
  }

  const body = (
    <QueryBoundary
      isLoading={detail.isPending}
      isError={detail.isError}
      error={detail.error}
      onRetry={detail.refetch}
    >
      {transaction && (
        <Stack gap="md">
          <Group gap="sm" wrap="wrap">
            <Badge variant="light" color="green">
              {t(`enums.transactionReason.${transaction.reason}`)}
            </Badge>
            <Badge
              variant="light"
              color={DIRECTION_COLORS[transaction.direction] ?? 'gray'}
            >
              {t(`enums.transactionDirection.${transaction.direction}`)}
            </Badge>
            <Text size="sm" c="dimmed">
              <DateTime
                value={transaction.createdAt}
                options={{ dateStyle: 'short', timeStyle: 'short' }}
              />
            </Text>
          </Group>

          <div>
            <Text size="xs" c="dimmed">
              {t('admin.movements.detail.user')}
            </Text>
            <Text size="sm">
              {t('admin.movements.detail.userId', { id: transaction.userId })}
            </Text>
          </div>

          <div>
            <Text size="xs" c="dimmed">
              {t('admin.movements.detail.note')}
            </Text>
            <Text size="sm">
              {transaction.note || t('admin.movements.detail.noNote')}
            </Text>
          </div>

          <Table.ScrollContainer minWidth={320}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('admin.inventory.column.sku')}</Table.Th>
                  <Table.Th>{t('admin.movements.detail.quantity')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {transaction.lines.map((line) => (
                  <Table.Tr key={line.id}>
                    <Table.Td>
                      <Text size="sm">{variantLabel(line.variantId)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{line.quantity}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      )}
    </QueryBoundary>
  )

  const wrapperProps = {
    opened,
    onClose,
    title: t('admin.movements.detail.title'),
    closeButtonProps: { 'aria-label': t('common.close') },
  }

  return isDesktop ? (
    <Drawer {...wrapperProps} position="right" size="lg">
      {body}
    </Drawer>
  ) : (
    <Drawer {...wrapperProps} position="bottom" size="md">
      {body}
    </Drawer>
  )
}
