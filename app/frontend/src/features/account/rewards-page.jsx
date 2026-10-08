import { DateTime } from '@components/date-time.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { PageHeader } from '@components/page-header.jsx'
import {
  useMyCoupons,
  usePoints,
  useRedeemCoupon,
  useRewardTemplates,
} from '@features/account/hooks/use-rewards.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCoin, IconTicket, IconTrophy } from '@tabler/icons-react'
import { useState } from 'react'

// Beneficio del cupón: porcentaje o monto fijo (mismo criterio que el checkout).
function CouponBenefit({ coupon }) {
  if (coupon.discountType === 'Fixed') {
    return (
      <Text fw={600}>
        -<Money value={coupon.discountValue} />
      </Text>
    )
  }

  return <Text fw={600}>-{coupon.discountValue}%</Text>
}

function Templates({ balance }) {
  const { t } = useI18n()
  const templates = useRewardTemplates()
  const redeem = useRedeemCoupon()
  const [error, setError] = useState(null)

  const handleRedeem = async (couponId) => {
    setError(null)
    try {
      await redeem.mutateAsync(couponId)
    } catch (redeemError) {
      setError(redeemError)
    }
  }

  return (
    <Stack gap="sm">
      <Title order={2} size="h4">
        <Group gap="xs">
          <IconTrophy size={18} />
          {t('account.rewards.templates')}
        </Group>
      </Title>

      {error && <ErrorState error={error} onRetry={() => setError(null)} />}

      <QueryBoundary
        isLoading={templates.isPending}
        isError={templates.isError}
        error={templates.error}
        onRetry={templates.refetch}
      >
        {templates.data && templates.data.length === 0 && (
          <Text c="dimmed" size="sm">
            {t('account.rewards.noTemplates')}
          </Text>
        )}
        <Stack gap="sm">
          {templates.data?.map((template) => (
            <Card key={template.id} withBorder radius="md" padding="md">
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={600}>{template.code}</Text>
                  <Group gap="xs" mt={4}>
                    <CouponBenefit coupon={template} />
                  </Group>
                </div>
                <Stack gap={4} align="flex-end">
                  <Badge variant="light" color="yellow">
                    {t('account.rewards.cost', { points: template.pointsCost })}
                  </Badge>
                  <Button
                    size="compact-md"
                    disabled={balance < template.pointsCost}
                    loading={redeem.isPending && redeem.variables === template.id}
                    onClick={() => handleRedeem(template.id)}
                  >
                    {t('account.rewards.redeem')}
                  </Button>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      </QueryBoundary>
    </Stack>
  )
}

function MyCoupons() {
  const { t } = useI18n()
  const coupons = useMyCoupons()

  return (
    <Stack gap="sm">
      <Title order={2} size="h4">
        <Group gap="xs">
          <IconTicket size={18} />
          {t('account.rewards.myCoupons')}
        </Group>
      </Title>

      <QueryBoundary
        isLoading={coupons.isPending}
        isError={coupons.isError}
        error={coupons.error}
        onRetry={coupons.refetch}
      >
        {coupons.data && coupons.data.length === 0 ? (
          <Text c="dimmed" size="sm">
            {t('account.rewards.noCoupons')}
          </Text>
        ) : (
          <Stack gap="sm">
            {coupons.data?.map((coupon) => (
              <Card key={coupon.id} withBorder radius="md" padding="md">
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Text fw={600}>{coupon.code}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {t('account.rewards.validUntil')}{' '}
                      <DateTime
                        value={coupon.validUntil}
                        options={{ dateStyle: 'medium' }}
                      />
                    </Text>
                  </div>
                  <CouponBenefit coupon={coupon} />
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </QueryBoundary>
    </Stack>
  )
}

function Movements() {
  const { t } = useI18n()
  const points = usePoints()

  return (
    <Stack gap="sm">
      <Title order={2} size="h4">
        {t('account.rewards.movements')}
      </Title>

      <QueryBoundary
        isLoading={points.isPending}
        isError={points.isError}
        error={points.error}
        onRetry={points.refetch}
      >
        {points.data && points.data.movements.length === 0 ? (
          <Text c="dimmed" size="sm">
            {t('account.rewards.noMovements')}
          </Text>
        ) : (
          <Stack gap={4}>
            {points.data?.movements.map((movement) => (
              <Group key={movement.id} justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="light" color="gray">
                    {t(`enums.pointsMovementType.${movement.type}`)}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    <DateTime
                      value={movement.createdAt}
                      options={{ dateStyle: 'medium' }}
                    />
                  </Text>
                </Group>
                <Text size="sm" fw={600} c={movement.points >= 0 ? 'teal' : 'red'}>
                  {movement.points >= 0 ? '+' : ''}
                  {movement.points}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </QueryBoundary>
    </Stack>
  )
}

/*
  Puntos y cupones: saldo, canje, cupones propios y
  movimientos.
*/
export function RewardsPage() {
  const { t } = useI18n()
  const points = usePoints()
  const balance = points.data?.balance ?? 0

  return (
    <Container size="md" py="xl">
      <PageHeader
        title={t('account.rewards.title')}
        subtitle={t('account.rewards.subtitle')}
      />

      <Card withBorder radius="md" padding="lg" mb="xl">
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size={48} radius="xl" variant="light" color="yellow">
            <IconCoin size={26} />
          </ThemeIcon>
          <div>
            <Text size="sm" c="dimmed">
              {t('account.rewards.balance')}
            </Text>
            <Text fw={800} size="2rem">
              {points.isPending ? '—' : balance}
            </Text>
          </div>
        </Group>
      </Card>

      <Stack gap="xl">
        <Templates balance={balance} />
        <Divider />
        <MyCoupons />
        <Divider />
        <Movements />
      </Stack>
    </Container>
  )
}
