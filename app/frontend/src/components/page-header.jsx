import { Group, Text, Title } from '@mantine/core'

// Encabezado de página consistente: título, subtítulo y acciones a la
// derecha (típicamente el botón principal de la pantalla).
export function PageHeader({ title, subtitle, actions }) {
  return (
    <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap">
      <div>
        <Title order={1}>{title}</Title>
        {subtitle && (
          <Text c="dimmed" mt={4}>
            {subtitle}
          </Text>
        )}
      </div>
      {actions}
    </Group>
  )
}
