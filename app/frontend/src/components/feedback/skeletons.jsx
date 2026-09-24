import { SimpleGrid, Skeleton, Stack } from '@mantine/core'

// Esqueletos de carga reutilizables (estados de carga consistentes, FR-029).

export function ListSkeleton({ rows = 4 }) {
  return (
    <Stack gap="sm">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={56} radius="md" />
      ))}
    </Stack>
  )
}

export function CardSkeleton({ count = 3 }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={180} radius="md" />
      ))}
    </SimpleGrid>
  )
}
