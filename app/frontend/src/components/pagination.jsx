import { useI18n } from '@i18n/context.js'
import { Group, Pagination as PageButtons, Select, Text } from '@mantine/core'

const PAGE_SIZES = [10, 20, 50]

/*
  Pie de un listado paginado: el rango visible, el tamaño de página y las páginas. El total y la
  página los manda el endpoint; `pageSize` sale del estado del listado, así no depende de cómo
  cada API nombre el tamaño.
*/
export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const { t, formatNumber } = useI18n()

  if (!total) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <Group justify="space-between" align="center" gap="sm" wrap="wrap">
      <Text size="sm" c="dimmed">
        {t('common.pagination.range', {
          from: formatNumber(from),
          to: formatNumber(to),
          total: formatNumber(total),
        })}
      </Text>

      <Group gap="sm" wrap="wrap">
        {onPageSizeChange && (
          <Select
            data={PAGE_SIZES.map((value) => ({
              value: String(value),
              label: t('common.pagination.pageSize', { count: value }),
            }))}
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            allowDeselect={false}
            w={140}
            aria-label={t('common.pagination.pageSizeLabel')}
          />
        )}

        <PageButtons
          total={Math.max(1, Math.ceil(total / pageSize))}
          value={page}
          onChange={onPageChange}
          withEdges
          size="sm"
          aria-label={t('common.pagination.label')}
        />
      </Group>
    </Group>
  )
}
