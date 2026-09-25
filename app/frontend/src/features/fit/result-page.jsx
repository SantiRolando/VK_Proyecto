import { Alert, Badge, Button, Card, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCircleOff,
  IconUserPlus,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router'
import { useI18n } from '../../i18n/context.js'
import { useAuth } from '../auth/auth-context.js'
import { routes } from '../../app/routes.js'
import { lineToSlug } from '../../constants/lines.js'
import { QueryBoundary } from '../../components/feedback/query-boundary.jsx'
import { useGeneration } from './hooks/use-generation.js'

function SizeCard({ generation }) {
  const { t } = useI18n()

  return (
    <Paper withBorder p="lg" radius="md" className="text-center">
      <Text c="dimmed" size="sm">
        {t('fit.result.subtitle')}
      </Text>
      <Text fw={900} className="text-8xl" c="vikinga">
        {generation.suggestedSize?.code}
      </Text>
      <Group justify="center" gap="xs" mt="md">
        <Badge variant="light" color="vikinga">
          {t(`enums.line.${generation.line}`)}
        </Badge>
        {generation.dominantMeasure && (
          <Badge variant="light" color="gray">
            {t('fit.result.dominant')}: {t(`fit.measure.${generation.dominantMeasure}`)}
          </Badge>
        )}
      </Group>
    </Paper>
  )
}

function StockState({ generation }) {
  const { t } = useI18n()
  const navigate = useNavigate()

  if (generation.stockAvailableAtQuery) {
    return (
      <Alert
        variant="light"
        color="green"
        title={t('fit.result.inStock')}
        icon={<IconCircleCheck size={18} />}
      >
        <Button
          mt="sm"
          onClick={() =>
            navigate(
              routes.catalog({
                line: lineToSlug(generation.line),
                sizeId: generation.suggestedSize?.id,
                generationId: generation.id,
              }),
            )
          }
        >
          {t('fit.result.seeCatalog')}
        </Button>
      </Alert>
    )
  }

  return (
    <Alert
      variant="light"
      color="orange"
      title={t('fit.result.outOfStock')}
      icon={<IconCircleOff size={18} />}
    >
      <Stack gap="xs" mt="sm">
        {generation.adjacentSizes.length > 0 && (
          <>
            <Text size="sm" fw={600}>
              {t('fit.result.adjacent')}
            </Text>
            <Group gap="xs">
              {generation.adjacentSizes.map((size) => (
                <Badge key={size.id} variant="outline" color="gray">
                  {size.code}
                </Badge>
              ))}
            </Group>
            <Text size="xs" c="dimmed">
              {t('fit.result.adjacentHint')}
            </Text>
          </>
        )}
        {/* Suscripción a reposición: llega en US3. */}
      </Stack>
    </Alert>
  )
}

function RegisterCard() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) return null

  return (
    <Card withBorder radius="md" padding="lg">
      <Group gap="sm" wrap="nowrap">
        <IconUserPlus size={28} stroke={1.5} />
        <div>
          <Text fw={600}>{t('fit.result.register.title')}</Text>
          <Text size="sm" c="dimmed" mt={2}>
            {t('fit.result.register.body')}
          </Text>
        </div>
      </Group>
      <Button mt="md" fullWidth onClick={() => navigate(routes.register)}>
        {t('fit.result.register.cta')}
      </Button>
    </Card>
  )
}

// Resultado de la generación (US1): talle, línea, stock y CTA de registro
// para invitados. El feedback llega en US6.
export function ResultPage() {
  const { t } = useI18n()
  const { generationId } = useParams()
  const navigate = useNavigate()
  const query = useGeneration(Number(generationId))

  return (
    <Container size="sm" py="xl">
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data && (
          <Stack gap="lg">
            <Title order={1}>{t('fit.result.title')}</Title>
            <SizeCard generation={query.data} />
            <StockState generation={query.data} />
            <RegisterCard />
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(routes.fit())}
            >
              {t('fit.result.again')}
            </Button>
          </Stack>
        )}
      </QueryBoundary>
    </Container>
  )
}
