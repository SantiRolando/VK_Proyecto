import { Center, Stack, Text, ThemeIcon } from '@mantine/core'

// Estado vacío consistente (FR-029): ícono, título, descripción y acción
// opcional (p. ej. un botón para crear el primer registro).
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs" maw={360} ta="center">
        {Icon && (
          <ThemeIcon variant="light" size={48} radius="xl">
            <Icon size={24} stroke={1.5} />
          </ThemeIcon>
        )}
        <Text fw={600}>{title}</Text>
        {description && (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  )
}
