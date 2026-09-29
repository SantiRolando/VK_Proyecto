import { routes } from '@app/routes.js'
import { useI18n } from '@i18n/context.js'
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react'
import { Link } from 'react-router'

// 404: texto centrado, código grande en rojo y señal de advertencia.
// Se usa como fallback del router (`path="*"`).
export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="md" className="text-center">
        <IconAlertTriangle
          size={56}
          stroke={1.5}
          aria-hidden
          color="var(--mantine-color-red-6)"
        />
        <Title
          order={1}
          c="red.7"
          style={{ fontSize: 'clamp(4rem, 15vw, 7rem)', lineHeight: 1 }}
        >
          404
        </Title>
        <Title order={2}>{t('notFound.title')}</Title>
        <Text c="dimmed">{t('notFound.body')}</Text>
        <Group justify="center" mt="sm">
          <Button
            component={Link}
            to={routes.home}
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
          >
            {t('notFound.backHome')}
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
