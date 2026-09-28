import { Container, Title } from '@mantine/core'

export function Section({ id, title, alt = false, children }) {
  return (
    <section id={id} className={`px-4 py-24 ${alt ? 'bg-gray-100' : 'bg-white'}`}>
      <Container size="sm">
        <Title order={2} c="black">
          {title}
        </Title>
        {children}
      </Container>
    </section>
  )
}
