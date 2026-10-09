import { Box, Card, Group, Text } from '@mantine/core'

/*
  Superficie elevada y reutilizable. `titleSectionVariant="top"` pone el encabezado en una
  franja propia, con icono, descripción y un slot a la derecha. El padding lo maneja el
  componente: pasar `p` por las props rompe la franja.
*/

const SURFACE_STYLE = {
  background: 'var(--vk-surface-background)',
  borderColor: 'var(--vk-surface-border)',
  boxShadow: 'var(--vk-surface-shadow)',
}

/*
  Tarjeta hundida dentro de una superficie: invierte el fondo para no apilar sombra sobre
  sombra. Acepta el mismo encabezado que la superficie, sin franja.
*/
const INSET_STYLE = {
  background: 'var(--vk-surface-inset-background)',
  borderColor: 'var(--vk-surface-border)',
}

/*
  La franja va en un `Box`: `Card.Section` se sale de la card y el recorte le come el
  encabezado al radio de la esquina.
*/
const HEADER_STYLE = {
  borderBottom: '1px solid var(--vk-surface-border)',
  background: 'var(--vk-surface-header-background)',
}

const ICON_STYLE = { color: 'var(--vk-accent)', flexShrink: 0 }
const PLACEHOLDER_ICON_STYLE = { color: 'var(--mantine-color-dimmed)' }
const RIGHT_SECTION_STYLE = { flexShrink: 0 }

/*
  Icono de la superficie: sin fondo, en el color de acento del tema. Lo usa el encabezado y las
  tarjetas que necesitan el mismo icono con un cuerpo propio, como los indicadores.
*/
export function SurfaceIcon({ icon: Icon, size = 22 }) {
  return (
    <Box style={ICON_STYLE} mt={2}>
      <Icon size={size} stroke={1.7} />
    </Box>
  )
}

function hasHeader({ title, description, icon, rightSection, placeholderIcon }) {
  return Boolean(title || description || icon || rightSection || placeholderIcon)
}

/*
  Encabezado de una tarjeta: icono, título, descripción y un slot a la derecha. La fila wrapea y
  el slot no se encoge: sin eso la badge se recorta a "E." en un teléfono.
*/
function CardHeader({
  title,
  description,
  icon: Icon,
  rightSection,
  placeholderIcon: PlaceholderIcon,
  size,
}) {
  return (
    <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
      <Group gap="sm" align="flex-start" wrap="nowrap">
        {Icon && <SurfaceIcon icon={Icon} />}
        <div>
          {title && (
            <Text fw={600} size={size}>
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
}

export function SurfaceCard({
  title,
  description,
  icon,
  titleSectionVariant = 'default',
  rightSection,
  placeholderIcon,
  children,
  ...cardProps
}) {
  const isTop = titleSectionVariant === 'top'
  const header = { title, description, icon, rightSection, placeholderIcon }
  const withHeader = hasHeader(header)

  return (
    <Card withBorder radius="lg" p={0} style={SURFACE_STYLE} {...cardProps}>
      {isTop && withHeader && (
        <Box p="lg" style={HEADER_STYLE}>
          <CardHeader {...header} size="lg" />
        </Box>
      )}

      <Box p="lg">
        {!isTop && withHeader && (
          <Box mb="md">
            <CardHeader {...header} size="md" />
          </Box>
        )}
        {children}
      </Box>
    </Card>
  )
}

export function InsetCard({
  title,
  description,
  icon,
  rightSection,
  children,
  ...cardProps
}) {
  const header = { title, description, icon, rightSection }

  return (
    <Card withBorder radius="md" p="md" style={INSET_STYLE} {...cardProps}>
      {hasHeader(header) && (
        <Box mb="md">
          <CardHeader {...header} size="md" />
        </Box>
      )}
      {children}
    </Card>
  )
}
