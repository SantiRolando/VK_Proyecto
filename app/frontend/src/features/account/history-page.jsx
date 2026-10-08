import { routes } from '@app/routes.js'
import { DateTime } from '@components/date-time.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { SizeBadge } from '@components/size-badge.jsx'
import { env } from '@config/env.js'
import { Audience } from '@constants/enums.js'
import { useHistory } from '@features/account/hooks/use-history.js'
import { useResolvedProfile } from '@features/account/hooks/use-profiles.js'
import { FeedbackDrawer } from '@features/feedback/feedback-drawer.jsx'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Card, Container, Group, Select, Stack, Text } from '@mantine/core'
import { IconHistory, IconRulerMeasure } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

const ALL = 'all'

/*
  Historial de mediciones: cronológico, por perfil, con
  acceso a calificar las que quedaron pendientes.
*/
export function HistoryPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { profiles } = useResolvedProfile()

  // Arranca con todos los perfiles: las mediciones hechas como invitado o sin
  // perfil no pertenecen a ninguno y quedarían ocultas.
  const [selected, setSelected] = useState(ALL)
  const [rating, setRating] = useState(null)

  const query = useHistory(selected === ALL ? null : Number(selected))

  const options = [
    { value: ALL, label: t('account.history.allProfiles') },
    ...profiles.map((item) => ({ value: String(item.id), label: item.name })),
  ]

  const profileName = (profileId) =>
    profiles.find((item) => item.id === profileId)?.name ?? null

  return (
    <Container size="md" py="xl">
      <PageHeader
        title={t('account.history.title')}
        subtitle={t('account.history.subtitle')}
        actions={
          <Select
            data={options}
            value={selected}
            onChange={(value) => setSelected(value ?? ALL)}
            allowDeselect={false}
            w={200}
            aria-label={t('account.history.filter')}
          />
        }
      />

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data &&
          (query.data.length === 0 ? (
            <EmptyState
              icon={IconHistory}
              title={t('account.history.empty')}
              description={t('account.history.emptyBody')}
              action={
                <Button onClick={() => navigate(routes.fit())}>
                  {t('account.history.measure')}
                </Button>
              }
            />
          ) : (
            <Stack gap="sm">
              {query.data.map((generation) => (
                <Card key={generation.id} withBorder radius="md" padding="md">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <div>
                      <Group gap="xs" wrap="nowrap">
                        <Text fw={600}>{t(`enums.line.${generation.line}`)}</Text>
                        {generation.audience === Audience.Kids && (
                          <Badge variant="light" color="gray">
                            {t('enums.audience.Kids')}
                          </Badge>
                        )}
                        {generation.suggestedSize ? (
                          <SizeBadge code={generation.suggestedSize.code} />
                        ) : (
                          <Badge variant="light" color="orange">
                            {t('fit.result.referredBadge')}
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" mt={4}>
                        <DateTime
                          value={generation.createdAt}
                          options={{ dateStyle: 'medium', timeStyle: 'short' }}
                        />
                        {generation.source &&
                          ` · ${t(`enums.source.${generation.source}`)}`}
                        {selected === ALL &&
                          profileName(generation.profileId) &&
                          ` · ${profileName(generation.profileId)}`}
                      </Text>
                    </div>

                    {generation.rating ? (
                      <Badge variant="light" color="blue">
                        {t(`enums.rating.${generation.rating}`)}
                      </Badge>
                    ) : env.isHybrid ? null : (
                      <Button
                        variant="light"
                        size="compact-md"
                        rightSection={<IconRulerMeasure size={14} />}
                        onClick={() => setRating(generation)}
                      >
                        {t('feedback.rate')}
                      </Button>
                    )}
                  </Group>

                  {generation.comment && (
                    <Text size="sm" c="dimmed" mt="sm" fs="italic">
                      “{generation.comment}”
                    </Text>
                  )}
                </Card>
              ))}
            </Stack>
          ))}
      </QueryBoundary>

      <FeedbackDrawer
        opened={rating !== null}
        onClose={() => setRating(null)}
        generation={rating ?? {}}
      />
    </Container>
  )
}
