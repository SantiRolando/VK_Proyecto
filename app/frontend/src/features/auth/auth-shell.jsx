import poolImage from '@assets/indoor-swimming-pool.jpg'
import { Card, Container, Text, Title } from '@mantine/core'
import '@theme/auth.css'

// Contenedor común de las pantallas de autenticación: fondo con la imagen de pileta,
// título centrado y card con el formulario.
export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${poolImage})` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-black/45" />

      <Container size={420} py="xl" className="relative">
        <div className="vk-scrim rounded-lg px-4 py-6 sm:px-6">
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
        </div>
      </Container>
    </div>
  )
}
