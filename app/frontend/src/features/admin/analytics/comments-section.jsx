import { DateTime } from '@components/date-time.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { InsetCard, SurfaceCard } from '@components/surface-card.jsx'
import { Line, Rating } from '@constants/enums.js'
import { ExportButtons } from '@features/admin/analytics/export-buttons.jsx'
import { useComments } from '@features/admin/analytics/hooks/use-analytics.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Group, Select, Stack, Text } from '@mantine/core'
import { IconMessage } from '@tabler/icons-react'
import { useState } from 'react'

const ALL = 'all'
const LINES = Object.values(Line)
const RATINGS = Object.values(Rating)

const RATING_COLORS = { Small: 'orange', Correct: 'teal', Large: 'red' }

/*
  Comentarios del feedback: filtros por calificación y línea, con exportación a CSV y Excel.
*/
export function CommentsSection() {
  const { t } = useI18n()
  const [rating, setRating] = useState(ALL)
  const [line, setLine] = useState(ALL)

  const query = useComments({
    rating: rating === ALL ? null : rating,
    line: line === ALL ? null : line,
  })

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
    <section aria-label={t('admin.comments.title')}>
      <SurfaceCard
        titleSectionVariant="top"
        icon={IconMessage}
        title={t('admin.comments.title')}
        description={t('admin.comments.subtitle')}
        rightSection={
          <ExportButtons
            filename="comentarios"
            sheetName={t('admin.comments.title')}
            columns={columns}
            rows={items}
          />
        }
      >
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
                    <InsetCard key={item.id}>
                      <Group
                        justify="space-between"
                        wrap="wrap"
                        align="flex-start"
                        gap="xs"
                      >
                        <Group gap="xs" wrap="wrap">
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
