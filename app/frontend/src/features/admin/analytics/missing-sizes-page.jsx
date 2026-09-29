import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { useMissingSizes } from '@features/admin/analytics/hooks/use-analytics.js'
import { useExport } from '@hooks/use-export.js'
import { useI18n } from '@i18n/context.js'
import {
  alpha,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Select,
  Stack,
  Table,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { IconChartBar, IconFileSpreadsheet } from '@tabler/icons-react'
import { useState } from 'react'

const ALL = 'all'
const LINES = ['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']

function cellStyle(theme, count, maxCount) {
  if (!count) return { textAlign: 'center' }
  const ratio = count / maxCount
  return {
    textAlign: 'center',
    backgroundColor: alpha(theme.colors.blue[6], 0.15 + ratio * 0.55),
    fontWeight: 600,
  }
}

// Demanda no satisfecha (US10/T095, FR-025): mapa de calor de consultas sin
// stock por línea × talle, con exportación a CSV y Excel.
export function MissingSizesPage() {
  const { t } = useI18n()
  const theme = useMantineTheme()
  const [line, setLine] = useState(ALL)
  const query = useMissingSizes({ line: line === ALL ? null : line })
  const { exportCsv, exportExcel, isExporting } = useExport()

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
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.missingSizes.title')}
        subtitle={t('admin.missingSizes.subtitle')}
        actions={
          <Group gap="xs">
            <Button
              variant="light"
              size="compact-sm"
              disabled={cells.length === 0 || isExporting}
              onClick={() => exportCsv('talles-faltantes', columns, cells)}
            >
              {t('admin.analytics.export.csv')}
            </Button>
            <Button
              variant="light"
              size="compact-sm"
              color="teal"
              leftSection={<IconFileSpreadsheet size={14} />}
              disabled={cells.length === 0 || isExporting}
              onClick={() =>
                exportExcel(
                  'talles-faltantes',
                  t('admin.missingSizes.title'),
                  columns,
                  cells,
                )
              }
            >
              {t('admin.analytics.export.excel')}
            </Button>
          </Group>
        }
      />

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
                    <Card key={lineValue} withBorder radius="md" padding="md">
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
                    </Card>
                  ))}
              </Stack>
            ))}
        </QueryBoundary>
      </Stack>
    </Container>
  )
}
