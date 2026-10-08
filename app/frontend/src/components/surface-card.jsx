import { Box, Card, Group, Text } from '@mantine/core'

/*
  Superficie elevada y reutilizable. Existe porque el fondo de la app es blanco liso: una
  tarjeta del mismo color con un borde se lee como un rectángulo dibujado, no como una pieza
  apoyada arriba. Los tokens (`--vk-surface-*`) viven en el tema y cambian con el esquema de
  color, así que el componente no ramifica por tema.

  `titleSectionVariant="top"` mueve el encabezado a una franja propia, separada por un borde:
  icono y título a la izquierda, descripción debajo del título, y un slot a la derecha para un
  CTA o una badge. Sin la prop, el encabezado queda como texto suelto arriba del contenido, que
  es como ya estaban las tarjetas de la app.

  El icono se recibe plano y se pinta con el acento de la app: sin caja detrás, que era lo que
  lo hacía parecer un botón. `placeholderIcon` ocupa el lugar de la media en las pantallas sin
  imágenes, apagado para no competir con el contenido.

  El padding lo maneja el componente. Pasar `p` por las props rompe la franja superior.
*/

const SURFACE_STYLE = {
  background: 'var(--vk-surface-background)',
  borderColor: 'var(--vk-surface-border)',
  boxShadow: 'var(--vk-surface-shadow)',
}

/*
  La franja va en un `Box` y no en `Card.Section`: la sección de Mantine se sale de la card con
  un margen negativo igual a su padding, y como la card recorta (`overflow: hidden`), el
  encabezado quedaba comido por el radio de la esquina. Con el `Box`, la franja ocupa el ancho
  real de la card y el recorte la redondea sola.
*/
const HEADER_STYLE = {
  borderBottom: '1px solid var(--vk-surface-border)',
  background: 'var(--vk-surface-header-background)',
}

const ICON_STYLE = { color: 'var(--vk-accent)', flexShrink: 0 }
const PLACEHOLDER_ICON_STYLE = { color: 'var(--mantine-color-dimmed)' }

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
          <Box style={ICON_STYLE} mt={2}>
            <Icon size={22} stroke={1.7} />
          </Box>
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
            <Box style={PLACEHOLDER_ICON_STYLE} mt={2}>
              <PlaceholderIcon size={26} stroke={1.4} />
            </Box>
          )}
        </Group>
      )}
    </Group>
  )

  return (
    <Card withBorder radius="lg" p={0} style={SURFACE_STYLE} {...cardProps}>
      {isTop && hasHeader && (
        <Box p="lg" style={HEADER_STYLE}>
          {header}
        </Box>
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
