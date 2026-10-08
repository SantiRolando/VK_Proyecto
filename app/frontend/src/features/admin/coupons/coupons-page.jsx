import { routes } from '@app/routes.js'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { SurfaceCard } from '@components/surface-card.jsx'
import { CouponFormModal } from '@features/admin/coupons/coupon-form-modal.jsx'
import { CouponsList } from '@features/admin/coupons/coupons-list.jsx'
import { useAdminCoupons } from '@features/admin/coupons/hooks/use-coupons.js'
import { useI18n } from '@i18n/context.js'
import { Button, Container, Stack } from '@mantine/core'
import { IconGift, IconPlus, IconSettings, IconTicket } from '@tabler/icons-react'
import { useState } from 'react'
import { Link } from 'react-router'

/*
  Cupones del panel: plantillas canjeables y cupones asignados. El costo de canje que se
  edita acá es el que ve el cliente en recompensas.
*/
export function CouponsPage() {
  const { t } = useI18n()
  const query = useAdminCoupons()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)

  const coupons = query.data?.items ?? []

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.coupons.title')}
        subtitle={t('admin.coupons.subtitle')}
        actions={
          <Button rightSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            {t('admin.coupons.new')}
          </Button>
        }
      />

      <Stack gap="lg">
        <SurfaceCard
          icon={IconGift}
          title={t('admin.coupons.points.title')}
          description={t('admin.coupons.points.description')}
          rightSection={
            <Button
              component={Link}
              to={routes.adminSettings}
              variant="light"
              rightSection={<IconSettings size={16} />}
            >
              {t('admin.coupons.points.action')}
            </Button>
          }
        />

        <QueryBoundary
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
        >
          {query.data &&
            (coupons.length === 0 ? (
              <EmptyState icon={IconTicket} title={t('admin.coupons.empty')} />
            ) : (
              <CouponsList coupons={coupons} onEdit={setEditing} />
            ))}
        </QueryBoundary>
      </Stack>

      {creating && (
        <CouponFormModal
          coupon={null}
          takenCodes={coupons.map((item) => item.code)}
          opened
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <CouponFormModal
          key={editing.id}
          coupon={editing}
          takenCodes={coupons
            .filter((item) => item.id !== editing.id)
            .map((item) => item.code)}
          opened
          onClose={() => setEditing(null)}
        />
      )}
    </Container>
  )
}
