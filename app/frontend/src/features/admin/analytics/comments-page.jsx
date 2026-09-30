import { DateTime } from '@components/date-time.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { Line } from '@constants/enums.js'
import { useComments } from '@features/admin/analytics/hooks/use-analytics.js'
import { useExport } from '@hooks/use-export.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Card, Container, Group, Select, Stack, Text } from '@mantine/core'
import { IconFileSpreadsheet, IconMessage } from '@tabler/icons-react'
import { useState } from 'react'

const ALL = 'all'
const LINES = Object.values(Line)
const RATINGS = ['Small', 'Correct', 'Large']

const RATING_COLORS = { Small: 'orange', Correct: 'teal', Large: 'red' }

// Comentarios del feedback (US10/T095, FR-025): filtros por calificación y
// línea, con exportación a CSV y Excel.
export function CommentsPage() {
  const { t } = useI18n()
  const [rating, setRating] = useState(ALL)
  const [line, setLine] = useState(ALL)

  const query = useComments({
    rating: rating === ALL ? null : rating,
    line: line === ALL ? null : line,
  })
  const { exportCsv, exportExcel, isExporting } = useExport()

  const items = query.data?.items ?? []

  const columns = [
    {
      label: t('admin.comments.column.date'),
      value: (item) => item.ratedAt ?? item.createdAt,
    },
    {
      label: t('admin.comments.column.line'),
      value: (item) => t(`enums.line.${item.line}`),
    },
    { label: t('admin.comments.column.size'), value: (item) => item.size?.code ?? '' },
    {
      label: t('admin.comments.column.rating'),
      value: (item) => (item.rating ? t(`enums.rating.${item.rating}`) : ''),
    },
    { label: t('admin.comments.column.comment'), value: (item) => item.comment },
  ]

  return (
    <Container size="lg" py="xl">
      <PageHeader
        title={t('admin.comments.title')}
        subtitle={t('admin.comments.subtitle')}
        actions={
          <Group gap="xs">
            <Button
              variant="light"
              size="compact-sm"
              disabled={items.length === 0 || isExporting}
              onClick={() => exportCsv('comentarios', columns, items)}
            >
              {t('admin.analytics.export.csv')}
            </Button>
            <Button
              variant="light"
              size="compact-sm"
              color="teal"
              leftSection={<IconFileSpreadsheet size={14} />}
              disabled={items.length === 0 || isExporting}
              onClick={() =>
                exportExcel('comentarios', t('admin.comments.title'), columns, items)
              }
            >
              {t('admin.analytics.export.excel')}
            </Button>
          </Group>
        }
      />

      <Stack gap="md">
        <Group justify="space-between" gap="sm" wrap="wrap">
          <Group gap="sm" wrap="wrap">
            <Select
              data={[
                { value: ALL, label: t('admin.comments.filter.allRatings') },
                ...RATINGS.map((value) => ({
                  value,
                  label: t(`enums.rating.${value}`),
                })),
              ]}
              value={rating}
              onChange={(value) => setRating(value ?? ALL)}
              allowDeselect={false}
              w={200}
              aria-label={t('admin.comments.filter.rating')}
            />
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
          </Group>
          {query.data && (
            <Text size="sm" c="dimmed">
              {t('admin.comments.results', { count: query.data.meta.total })}
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
            (items.length === 0 ? (
              <EmptyState icon={IconMessage} title={t('admin.comments.empty')} />
            ) : (
              <Stack gap="sm">
                {items.map((item) => (
                  <Card key={item.id} withBorder radius="md" padding="md">
                    <Group justify="space-between" wrap="nowrap" align="flex-start">
                      <Group gap="xs" wrap="nowrap">
                        {item.rating && (
                          <Badge
                            variant="light"
                            color={RATING_COLORS[item.rating] ?? 'gray'}
                          >
                            {t(`enums.rating.${item.rating}`)}
                          </Badge>
                        )}
                        <Text size="sm" fw={600}>
                          {t(`enums.line.${item.line}`)}
                          {item.size ? ` · ${item.size.code}` : ''}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        <DateTime
                          value={item.ratedAt ?? item.createdAt}
                          options={{ dateStyle: 'medium' }}
                        />
                      </Text>
                    </Group>
                    <Text size="sm" mt="xs">
                      “{item.comment}”
                    </Text>
                  </Card>
                ))}
              </Stack>
            ))}
        </QueryBoundary>
      </Stack>
    </Container>
  )
}
