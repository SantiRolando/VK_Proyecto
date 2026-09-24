import { Container, Text, Title } from '@mantine/core'
import { useI18n } from '../i18n/context.js'

// Página placeholder del esqueleto de rutas (T015): título traducido +
// aviso de "próximamente". Cada pantalla real reemplaza su stub al iterar
// la historia correspondiente.
export function StubPage({ titleKey }) {
  const { t } = useI18n()

  return (
    <Container size="md" py="xl">
      <Title order={1}>{t(titleKey)}</Title>
      <Text c="dimmed" mt="sm">
        {t('common.comingSoon')}
      </Text>
    </Container>
  )
}
