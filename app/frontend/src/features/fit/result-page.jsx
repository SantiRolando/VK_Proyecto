import { routes } from '@app/routes.js'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { lineToSlug } from '@constants/lines.js'
import { useAuth } from '@features/auth/auth-context.js'
import { FeedbackDrawer } from '@features/feedback/feedback-drawer.jsx'
import { useGeneration } from '@features/fit/hooks/use-generation.js'
import { SaveProfileModal } from '@features/fit/save-profile-modal.jsx'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCircleOff,
  IconMessageStar,
  IconUserCheck,
  IconUserPlus,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router'

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

// Con sesión, el resultado se puede guardar como perfil de medidas (US5/T074).
function SaveProfileCard({ generation }) {
  const { t } = useI18n()
  const { isAuthenticated } = useAuth()
  const [opened, { open, close }] = useDisclosure(false)

  if (!isAuthenticated) return null

  return (
    <Card withBorder radius="md" padding="lg">
      <Group gap="sm" wrap="nowrap">
        <IconUserCheck size={28} stroke={1.5} />
        <div>
          <Text fw={600}>{t('fit.result.saveProfile')}</Text>
          <Text size="sm" c="dimmed" mt={2}>
            {t('fit.result.saveProfileBody')}
          </Text>
        </div>
      </Group>
      <Button mt="md" fullWidth variant="light" onClick={open}>
        {t('fit.result.saveProfileCta')}
      </Button>

      <SaveProfileModal opened={opened} onClose={close} generation={generation} />
    </Card>
  )
}

// Feedback del talle (US6): Chico/Correcto/Grande + comentario. Disponible
// también para invitados (sin puntos, Q-15).
function FeedbackCard({ generation, onRated }) {
  const { t } = useI18n()
  const [opened, { open, close }] = useDisclosure(false)

  if (generation.rating) {
    return (
      <Card withBorder radius="md" padding="lg">
        <Group gap="sm" wrap="nowrap">
          <Badge variant="light" color="vikinga">
            {t(`enums.rating.${generation.rating}`)}
          </Badge>
          <Text size="sm" c="dimmed">
            {t('feedback.thanks')}
          </Text>
        </Group>
        {generation.comment && (
          <Text size="sm" c="dimmed" mt="sm" fs="italic">
            “{generation.comment}”
          </Text>
        )}
      </Card>
    )
  }

  return (
    <Card withBorder radius="md" padding="lg">
      <Group gap="sm" wrap="nowrap">
        <IconMessageStar size={28} stroke={1.5} />
        <div>
          <Text fw={600}>{t('feedback.title')}</Text>
          <Text size="sm" c="dimmed" mt={2}>
            {t('feedback.prompt')}
          </Text>
        </div>
      </Group>
      <Button mt="md" fullWidth variant="light" onClick={open}>
        {t('feedback.rate')}
      </Button>

      <FeedbackDrawer
        opened={opened}
        onClose={close}
        generation={generation}
        onRated={onRated}
      />
    </Card>
  )
}

// Resultado de la generación (US1): talle, línea, stock, CTA de registro para
// invitados y feedback (US6).
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
            <SaveProfileCard generation={query.data} />
            <FeedbackCard generation={query.data} onRated={query.refetch} />
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
