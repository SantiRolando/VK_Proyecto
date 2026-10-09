import { colorHex, colorLabel } from '@constants/colors.js'
import { Group, Text } from '@mantine/core'

/*
  Punto de color con su nombre: lo comparten el inventario y las variantes del catálogo.
*/
export function ColorDot({ color }) {
  return (
    <Group gap={6} wrap="nowrap">
      <span
        style={{
          backgroundColor: colorHex(color),
          borderRadius: 999,
          display: 'inline-block',
          height: 12,
          width: 12,
        }}
      />
      <Text size="sm">{colorLabel(color)}</Text>
    </Group>
  )
}
