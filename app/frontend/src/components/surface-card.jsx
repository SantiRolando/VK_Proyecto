import { Box, Card, Group, Text } from '@mantine/core'

/*
  Superficie elevada y reutilizable: sobre el blanco liso del fondo, una tarjeta del mismo color
  con un borde se lee como un rectángulo dibujado. Los tokens `--vk-surface-*` viven en el tema.

  `titleSectionVariant="top"` pone el encabezado en una franja propia, con icono, descripción y
  un slot a la derecha; sin la prop queda el título suelto arriba, como estaban las tarjetas.
  El padding lo maneja el componente: pasar `p` por las props rompe la franja.
*/

const SURFACE_STYLE = {
  background: 'var(--vk-surface-background)',
  borderColor: 'var(--vk-surface-border)',
  boxShadow: 'var(--vk-surface-shadow)',
}

/*
  La franja va en un `Box` y no en `Card.Section`: la sección de Mantine se sale de la card con
  un margen negativo igual a su padding y el recorte le come el encabezado al radio de la esquina.
*/
const HEADER_STYLE = {
  borderBottom: '1px solid var(--vk-surface-border)',
  background: 'var(--vk-surface-header-background)',
}

const ICON_STYLE = { color: 'var(--vk-accent)', flexShrink: 0 }
const PLACEHOLDER_ICON_STYLE = { color: 'var(--mantine-color-dimmed)' }
// Un CTA o una badge conservan su ancho: encogidos no se leen.
const RIGHT_SECTION_STYLE = { flexShrink: 0 }

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

  /*
    La fila del encabezado wrapea y el slot de la derecha no se encoge. Sin eso, en un teléfono
    el título y la descripción se quedan con el ancho y empujan la badge por debajo de su
    contenido: Mantine la recorta y "Equilibrada" queda en "E.".
  */
  const header = (
    <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
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
        <Group
          gap="sm"
          align="center"
          wrap="nowrap"
          ml="auto"
          style={RIGHT_SECTION_STYLE}
        >
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
