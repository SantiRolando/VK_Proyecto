import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { SurfaceCard, SurfaceIcon } from '@components/surface-card.jsx'
import { UserType } from '@constants/enums.js'
import {
  useSetUserRole,
  useUsers,
  useUsersAnalytics,
} from '@features/admin/users/hooks/use-users.js'
import { useAuth } from '@features/auth/auth-context.js'
import { isAdmin } from '@features/auth/permissions.js'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconAlertTriangle,
  IconChartHistogram,
  IconShieldCheck,
  IconUserCheck,
  IconUserMinus,
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
function Stat({ icon: Icon, label, value, hint }) {
  return (
    <SurfaceCard>
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <SurfaceIcon icon={Icon} />
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
    </SurfaceCard>
  )
}

/*
  Identidad de la cuenta: el nombre y el correo. El `truncate` es para la card de móvil, donde
  un correo largo no tiene dónde cortar.
*/
function UserIdentity({ user }) {
  return (
    <div>
      <Text size="sm" fw={500} truncate>
        {user.name}
      </Text>
      <Text size="xs" c="dimmed" truncate>
        {user.email}
      </Text>
    </div>
  )
}

/*
  Usuarios de la plataforma: directorio completo, alta/revocación de administrador y
  los indicadores de uso.
*/
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

  const users = list.data?.items ?? []
  const stats = analytics.data

  const toggleAdmin = async (target) => {
    const nextType = isAdmin(target) ? UserType.Customer : UserType.Admin
    try {
      await setRoleMutation.mutateAsync({ userId: target.id, type: nextType })
    } catch (caught) {
      setErrorCode(caught?.code ?? 'SERVER_ERROR')
      openError()
    }
  }

  /*
    El botón de rol va en la columna de acciones y en el slot derecho de la card de móvil. El
    propio queda deshabilitado: la salvaguarda del último administrador la sostiene el endpoint.
  */
  const roleButton = (row) => {
    const isSelf = row.id === currentUser?.id
    const isTargetAdmin = isAdmin(row)
    return (
      <Button
        variant="light"
        size="compact-sm"
        disabled={isSelf || setRoleMutation.isPending}
        title={isSelf ? t('admin.users.cannotDemoteSelf') : undefined}
        onClick={() => toggleAdmin(row)}
        rightSection={
          isTargetAdmin ? <IconUserMinus size={14} /> : <IconUserPlus size={14} />
        }
      >
        {isTargetAdmin ? t('admin.users.revoke') : t('admin.users.grant')}
      </Button>
    )
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
                  label={t('admin.users.kpi.total')}
                  value={stats.totalUsers}
                  hint={t('admin.users.kpi.totalHint', {
                    admins: stats.admins,
                    customers: stats.customers,
                  })}
                />
                <Stat
                  icon={IconUserCheck}
                  label={t('admin.users.kpi.active')}
                  value={stats.activeNow}
                  hint={t('admin.users.kpi.activeHint', { rate: stats.activeRate })}
                />
                <Stat
                  icon={IconUserPlus}
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
                  label={t('admin.users.kpi.admins')}
                  value={stats.admins}
                  hint={t('admin.users.kpi.adminsHint')}
                />
              </SimpleGrid>

              <SurfaceCard
                titleSectionVariant="top"
                icon={IconChartHistogram}
                title={t('admin.users.chart.title')}
              >
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
              </SurfaceCard>
            </Stack>
          )}
        </QueryBoundary>

        <SurfaceCard
          titleSectionVariant="top"
          icon={IconUsers}
          title={t('admin.users.list.title')}
        >
          <Group justify="flex-end" mb="md" gap="sm" wrap="wrap">
            <SegmentedControl
              size="xs"
              value={role}
              onChange={setRole}
              data={[
                { value: 'all', label: t('admin.users.filter.all') },
                { value: UserType.Customer, label: t('admin.users.filter.customers') },
                { value: UserType.Admin, label: t('admin.users.filter.admins') },
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
              <ResponsiveList
                data={users}
                getKey={(row) => row.id}
                minWidth={760}
                verticalSpacing="sm"
                highlightOnHover
                cardTitle={(row) => <UserIdentity user={row} />}
                cardActions={roleButton}
                columns={[
                  {
                    key: 'user',
                    header: t('admin.users.column.user'),
                    hideInCard: true,
                    render: (row) => <UserIdentity user={row} />,
                  },
                  {
                    key: 'role',
                    header: t('admin.users.column.role'),
                    render: (row) => (
                      <Badge variant="light" color={isAdmin(row) ? 'gray' : 'blue'}>
                        {t(`enums.userType.${row.type}`)}
                      </Badge>
                    ),
                  },
                  {
                    key: 'since',
                    header: t('admin.users.column.since'),
                    render: (row) => <Text size="sm">{formatDate(row.createdAt)}</Text>,
                  },
                  {
                    key: 'activity',
                    header: t('admin.users.column.activity'),
                    render: (row) => (
                      <Text size="sm" c={row.lastActivity ? undefined : 'dimmed'}>
                        {row.lastActivity
                          ? formatDate(row.lastActivity)
                          : t('admin.users.noActivity')}
                      </Text>
                    ),
                  },
                  {
                    key: 'actions',
                    header: t('admin.users.column.actions'),
                    hideInCard: true,
                    render: roleButton,
                  },
                ]}
              />
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
        </SurfaceCard>
      </Stack>
    </Container>
  )
}
