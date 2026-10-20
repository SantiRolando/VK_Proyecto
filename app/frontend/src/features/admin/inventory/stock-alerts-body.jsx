import { DateTime } from '@components/date-time.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Pagination } from '@components/pagination.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { AlertStatus, AlertType } from '@constants/enums.js'
import {
  useNotifyAlert,
  useStockAlerts,
  useVariantIndex,
} from '@features/admin/inventory/hooks/use-inventory.js'
import { usePagination } from '@hooks/use-pagination.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Group, Select, Stack, Text } from '@mantine/core'
import { IconBell } from '@tabler/icons-react'
import { useState } from 'react'

const STATUSES = Object.values(AlertStatus)

const STATUS_COLORS = {
  [AlertStatus.Active]: 'red',
  [AlertStatus.Notified]: 'teal',
  [AlertStatus.Closed]: 'gray',
}

/*
  Alertas de stock crítico del panel. El listado del backend trae también los avisos de
  reposición del cliente, así que acá se muestra solo `CriticalStock`. Se piden todos los
  estados juntos porque el filtro por tipo no existe del lado del backend: la paginación se
  arma sobre lo que queda.
*/
export function StockAlertsBody() {
  const { t } = useI18n()
  const [status, setStatus] = useState(AlertStatus.Active)
  const { page, pageSize, setPage, setPageSize, resetPage } = usePagination()
  const query = useStockAlerts(status)
  const index = useVariantIndex()
  const notify = useNotifyAlert()

  const alerts = (query.data?.items ?? []).filter(
    (alert) => alert.alertType === AlertType.CriticalStock,
  )
  const start = (page - 1) * pageSize
  const visible = alerts.slice(start, start + pageSize)

  function variantLabel(variantId) {
    const row = index.data?.get(variantId)
    if (!row) return t('admin.movements.detail.variant', { id: variantId })
    return [row.sku, row.product?.model, row.size?.code].filter(Boolean).join(' · ')
  }

  const columns = [
    {
      key: 'variant',
      header: t('admin.inventory.column.sku'),
      render: (alert) => <Text size="sm">{variantLabel(alert.variantId)}</Text>,
    },
    {
      key: 'status',
      header: t('admin.inventory.column.status'),
      render: (alert) => (
        <Badge variant="light" color={STATUS_COLORS[alert.status] ?? 'gray'}>
          {t(`enums.alertStatus.${alert.status}`)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('admin.alerts.column.createdAt'),
      render: (alert) => (
        <Text size="sm">
          <DateTime
            value={alert.createdAt}
            options={{ dateStyle: 'short', timeStyle: 'short' }}
          />
        </Text>
      ),
    },
    {
      key: 'notifiedAt',
      header: t('admin.alerts.column.notifiedAt'),
      render: (alert) => (
        <Text size="sm" c={alert.notifiedAt ? undefined : 'dimmed'}>
          {alert.notifiedAt ? (
            <DateTime
              value={alert.notifiedAt}
              options={{ dateStyle: 'short', timeStyle: 'short' }}
            />
          ) : (
            t('admin.alerts.notNotified')
          )}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (alert) =>
        alert.status === AlertStatus.Active ? (
          <Button
            variant="light"
            size="compact-sm"
            loading={notify.isPending && notify.variables === alert.id}
            onClick={() => notify.mutate(alert.id)}
          >
            {t('admin.alerts.notify')}
          </Button>
        ) : null,
    },
  ]

  return (
    <Stack gap="md">
      <Group justify="space-between" gap="sm" wrap="wrap">
        <Select
          data={STATUSES.map((value) => ({
            value,
            label: t(`enums.alertStatus.${value}`),
          }))}
          value={status}
          onChange={(value) => {
            setStatus(value ?? AlertStatus.Active)
            resetPage()
          }}
          allowDeselect={false}
          w={200}
          aria-label={t('admin.alerts.filter.status')}
        />
        {query.data && (
          <Text size="sm" c="dimmed">
            {t('admin.alerts.results', { count: alerts.length })}
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
          (visible.length === 0 ? (
            <EmptyState icon={IconBell} title={t('admin.alerts.empty')} />
          ) : (
            <ResponsiveList
              data={visible}
              getKey={(alert) => alert.id}
              columns={columns}
              minWidth={720}
              cardTitle={(alert) => (
                <Text fw={600} size="sm">
                  {variantLabel(alert.variantId)}
                </Text>
              )}
            />
          ))}
      </QueryBoundary>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={alerts.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  )
}
