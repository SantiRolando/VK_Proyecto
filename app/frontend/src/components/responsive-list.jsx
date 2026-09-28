import { Card, Group, Stack, Table, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

// Listado responsive genérico (Table en desktop, Cards en móvil).
//
// `columns` es un array de { key, header, render, hideInCard }:
//   - `header` se usa tanto en la cabecera de la tabla como de label en la card.
//   - `render(item)` devuelve el contenido de la celda / valor de la card.
//   - `hideInCard` (opcional) omite la columna del listado de la card.
//
// `cardTitle(item)` y `cardActions(item)` son renders opcionales para la
// cabecera de la card en pantallas chicas. `cardActions` se ubica en la
// esquina superior derecha (típicamente un `ActionsMenu`).

export function ResponsiveList({
  data,
  getKey,
  columns,
  minWidth = 900,
  cardTitle,
  cardActions,
  ...tableProps
}) {
  const isSmall = useMediaQuery('(max-width: 48em)')

  if (isSmall) {
    return (
      <Stack gap="sm">
        {data.map((item) => (
          <Card key={getKey(item)} withBorder radius="md" padding="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                {cardTitle && <div style={{ flex: 1 }}>{cardTitle(item)}</div>}
                {cardActions && <div>{cardActions(item)}</div>}
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
          </Card>
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
