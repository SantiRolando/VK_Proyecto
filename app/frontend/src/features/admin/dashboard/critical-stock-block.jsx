import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { InsetCard } from '@components/surface-card.jsx'
import { colorLabel } from '@constants/colors.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Group, Stack, Text } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

// La tarjeta muestra los primeros y resume el resto: el listado completo vive en Inventario.
const PREVIEW = 6

/*
  Variantes por debajo de su mínimo: es la foto del momento, no depende del rango de fechas.
*/
export function CriticalStockBlock({ query }) {
  const { t } = useI18n()

  return (
    <InsetCard icon={IconAlertTriangle} title={t('admin.dashboard.criticalStock')}>
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
              {query.data.slice(0, PREVIEW).map((item) => (
                <Group key={item.id} justify="space-between" wrap="wrap" gap="sm">
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
              {query.data.length > PREVIEW && (
                <Text size="xs" c="dimmed">
                  {t('admin.dashboard.moreCritical', {
                    count: query.data.length - PREVIEW,
                  })}
                </Text>
              )}
            </Stack>
          ))}
      </QueryBoundary>
    </InsetCard>
  )
}
