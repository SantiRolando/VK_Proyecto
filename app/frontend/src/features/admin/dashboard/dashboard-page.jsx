import { routes } from '@app/routes.js'
import { ChannelBadge } from '@components/channel-badge.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { SaleStatusBadge } from '@components/sale-status-badge.jsx'
import { colorLabel } from '@constants/colors.js'
import {
  useConversion,
  useCriticalStock,
  usePrecision,
} from '@features/admin/dashboard/hooks/use-dashboard.js'
import { useAdminSales } from '@features/admin/sales/hooks/use-admin-sales.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Progress,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import {
  IconAlertTriangle,
  IconClock,
  IconPercentage,
  IconTrendingUp,
} from '@tabler/icons-react'
import 'dayjs/locale/es'
import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router'

// Los gráficos entran en un chunk aparte (§4.6): no pesan en el arranque.
const BarChart = lazy(() =>
  import('@mantine/charts').then((module) => ({ default: module.BarChart })),
)

const DEFAULT_RANGE_DAYS = 30
const CRITICAL_PREVIEW = 6

function toIso(date) {
  if (!date) return undefined
  return new Date(date).toISOString().slice(0, 10)
}

function percentOf(group) {
  return group.total > 0 ? Math.round((group.correct / group.total) * 100) : 0
}

function BlockTitle({ icon: Icon, children }) {
  return (
    <Title order={2} size="h4" mb="md">
      <Group gap="xs">
        <Icon size={18} />
        {children}
      </Group>
    </Title>
  )
}

function ConversionBlock({ query }) {
  const { t, formatNumber } = useI18n()

  return (
    <Card withBorder radius="md" padding="lg">
      <BlockTitle icon={IconTrendingUp}>{t('admin.dashboard.conversion')}</BlockTitle>
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data && (
          <Stack gap="lg">
            <Group gap="lg" wrap="nowrap" align="center">
              <RingProgress
                size={120}
                thickness={12}
                roundCaps
                sections={[
                  {
                    value: Math.min(100, Math.round(query.data.ratio * 100)),
                    color: 'vikinga',
                  },
                ]}
                label={
                  <Text ta="center" fw={700}>
                    {Math.round(query.data.ratio * 100)}%
                  </Text>
                }
              />
              <Stack gap="xs">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('admin.dashboard.generations')}
                  </Text>
                  <Text fw={700}>{formatNumber(query.data.generations)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('admin.dashboard.sales')}
                  </Text>
                  <Text fw={700}>{formatNumber(query.data.sales)}</Text>
                </div>
              </Stack>
            </Group>

            <Suspense fallback={<Skeleton height={200} />}>
              <BarChart
                h={200}
                data={[
                  {
                    metric: t('admin.dashboard.generations'),
                    value: query.data.generations,
                  },
                  { metric: t('admin.dashboard.sales'), value: query.data.sales },
                ]}
                dataKey="metric"
                series={[{ name: 'value', color: 'vikinga' }]}
              />
            </Suspense>
          </Stack>
        )}
      </QueryBoundary>
    </Card>
  )
}

function PrecisionBlock({ query }) {
  const { t } = useI18n()

  return (
    <Card withBorder radius="md" padding="lg">
      <BlockTitle icon={IconPercentage}>{t('admin.dashboard.precision')}</BlockTitle>
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data && (
          <Stack gap="md">
            {[
              { key: 'purchased', group: query.data.purchased },
              { key: 'consultedOnly', group: query.data.consultedOnly },
            ].map(({ key, group }) => (
              <div key={key}>
                <Group justify="space-between" gap="sm">
                  <Text size="sm">{t(`admin.dashboard.${key}`)}</Text>
                  <Text size="sm" fw={600}>
                    {percentOf(group)}%
                  </Text>
                </Group>
                <Progress value={percentOf(group)} color="vikinga" mt={4} />
                <Text size="xs" c="dimmed" mt={4}>
                  {t('admin.dashboard.correct', {
                    correct: group.correct,
                    total: group.total,
                  })}
                </Text>
              </div>
            ))}
          </Stack>
        )}
      </QueryBoundary>
    </Card>
  )
}

function CriticalStockBlock({ query }) {
  const { t } = useI18n()

  return (
    <Card withBorder radius="md" padding="lg">
      <BlockTitle icon={IconAlertTriangle}>
        {t('admin.dashboard.criticalStock')}
      </BlockTitle>
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data &&
          (query.data.length === 0 ? (
            <Text c="dimmed" size="sm">
              {t('admin.dashboard.noCritical')}
            </Text>
          ) : (
            <Stack gap="xs">
              {query.data.slice(0, CRITICAL_PREVIEW).map((item) => (
                <Group key={item.id} justify="space-between" wrap="nowrap" gap="sm">
                  <div>
                    <Text size="sm" fw={600}>
                      {item.product?.model} · {item.size?.code} · {colorLabel(item.color)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {item.sku}
                    </Text>
                  </div>
                  <Badge variant="light" color="red">
                    {t('admin.dashboard.belowMin', {
                      available: item.available,
                      min: item.minStock,
                    })}
                  </Badge>
                </Group>
              ))}
              {query.data.length > CRITICAL_PREVIEW && (
                <Text size="xs" c="dimmed">
                  {t('admin.dashboard.moreCritical', {
                    count: query.data.length - CRITICAL_PREVIEW,
                  })}
                </Text>
              )}
            </Stack>
          ))}
      </QueryBoundary>
    </Card>
  )
}

function InFlightBlock({ query }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const sales = query.data?.items ?? []

  return (
    <Card withBorder radius="md" padding="lg">
      <BlockTitle icon={IconClock}>{t('admin.dashboard.inFlight')}</BlockTitle>
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
            <Stack gap="sm">
              {sales.map((sale) => (
                <Card key={sale.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <div>
                      <Group gap="xs" wrap="nowrap">
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
                    <Stack gap={6} align="flex-end">
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
                </Card>
              ))}
            </Stack>
          ))}
      </QueryBoundary>
    </Card>
  )
}

// Dashboard de control (US8/T086, FR-021): conversión, precisión, stock crítico
// y ventas en vuelo, con rango de fechas.
export function DashboardPage() {
  const { t, language } = useI18n()
  const [range, setRange] = useState(() => [
    new Date(Date.now() - DEFAULT_RANGE_DAYS * 86_400_000),
    new Date(),
  ])
  const params = { from: toIso(range[0]), to: toIso(range[1]) }

  const conversion = useConversion(params)
  const precision = usePrecision(params)
  const critical = useCriticalStock()
  const inFlight = useAdminSales({ open: true, pageSize: 20 })

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.dashboard.title')}
        subtitle={t('admin.dashboard.subtitle')}
      />

      <DatePickerInput
        type="range"
        label={t('admin.dashboard.range')}
        value={range}
        onChange={setRange}
        locale={language}
        clearable
        mb="lg"
        maw={360}
      />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <ConversionBlock query={conversion} />
        <PrecisionBlock query={precision} />
        <CriticalStockBlock query={critical} />
        <InFlightBlock query={inFlight} />
      </SimpleGrid>
    </Container>
  )
}
