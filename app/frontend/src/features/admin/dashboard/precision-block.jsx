import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { InsetCard } from '@components/surface-card.jsx'
import { useI18n } from '@i18n/context.js'
import { Group, Progress, Stack, Text } from '@mantine/core'
import { IconPercentage } from '@tabler/icons-react'

function percentOf(group) {
  return group.total > 0 ? Math.round((group.correct / group.total) * 100) : 0
}

/*
  Precisión del talle generado: qué proporción de las mediciones juzgó el cliente como
  "Correcto", separando las que compraron de las que solo consultaron.
*/
export function PrecisionBlock({ query }) {
  const { t } = useI18n()

  return (
    <InsetCard icon={IconPercentage} title={t('admin.dashboard.precision')}>
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
                <Progress value={percentOf(group)} color="green" mt={4} />
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
    </InsetCard>
  )
}
