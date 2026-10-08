import { Box, Card, Group, Text, ThemeIcon } from '@mantine/core'

/*
  Superficie elevada y reutilizable. Existe porque el fondo de la app es blanco liso: una
  tarjeta del mismo color con un borde se lee como un rectángulo dibujado, no como una pieza
  apoyada arriba. Los tokens (`--vk-surface-*`) viven en el tema y cambian con el esquema de
  color, así que el componente no ramifica por tema.

  `titleSectionVariant="top"` mueve el encabezado a una franja propia, separada por un borde:
  icono y título a la izquierda, descripción debajo del título, y un slot a la derecha para un
  CTA o una badge. Sin la prop, el encabezado queda como texto suelto arriba del contenido, que
  es como ya estaban las tarjetas de la app.

  `placeholderIcon` es para las pantallas sin imágenes: ocupa el lugar de la media con un icono
  apagado, en vez de dejar el hueco vacío.

  El padding lo maneja el componente. Pasar `p` por las props rompe la franja superior.
*/

const SURFACE_STYLE = {
  background: 'var(--vk-surface-background)',
  borderColor: 'var(--vk-surface-border)',
  boxShadow: 'var(--vk-surface-shadow)',
}

const HEADER_STYLE = {
  borderBottom: '1px solid var(--vk-surface-border)',
  background: 'var(--vk-surface-header-background)',
}

export function SurfaceCard({
  title,
  description,
  icon: Icon,
  titleSectionVariant = 'default',
  rightSection,
  placeholderIcon: PlaceholderIcon,
  children,
  ...cardProps
}) {
  const isTop = titleSectionVariant === 'top'
  const hasHeader = Boolean(
    title || description || Icon || rightSection || PlaceholderIcon,
  )

  const header = (
    <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
      <Group gap="sm" align="flex-start" wrap="nowrap">
        {Icon && (
          <ThemeIcon variant="light" size={40} radius="md">
            <Icon size={22} stroke={1.6} />
          </ThemeIcon>
        )}
        <div>
          {title && (
            <Text fw={600} size={isTop ? 'lg' : 'md'}>
              {title}
            </Text>
          )}
          {description && (
            <Text c="dimmed" size="sm" mt={4} maw="68ch">
              {description}
            </Text>
          )}
        </div>
      </Group>

      {(rightSection || PlaceholderIcon) && (
        <Group gap="sm" align="center" wrap="nowrap">
          {rightSection}
          {PlaceholderIcon && (
            <ThemeIcon variant="light" color="gray" size={44} radius="md">
              <PlaceholderIcon size={26} stroke={1.4} />
            </ThemeIcon>
          )}
        </Group>
      )}
    </Group>
  )

  return (
    <Card withBorder radius="lg" p={0} style={SURFACE_STYLE} {...cardProps}>
      {isTop && hasHeader && (
        <Card.Section px="lg" py="md" style={HEADER_STYLE}>
          {header}
        </Card.Section>
      )}

      <Box p="lg">
        {!isTop && hasHeader && <Box mb="md">{header}</Box>}
        {children}
      </Box>
    </Card>
  )
}

/*
  Tarjeta hundida dentro de una superficie: invierte el color de fondo para no apilar sombra
  sobre sombra, que es lo que pasa cuando se anida otra `SurfaceCard`.
*/
export function InsetCard({ children, ...cardProps }) {
  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{
        background: 'var(--vk-surface-inset-background)',
        borderColor: 'var(--vk-surface-border)',
      }}
      {...cardProps}
    >
      {children}
    </Card>
  )
}
