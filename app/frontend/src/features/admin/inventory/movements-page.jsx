import { DateTime } from '@components/date-time.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { colorLabel } from '@constants/colors.js'
import { useMovements } from '@features/admin/inventory/hooks/use-inventory.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Container, Group, Select, Stack, Text } from '@mantine/core'
import { IconHistory } from '@tabler/icons-react'
import { useState } from 'react'

const ALL = 'all'
const REASONS = [
  'GoodsReceipt',
  'SizeExchange',
  'LossDefective',
  'ManualAdjustment',
  'SaleConfirmed',
]

const DIRECTION_COLORS = { Inbound: 'teal', Outbound: 'orange' }

function linesLabel(lines) {
  return lines
    .map((line) =>
      `${line.product?.model ?? ''} ${line.size?.code ?? ''} ${colorLabel(line.color)}`.trim(),
    )
    .join(' · ')
}

/*
  Auditoría de movimientos de stock: quién, cuándo, por qué y sobre
  qué variante. `SaleConfirmed` se registra solo al confirmar una venta.
*/
export function MovementsPage() {
  const { t } = useI18n()
  const [reason, setReason] = useState(ALL)

  const query = useMovements({
    reason: reason === ALL ? null : reason,
    pageSize: 100,
  })

  const items = query.data?.items ?? []

  const columns = [
    {
      key: 'createdAt',
      header: t('admin.movements.column.date'),
      render: (item) => (
        <Text size="sm">
          <DateTime
            value={item.createdAt}
            options={{ dateStyle: 'short', timeStyle: 'short' }}
          />
        </Text>
      ),
    },
    {
      key: 'reason',
      header: t('admin.movements.column.reason'),
      render: (item) => (
        <Badge variant="light" color="green">
          {t(`enums.transactionReason.${item.reason}`)}
        </Badge>
      ),
    },
    {
      key: 'direction',
      header: t('admin.movements.column.direction'),
      render: (item) => (
        <Badge variant="light" color={DIRECTION_COLORS[item.direction] ?? 'gray'}>
          {t(`enums.transactionDirection.${item.direction}`)}
        </Badge>
      ),
    },
    {
      key: 'lines',
      header: t('admin.movements.column.lines'),
      render: (item) => (
        <div>
          <Text size="sm">{linesLabel(item.lines)}</Text>
          <Text size="xs" c="dimmed">
            {item.lines.map((line) => `${line.quantity}× ${line.sku}`).join(', ')}
          </Text>
        </div>
      ),
    },
    {
      key: 'user',
      header: t('admin.movements.column.user'),
      render: (item) => <Text size="sm">{item.user?.name}</Text>,
    },
  ]

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.movements.title')}
        subtitle={t('admin.movements.subtitle')}
      />

      <Stack gap="md">
        <Group justify="space-between" gap="sm" wrap="wrap">
          <Select
            data={[
              { value: ALL, label: t('admin.sales.filter.all') },
              ...REASONS.map((value) => ({
                value,
                label: t(`enums.transactionReason.${value}`),
              })),
            ]}
            value={reason}
            onChange={(value) => setReason(value ?? ALL)}
            allowDeselect={false}
            w={220}
            aria-label={t('admin.movements.filter.reason')}
          />
          {query.data && (
            <Text size="sm" c="dimmed">
              {t('admin.movements.results', { count: query.data.meta.total })}
            </Text>
          )}
        </Group>

        <QueryBoundary
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
        >
          {query.data &&
            (items.length === 0 ? (
              <EmptyState icon={IconHistory} title={t('admin.movements.empty')} />
            ) : (
              <ResponsiveList
                data={items}
                getKey={(item) => item.id}
                columns={columns}
                minWidth={900}
                cardTitle={(item) => (
                  <div>
                    <Text fw={600} size="sm">
                      {t(`enums.transactionReason.${item.reason}`)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {item.user?.name}
                    </Text>
                  </div>
                )}
              />
            ))}
        </QueryBoundary>
      </Stack>
    </Container>
  )
}
