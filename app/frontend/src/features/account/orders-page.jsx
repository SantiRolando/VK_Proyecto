import { routes } from '@app/routes.js'
import { ChannelBadge } from '@components/channel-badge.jsx'
import { DateTime } from '@components/date-time.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { SaleStatusBadge } from '@components/sale-status-badge.jsx'
import { colorLabel } from '@constants/colors.js'
import { useMySales } from '@features/account/hooks/use-orders.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Card, Container, Group, Stack, Text } from '@mantine/core'
import { IconPackage } from '@tabler/icons-react'
import { useNavigate } from 'react-router'

function lineLabel(line, t) {
  const size = line.size?.code
  return [
    line.product?.model,
    size && `${t('catalog.size')} ${size}`,
    colorLabel(line.color),
  ]
    .filter(Boolean)
    .join(' · ')
}

// Mis compras (US6/T081): las ventas coordinadas, con su estado y detalle.
export function OrdersPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const query = useMySales()

  return (
    <Container size="md" py="xl">
      <PageHeader
        title={t('account.orders.title')}
        subtitle={t('account.orders.subtitle')}
      />

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data &&
          (query.data.length === 0 ? (
            <EmptyState
              icon={IconPackage}
              title={t('account.orders.empty')}
              description={t('account.orders.emptyBody')}
              action={
                <Button onClick={() => navigate(routes.catalog())}>
                  {t('account.orders.browse')}
                </Button>
              }
            />
          ) : (
            <Stack gap="sm">
              {query.data.map((sale) => (
                <Card key={sale.id} withBorder radius="md" padding="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={600}>{t('account.orders.order', { id: sale.id })}</Text>
                    <SaleStatusBadge status={sale.status} />
                  </Group>

                  <Group gap="xs" mt={6} wrap="wrap">
                    <ChannelBadge channel={sale.channel} />
                    <Badge variant="light" color="gray">
                      {t(`enums.deliveryMethod.${sale.deliveryMethod}`)}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      <DateTime
                        value={sale.createdAt}
                        options={{ dateStyle: 'medium' }}
                      />
                    </Text>
                    {sale.coupon && (
                      <Badge variant="outline" color="vikinga">
                        {sale.coupon.code}
                      </Badge>
                    )}
                  </Group>

                  <Stack gap={2} mt="sm">
                    {sale.lines.map((line) => (
                      <Text key={line.id} size="sm">
                        {lineLabel(line, t)} × {line.quantity}
                      </Text>
                    ))}
                  </Stack>

                  <Group justify="space-between" mt="sm">
                    <Text size="sm" c="dimmed">
                      {t('checkout.summary.total')}
                    </Text>
                    <Text fw={600}>
                      <Money value={sale.total} />
                    </Text>
                  </Group>
                </Card>
              ))}
            </Stack>
          ))}
      </QueryBoundary>
    </Container>
  )
}
