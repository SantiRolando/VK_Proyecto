import { routes } from '@app/routes.js'
import { ChannelBadge } from '@components/channel-badge.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { SaleStatusBadge } from '@components/sale-status-badge.jsx'
import { InsetCard } from '@components/surface-card.jsx'
import { useI18n } from '@i18n/context.js'
import { Button, Divider, Group, Stack, Text } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import { useNavigate } from 'react-router'

/*
  Ventas que todavía retienen reserva: también es una foto del momento, sin rango de fechas.
*/
export function InFlightBlock({ query }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const sales = query.data?.items ?? []

  return (
    <InsetCard icon={IconClock} title={t('admin.dashboard.inFlight')}>
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data &&
          (sales.length === 0 ? (
            <EmptyState icon={IconClock} title={t('admin.dashboard.noInFlight')} />
          ) : (
            <Stack gap="md" divider={<Divider />}>
              {sales.map((sale) => (
                <Group
                  key={sale.id}
                  justify="space-between"
                  wrap="wrap"
                  align="flex-start"
                  gap="sm"
                >
                  <div>
                    <Group gap="xs" wrap="wrap">
                      <Text fw={600}>#{sale.id}</Text>
                      <SaleStatusBadge status={sale.status} />
                    </Group>
                    <Text size="sm" mt={4}>
                      {sale.customer?.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {sale.customer?.whatsappPhone} ·{' '}
                      {t(`enums.deliveryMethod.${sale.deliveryMethod}`)}
                    </Text>
                  </div>
                  <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
                    <ChannelBadge channel={sale.channel} />
                    <Button
                      variant="light"
                      size="compact-xs"
                      onClick={() => navigate(routes.adminSale(sale.id))}
                    >
                      {t('admin.sales.view')}
                    </Button>
                  </Stack>
                </Group>
              ))}
            </Stack>
          ))}
      </QueryBoundary>
    </InsetCard>
  )
}
