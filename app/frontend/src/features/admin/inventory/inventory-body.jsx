import { ColorDot } from '@components/color-dot.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Pagination } from '@components/pagination.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { AdjustModal } from '@features/admin/inventory/adjust-modal.jsx'
import { useInventory } from '@features/admin/inventory/hooks/use-inventory.js'
import { usePagination } from '@hooks/use-pagination.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Group, Stack, Switch, Text } from '@mantine/core'
import { IconAlertTriangle, IconBox, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

/*
  Inventario por variante: físico / reservado / disponible, alerta de stock crítico y ajuste
  auditado con motivo obligatorio.
*/
export function InventoryBody() {
  const { t } = useI18n()
  const [lowStock, setLowStock] = useState(false)
  const [adjusting, setAdjusting] = useState(null)
  const { page, pageSize, setPage, setPageSize, resetPage } = usePagination()

  const query = useInventory({
    onlyBelowMin: lowStock ? true : null,
    page,
    pageSize,
  })

  const items = query.data?.items ?? []
  const total = query.data?.meta?.total ?? 0

  const columns = [
    {
      key: 'sku',
      header: t('admin.inventory.column.sku'),
      render: (item) => (
        <div>
          <Text fw={600} size="sm">
            {item.sku}
          </Text>
          <Text size="xs" c="dimmed">
            {item.product?.model} · {item.size?.code}
          </Text>
        </div>
      ),
    },
    {
      key: 'color',
      header: t('admin.inventory.column.color'),
      render: (item) => <ColorDot color={item.color} />,
    },
    {
      key: 'physical',
      header: t('admin.inventory.physical'),
      render: (item) => <Text size="sm">{item.quantity}</Text>,
    },
    {
      key: 'reserved',
      header: t('admin.inventory.reserved'),
      render: (item) => <Text size="sm">{item.reserved}</Text>,
    },
    {
      key: 'available',
      header: t('admin.inventory.available'),
      render: (item) => (
        <Text size="sm" fw={600} c={item.isCritical ? 'red' : undefined}>
          {item.available}
        </Text>
      ),
    },
    {
      key: 'min',
      header: t('admin.inventory.min'),
      render: (item) => <Text size="sm">{item.minStock}</Text>,
    },
    {
      key: 'status',
      header: t('admin.inventory.column.status'),
      render: (item) => (
        <Group gap="xs" wrap="wrap">
          {item.isCritical ? (
            <Badge
              variant="light"
              color="red"
              leftSection={<IconAlertTriangle size={12} />}
            >
              {t('admin.inventory.critical')}
            </Badge>
          ) : (
            <Badge variant="light" color="teal">
              {t('admin.inventory.ok')}
            </Badge>
          )}
          {!item.active && (
            <Badge variant="light" color="gray">
              {t('admin.inventory.inactive')}
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item) => (
        <Button
          variant="light"
          size="compact-sm"
          rightSection={<IconPlus size={14} />}
          onClick={() => setAdjusting(item)}
        >
          {t('admin.inventory.adjust')}
        </Button>
      ),
    },
  ]

  return (
    <Stack gap="md">
      <Group justify="space-between" gap="sm" wrap="wrap">
        <Switch
          label={t('admin.inventory.filter.lowStock')}
          checked={lowStock}
          onChange={(event) => {
            setLowStock(event.currentTarget.checked)
            resetPage()
          }}
        />

        {query.data && (
          <Text size="sm" c="dimmed">
            {t('admin.inventory.results', { count: total })}
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
            <EmptyState icon={IconBox} title={t('admin.inventory.empty')} />
          ) : (
            <ResponsiveList
              data={items}
              getKey={(item) => item.id}
              columns={columns}
              minWidth={900}
              cardTitle={(item) => (
                <div>
                  <Text fw={600} size="sm">
                    {item.sku}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.product?.model} · {item.size?.code}
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

      <AdjustModal
        key={adjusting?.id ?? 'none'}
        variant={adjusting}
        opened={adjusting !== null}
        onClose={() => setAdjusting(null)}
      />
    </Stack>
  )
}
