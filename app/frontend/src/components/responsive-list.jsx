import { SurfaceCard } from '@components/surface-card.jsx'
import { Group, Stack, Table, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

// Listado responsive genérico: `Table` en desktop y `SurfaceCard` por fila en móvil.

export function ResponsiveList({
  data,
  getKey,
  columns,
  minWidth = 900,
  cardTitle,
  cardActions,
  ...tableProps
}) {
  const isSmall = useMediaQuery('(max-width: 62em)')

  if (isSmall) {
    return (
      <Stack gap="sm">
        {data.map((item) => (
          <SurfaceCard key={getKey(item)}>
            <Stack gap="sm">
              {/*
                El encabezado no wrapea: el título se encoge y la acción no. Sin el `minWidth: 0`
                un texto sin cortes (un correo) empuja la acción afuera de la card y el recorte
                se la come.
              */}
              <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                {cardTitle && (
                  <div style={{ flex: 1, minWidth: 0 }}>{cardTitle(item)}</div>
                )}
                {cardActions && <div style={{ flexShrink: 0 }}>{cardActions(item)}</div>}
              </Group>

              <Stack gap="xs">
                {columns
                  .filter((column) => !column.hideInCard)
                  .map((column) => (
                    <Group
                      key={column.key}
                      justify="space-between"
                      gap="sm"
                      wrap="wrap"
                      align="flex-start"
                    >
                      <Text size="xs" c="dimmed">
                        {column.header}
                      </Text>
                      <div>{column.render(item)}</div>
                    </Group>
                  ))}
              </Stack>
            </Stack>
          </SurfaceCard>
        ))}
      </Stack>
    )
  }

  return (
    <Table.ScrollContainer
      minWidth={minWidth}
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
      }}
    >
      <Table {...tableProps}>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key}>{column.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item) => (
            <Table.Tr key={getKey(item)}>
              {columns.map((column) => (
                <Table.Td key={column.key}>{column.render(item)}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
