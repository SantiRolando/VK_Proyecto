import { useI18n } from '@i18n/context.js'
import { SimpleGrid, Skeleton, Stack } from '@mantine/core'

/*
  Esqueletos de carga reutilizables (estados de carga consistentes).
  `role="status"` + `aria-busy` anuncian la carga a lectores de pantalla.
*/

export function ListSkeleton({ rows = 4 }) {
  const { t } = useI18n()

  return (
    <Stack gap="sm" role="status" aria-busy="true" aria-label={t('common.loading')}>
      {Array.from({ length: rows }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: esqueleto estático, el orden nunca cambia
        <Skeleton key={index} height={56} radius="md" />
      ))}
    </Stack>
  )
}

export function CardSkeleton({ count = 3 }) {
  const { t } = useI18n()

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 3 }}
      spacing="md"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      {Array.from({ length: count }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: esqueleto estático, el orden nunca cambia
        <Skeleton key={index} height={180} radius="md" />
      ))}
    </SimpleGrid>
  )
}
