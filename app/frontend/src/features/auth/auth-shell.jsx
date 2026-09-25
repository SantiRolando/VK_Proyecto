import { Card, Container, Text, Title } from '@mantine/core'

// Contenedor común de las pantallas de autenticación: título centrado y
// card con el formulario. Mobile-first (ancho máx. 420).
export function AuthShell({ title, subtitle, children }) {
  return (
    <Container size={420} py="xl">
      <Title order={1} ta="center">
        {title}
      </Title>
      {subtitle && (
        <Text c="dimmed" ta="center" mt="xs">
          {subtitle}
        </Text>
      )}
      <Card withBorder radius="md" padding="lg" mt="lg">
        {children}
      </Card>
    </Container>
  )
}
