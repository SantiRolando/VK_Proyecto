import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { useCancelRestock } from '@features/catalog/hooks/use-cancel-restock.js'
import { useRestockAlerts } from '@features/catalog/hooks/use-restock-alerts.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Card, Container, Group, Stack, Text } from '@mantine/core'
import { IconBell } from '@tabler/icons-react'

// Mis avisos de reposición (US3): suscripciones agrupadas por línea × talle.
export function AlertsPage() {
  const { t } = useI18n()
  const query = useRestockAlerts()
  const cancel = useCancelRestock()

  return (
    <Container size="md" py="xl">
      <PageHeader title={t('account.alerts.title')} />

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data &&
          (query.data.length === 0 ? (
            <EmptyState icon={IconBell} title={t('account.alerts.empty')} />
          ) : (
            <Stack gap="sm">
              {query.data.map((group) => (
                <Card key={group.key} withBorder radius="md" padding="md">
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Text fw={600}>
                        {t(`enums.line.${group.line}`)} · {group.size.code}
                      </Text>
                      <Group gap="xs" mt={4}>
                        <Badge
                          variant="light"
                          color={group.status === 'Active' ? 'blue' : 'teal'}
                        >
                          {t(`enums.alertStatus.${group.status}`)}
                        </Badge>
                      </Group>
                    </div>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      loading={cancel.isPending}
                      onClick={() => cancel.mutate(group.ids)}
                    >
                      {t('account.alerts.cancel')}
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          ))}
      </QueryBoundary>
    </Container>
  )
}
