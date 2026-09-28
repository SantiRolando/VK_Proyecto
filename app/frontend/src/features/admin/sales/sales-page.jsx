import { routes } from '@app/routes.js'
import { ChannelBadge } from '@components/channel-badge.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { SaleStatusBadge } from '@components/sale-status-badge.jsx'
import { useAdminSales } from '@features/admin/sales/hooks/use-admin-sales.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Container,
  Group,
  Scroller,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
} from '@mantine/core'
import { IconReceipt } from '@tabler/icons-react'
import { addressLine } from '@utils/address.js'
import { useState } from 'react'
import { useNavigate } from 'react-router'

const ALL = 'all'
const STATUSES = ['PendingCoordination', 'Contacted', 'Confirmed', 'Cancelled']

// El prototipo trae todas las ventas de una: el endpoint ya pagina, así que
// pedir páginas es un cambio de esta pantalla (US8/US10).
const PAGE_SIZE = 50

// Ventas en curso (US7/T068): pestañas por estado, filtro de canal, canal y
// antigüedad visibles. La antigüedad se resalta cuando la reserva lleva
// demasiado tiempo sin respuesta (Q-11: sin TTL, decide el admin).
export function AdminSalesPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [status, setStatus] = useState(ALL)
  const [channel, setChannel] = useState(ALL)

  const query = useAdminSales({
    status: status === ALL ? null : status,
    channel: channel === ALL ? null : channel,
    pageSize: PAGE_SIZE,
  })

  const sales = query.data?.items ?? []

  const columns = [
    {
      key: 'id',
      header: t('admin.sales.column.id'),
      render: (sale) => <Text fw={600}>#{sale.id}</Text>,
    },
    {
      key: 'customer',
      header: t('admin.sales.column.customer'),
      render: (sale) => <Text size="sm">{sale.customer?.name}</Text>,
    },
    {
      key: 'channel',
      header: t('admin.sales.column.channel'),
      render: (sale) => <ChannelBadge channel={sale.channel} />,
    },
    {
      key: 'delivery',
      header: t('admin.sales.column.delivery'),
      render: (sale) => (
        <div>
          <Text size="sm">{t(`enums.deliveryMethod.${sale.deliveryMethod}`)}</Text>
          {sale.address && (
            <Text size="xs" c="dimmed">
              {addressLine(sale.address)}
            </Text>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('admin.sales.column.status'),
      render: (sale) => <SaleStatusBadge status={sale.status} />,
    },
    {
      key: 'age',
      header: t('admin.sales.column.age'),
      render: (sale) =>
        sale.isStale ? (
          <Badge variant="light" color="orange">
            {t('admin.sales.days', { days: sale.ageDays })}
          </Badge>
        ) : (
          <Text size="sm" c="dimmed">
            {t('admin.sales.days', { days: sale.ageDays })}
          </Text>
        ),
    },
    {
      key: 'total',
      header: t('admin.sales.column.total'),
      render: (sale) => (
        <Text size="sm">
          <Money value={sale.total} />
        </Text>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (sale) => (
        <Button
          variant="light"
          size="compact-sm"
          onClick={() => navigate(routes.adminSale(sale.id))}
        >
          {t('admin.sales.view')}
        </Button>
      ),
    },
  ]

  return (
    <Container size="xl" py="xl">
      <PageHeader title={t('admin.sales.title')} subtitle={t('admin.sales.subtitle')} />

      <Stack gap="md">
        <Tabs value={status} onChange={(value) => setStatus(value ?? ALL)}>
          <Tabs.List>
            <Scroller>
              <Tabs.Tab value={ALL}>{t('admin.sales.filter.all')}</Tabs.Tab>
              {STATUSES.map((value) => (
                <Tabs.Tab key={value} value={value}>
                  {t(`enums.saleStatus.${value}`)}
                </Tabs.Tab>
              ))}
            </Scroller>
          </Tabs.List>
        </Tabs>

        <Group justify="space-between" gap="sm" wrap="wrap">
          <SegmentedControl
            size="xs"
            value={channel}
            onChange={setChannel}
            data={[
              { value: ALL, label: t('admin.sales.filter.all') },
              { value: 'Email', label: t('enums.channel.Email') },
              { value: 'Whatsapp', label: t('enums.channel.Whatsapp') },
            ]}
          />
          {query.data && (
            <Text size="sm" c="dimmed">
              {t('admin.sales.results', { count: query.data.meta.total })}
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
            (sales.length === 0 ? (
              <EmptyState icon={IconReceipt} title={t('admin.sales.empty')} />
            ) : (
              <ResponsiveList
                data={sales}
                getKey={(sale) => sale.id}
                columns={columns}
                minWidth={900}
                cardTitle={(sale) => (
                  <div>
                    <Group gap="xs" wrap="nowrap">
                      <Text fw={600}>#{sale.id}</Text>
                      <SaleStatusBadge status={sale.status} />
                    </Group>
                    <Text size="sm" c="dimmed">
                      {sale.customer?.name}
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
