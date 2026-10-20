import { DateTime } from '@components/date-time.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Pagination } from '@components/pagination.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { SurfaceCard } from '@components/surface-card.jsx'
import { StockDirection, StockReason } from '@constants/enums.js'
import { useMovements } from '@features/admin/inventory/hooks/use-inventory.js'
import { MovementDetail } from '@features/admin/inventory/movement-detail.jsx'
import { usePagination } from '@hooks/use-pagination.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Group, Select, Stack, Text } from '@mantine/core'
import { IconHistory } from '@tabler/icons-react'
import { useState } from 'react'

const ALL = 'all'
const REASONS = Object.values(StockReason)

const DIRECTION_COLORS = {
  [StockDirection.Inbound]: 'teal',
  [StockDirection.Outbound]: 'orange',
}

/*
  Auditoría de movimientos de stock: cuándo, por qué y en qué dirección. Las líneas se piden al
  abrir el detalle, porque el listado no las trae.
*/
export function MovementsBody() {
  const { t } = useI18n()
  const [reason, setReason] = useState(ALL)
  const [openId, setOpenId] = useState(null)
  const { page, pageSize, setPage, setPageSize, resetPage } = usePagination()

  const query = useMovements({
    reason: reason === ALL ? null : reason,
    page,
    pageSize,
  })

  const items = query.data?.items ?? []
  const total = query.data?.meta?.total ?? 0

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
      key: 'note',
      header: t('admin.movements.detail.note'),
      render: (item) => (
        <Text size="sm" c={item.note ? undefined : 'dimmed'}>
          {item.note || t('admin.movements.detail.noNote')}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item) => (
        <Button variant="light" size="compact-sm" onClick={() => setOpenId(item.id)}>
          {t('admin.movements.action.detail')}
        </Button>
      ),
    },
  ]

  return (
    <SurfaceCard
      titleSectionVariant="top"
      icon={IconHistory}
      title={t('admin.movements.title')}
      description={t('admin.movements.subtitle')}
    >
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
            onChange={(value) => {
              setReason(value ?? ALL)
              resetPage()
            }}
            allowDeselect={false}
            w={220}
            aria-label={t('admin.movements.filter.reason')}
          />
          {query.data && (
            <Text size="sm" c="dimmed">
              {t('admin.movements.results', { count: total })}
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
                      <DateTime
                        value={item.createdAt}
                        options={{ dateStyle: 'short', timeStyle: 'short' }}
                      />
                    </Text>
                  </div>
                )}
              />
            ))}
        </QueryBoundary>

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        <MovementDetail
          transactionId={openId}
          opened={openId !== null}
          onClose={() => setOpenId(null)}
        />
      </Stack>
    </SurfaceCard>
  )
}
