import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { InsetCard, SurfaceCard } from '@components/surface-card.jsx'
import { Line } from '@constants/enums.js'
import { ExportButtons } from '@features/admin/analytics/export-buttons.jsx'
import { useMissingSizes } from '@features/admin/analytics/hooks/use-analytics.js'
import { useI18n } from '@i18n/context.js'
import {
  alpha,
  Badge,
  Group,
  Select,
  Stack,
  Table,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { IconChartBar, IconRuler } from '@tabler/icons-react'
import { useState } from 'react'

const ALL = 'all'
const LINES = Object.values(Line)

function cellStyle(theme, count, maxCount) {
  if (!count) return { textAlign: 'center' }
  const ratio = count / maxCount
  return {
    textAlign: 'center',
    backgroundColor: alpha(theme.colors.blue[6], 0.15 + ratio * 0.55),
    fontWeight: 600,
  }
}

/*
  Demanda no satisfecha: mapa de calor de consultas sin stock por línea × talle, con exportación
  a CSV y Excel.
*/
export function MissingSizesSection() {
  const { t } = useI18n()
  const theme = useMantineTheme()
  const [line, setLine] = useState(ALL)
  const query = useMissingSizes({ line: line === ALL ? null : line })

  const cells = query.data?.cells ?? []
  const sizes = query.data?.meta.sizes ?? []
  const lines = query.data?.meta.lines ?? LINES
  const total = query.data?.meta.total ?? 0
  const maxCount = Math.max(1, ...cells.map((cell) => cell.count))

  const columns = [
    {
      label: t('admin.missingSizes.column.line'),
      value: (cell) => t(`enums.line.${cell.line}`),
    },
    { label: t('admin.missingSizes.column.size'), value: (cell) => cell.size.code },
    { label: t('admin.missingSizes.column.count'), value: (cell) => cell.count },
  ]

  const countFor = (lineValue, sizeId) =>
    cells.find((cell) => cell.line === lineValue && cell.size.id === sizeId)?.count ?? 0

  const sizesOf = (lineValue) =>
    sizes
      .filter((size) => size.line === lineValue)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section aria-label={t('admin.missingSizes.title')}>
      <SurfaceCard
        titleSectionVariant="top"
        icon={IconRuler}
        title={t('admin.missingSizes.title')}
        description={t('admin.missingSizes.subtitle')}
        rightSection={
          <ExportButtons
            filename="talles-faltantes"
            sheetName={t('admin.missingSizes.title')}
            columns={columns}
            rows={cells}
          />
        }
      >
        <Stack gap="md">
          <Group justify="space-between" gap="sm" wrap="wrap">
            <Select
              data={[
                { value: ALL, label: t('admin.inventory.filter.allLines') },
                ...LINES.map((value) => ({ value, label: t(`enums.line.${value}`) })),
              ]}
              value={line}
              onChange={(value) => setLine(value ?? ALL)}
              allowDeselect={false}
              w={200}
              aria-label={t('admin.inventory.filter.line')}
            />
            {query.data && (
              <Text size="sm" c="dimmed">
                {t('admin.missingSizes.total', { count: total })}
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
              (total === 0 ? (
                <EmptyState
                  icon={IconChartBar}
                  title={t('admin.missingSizes.empty')}
                  description={t('admin.missingSizes.emptyBody')}
                />
              ) : (
                <Stack gap="md">
                  {lines
                    .filter((lineValue) =>
                      sizesOf(lineValue).some((size) => countFor(lineValue, size.id) > 0),
                    )
                    .map((lineValue) => (
                      <InsetCard key={lineValue}>
                        <Group justify="space-between" mb="xs">
                          <Badge variant="light" color="blue">
                            {t(`enums.line.${lineValue}`)}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {t('admin.missingSizes.lineTotal', {
                              count: sizesOf(lineValue).reduce(
                                (sum, size) => sum + countFor(lineValue, size.id),
                                0,
                              ),
                            })}
                          </Text>
                        </Group>

                        <Table.ScrollContainer minWidth={520}>
                          <Table withColumnBorders>
                            <Table.Thead>
                              <Table.Tr>
                                {sizesOf(lineValue).map((size) => (
                                  <Table.Th key={size.id} ta="center">
                                    {size.code}
                                  </Table.Th>
                                ))}
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              <Table.Tr>
                                {sizesOf(lineValue).map((size) => {
                                  const count = countFor(lineValue, size.id)
                                  return (
                                    <Table.Td
                                      key={size.id}
                                      style={cellStyle(theme, count, maxCount)}
                                    >
                                      {count || '—'}
                                    </Table.Td>
                                  )
                                })}
                              </Table.Tr>
                            </Table.Tbody>
                          </Table>
                        </Table.ScrollContainer>
                      </InsetCard>
                    ))}
                </Stack>
              ))}
          </QueryBoundary>
        </Stack>
      </SurfaceCard>
    </section>
  )
}
