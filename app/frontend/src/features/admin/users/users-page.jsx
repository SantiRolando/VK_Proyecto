import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import {
  useSetUserRole,
  useUsers,
  useUsersAnalytics,
} from '@features/admin/users/hooks/use-users.js'
import { useAuth } from '@features/auth/auth-context.js'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconAlertTriangle,
  IconChartHistogram,
  IconShieldCheck,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react'
import { CHART_ACCENT } from '@theme/theme.js'
import { lazy, Suspense, useState } from 'react'

// `recharts` (~395 kB) queda en su propio chunk: se carga recién cuando esta
// pantalla se abre, igual que en el dashboard.
const BarChart = lazy(() =>
  import('@mantine/charts').then((module) => ({ default: module.BarChart })),
)

// Tarjeta de indicador: valor grande + etiqueta + detalle opcional.
function Stat({ icon: Icon, label, value, hint, tone = 'blue' }) {
  return (
    <Card withBorder radius="md" padding="md">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon variant="light" color={tone} size="lg" radius="md" aria-hidden>
          <Icon size={20} stroke={1.5} />
        </ThemeIcon>
        <div>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Title order={2} size="h2">
            {value}
          </Title>
          {hint && (
            <Text size="xs" c="dimmed">
              {hint}
            </Text>
          )}
        </div>
      </Group>
    </Card>
  )
}

// Usuarios de la plataforma: padrón completo, alta/revocación de administrador y
// los indicadores de uso (bug squash sesión #1).
export function UsersPage() {
  const { t, formatDate } = useI18n()
  const { user: currentUser } = useAuth()
  const [role, setRole] = useState('all')
  const [activeOnly, setActiveOnly] = useState(false)
  const [error, { open: openError, close: closeError }] = useDisclosure(false)
  const [errorCode, setErrorCode] = useState(null)

  const list = useUsers({
    role: role === 'all' ? undefined : role,
    active: activeOnly ? 'true' : undefined,
  })
  const analytics = useUsersAnalytics()
  const setRoleMutation = useSetUserRole()

  const users = list.data?.data ?? []
  const stats = analytics.data

  const toggleAdmin = async (target) => {
    const nextType = target.type === 'Admin' ? 'Customer' : 'Admin'
    try {
      await setRoleMutation.mutateAsync({ userId: target.id, type: nextType })
    } catch (caught) {
      setErrorCode(caught?.code ?? 'SERVER_ERROR')
      openError()
    }
  }

  // El gráfico necesita una etiqueta corta: "2026-09" -> "sep 26".
  const chartData = (stats?.signupsByMonth ?? []).map((row) => {
    const [year, month] = row.month.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return { ...row, label: formatDate(date, { month: 'short', year: '2-digit' }) }
  })

  return (
    <Container size="lg" py="xl">
      <PageHeader title={t('admin.users.title')} subtitle={t('admin.users.subtitle')} />

      <Stack gap="lg">
        <QueryBoundary
          isLoading={analytics.isPending}
          isError={analytics.isError}
          error={analytics.error}
          onRetry={analytics.refetch}
        >
          {stats && (
            <Stack gap="lg">
              <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md">
                <Stat
                  icon={IconUsers}
                  tone="blue"
                  label={t('admin.users.kpi.total')}
                  value={stats.totalUsers}
                  hint={t('admin.users.kpi.totalHint', {
                    admins: stats.admins,
                    customers: stats.customers,
                  })}
                />
                <Stat
                  icon={IconUserCheck}
                  tone="green"
                  label={t('admin.users.kpi.active')}
                  value={stats.activeNow}
                  hint={t('admin.users.kpi.activeHint', { rate: stats.activeRate })}
                />
                <Stat
                  icon={IconUserPlus}
                  tone="grape"
                  label={t('admin.users.kpi.new')}
                  value={stats.newLastMonth}
                  hint={
                    stats.newGrowth === null
                      ? undefined
                      : t('admin.users.kpi.newGrowth', { growth: stats.newGrowth })
                  }
                />
                <Stat
                  icon={IconShieldCheck}
                  tone="gray"
                  label={t('admin.users.kpi.admins')}
                  value={stats.admins}
                  hint={t('admin.users.kpi.adminsHint')}
                />
              </SimpleGrid>

              <Card withBorder radius="md" padding="lg">
                <Title order={3} size="h4" mb="md">
                  {t('admin.users.chart.title')}
                </Title>
                <Suspense fallback={<div style={{ height: 220 }} />}>
                  <BarChart
                    h={220}
                    data={chartData}
                    dataKey="label"
                    series={[
                      {
                        name: 'signups',
                        color: CHART_ACCENT,
                        label: t('admin.users.chart.series'),
                      },
                    ]}
                  />
                </Suspense>
                <Text size="xs" c="dimmed" mt="xs">
                  {t('admin.users.chart.hint')}
                </Text>
              </Card>
            </Stack>
          )}
        </QueryBoundary>

        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Title order={3} size="h4">
              {t('admin.users.list.title')}
            </Title>
            <Group gap="sm" wrap="wrap">
              <SegmentedControl
                size="xs"
                value={role}
                onChange={setRole}
                data={[
                  { value: 'all', label: t('admin.users.filter.all') },
                  { value: 'Customer', label: t('admin.users.filter.customers') },
                  { value: 'Admin', label: t('admin.users.filter.admins') },
                ]}
              />
              <SegmentedControl
                size="xs"
                value={activeOnly ? 'active' : 'all'}
                onChange={(next) => setActiveOnly(next === 'active')}
                data={[
                  { value: 'all', label: t('admin.users.filter.anyActivity') },
                  { value: 'active', label: t('admin.users.filter.active') },
                ]}
              />
            </Group>
          </Group>

          {error && (
            <Alert
              variant="light"
              color="red"
              icon={<IconAlertTriangle size={18} />}
              mb="md"
              withCloseButton
              onClose={closeError}
            >
              {t(`admin.users.error.${errorCode}`)}
            </Alert>
          )}

          <QueryBoundary
            isLoading={list.isPending}
            isError={list.isError}
            error={list.error}
            onRetry={list.refetch}
          >
            {users.length === 0 ? (
              <EmptyState
                icon={IconUsers}
                title={t('admin.users.empty')}
                description={t('admin.users.emptyBody')}
              />
            ) : (
              <Table.ScrollContainer minWidth={760}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('admin.users.column.user')}</Table.Th>
                      <Table.Th>{t('admin.users.column.role')}</Table.Th>
                      <Table.Th>{t('admin.users.column.since')}</Table.Th>
                      <Table.Th>{t('admin.users.column.activity')}</Table.Th>
                      <Table.Th>{t('admin.users.column.actions')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((row) => {
                      const isSelf = row.id === currentUser?.id
                      return (
                        <Table.Tr key={row.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {row.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {row.email}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              color={row.type === 'Admin' ? 'gray' : 'blue'}
                            >
                              {t(`enums.userType.${row.type}`)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatDate(row.createdAt)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c={row.lastActivity ? undefined : 'dimmed'}>
                              {row.lastActivity
                                ? formatDate(row.lastActivity)
                                : t('admin.users.noActivity')}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Button
                              variant="subtle"
                              size="compact-xs"
                              disabled={isSelf || setRoleMutation.isPending}
                              title={
                                isSelf ? t('admin.users.cannotDemoteSelf') : undefined
                              }
                              onClick={() => toggleAdmin(row)}
                            >
                              {row.type === 'Admin'
                                ? t('admin.users.revoke')
                                : t('admin.users.grant')}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </QueryBoundary>

          {stats && (
            <Group gap="xs" mt="md">
              <IconChartHistogram size={14} />
              <Text size="xs" c="dimmed">
                {t('admin.users.showing', {
                  count: users.length,
                  total: stats.totalUsers,
                })}
              </Text>
            </Group>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
