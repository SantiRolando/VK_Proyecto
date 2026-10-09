import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { LazyBarChart } from '@components/lazy-bar-chart.jsx'
import { InsetCard } from '@components/surface-card.jsx'
import { useI18n } from '@i18n/context.js'
import { Group, RingProgress, Stack, Text } from '@mantine/core'
import { IconTrendingUp } from '@tabler/icons-react'
import { CHART_ACCENT } from '@theme/theme.js'

/*
  Conversión de mediciones a compras coordinadas, con el anillo del ratio y el gráfico de las dos
  series.
*/
export function ConversionBlock({ query }) {
  const { t, formatNumber } = useI18n()

  return (
    <InsetCard icon={IconTrendingUp} title={t('admin.dashboard.conversion')}>
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
                    color: 'primary',
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

            <LazyBarChart
              h={200}
              data={[
                {
                  metric: t('admin.dashboard.generations'),
                  value: query.data.generations,
                },
                { metric: t('admin.dashboard.sales'), value: query.data.sales },
              ]}
              dataKey="metric"
              series={[{ name: 'value', color: CHART_ACCENT }]}
            />
          </Stack>
        )}
      </QueryBoundary>
    </InsetCard>
  )
}
