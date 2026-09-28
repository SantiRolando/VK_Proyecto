import { routes } from '@app/routes.js'
import { ChannelBadge } from '@components/channel-badge.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { OrderSummary } from '@components/order-summary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { SaleStatusBadge } from '@components/sale-status-badge.jsx'
import { useAdminSale } from '@features/admin/sales/hooks/use-admin-sale.js'
import { useUpdateSaleStatus } from '@features/admin/sales/hooks/use-update-sale-status.js'
import { useI18n } from '@i18n/context.js'
import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { addressFullLine } from '@utils/address.js'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

// Presentación de cada transición. Cuáles se pueden hacer lo dice el backend
// (`allowedTransitions`): el FE no conoce la máquina de estados.
const ACTIONS = {
  Contacted: {
    color: 'vikinga',
    labelKey: 'admin.sales.actions.contacted',
    bodyKey: 'admin.sales.confirm.body.contacted',
  },
  Confirmed: {
    color: 'green',
    labelKey: 'admin.sales.actions.confirmed',
    bodyKey: 'admin.sales.confirm.body.confirmed',
  },
  Cancelled: {
    color: 'red',
    labelKey: 'admin.sales.actions.cancelled',
    bodyKey: 'admin.sales.confirm.body.cancelled',
  },
}

function DatedRow({ label, value }) {
  const { formatDate } = useI18n()
  if (!value) return null

  return (
    <Group justify="space-between" gap="sm">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm">
        {formatDate(value, { dateStyle: 'medium', timeStyle: 'short' })}
      </Text>
    </Group>
  )
}

// Detalle de una venta (US7/T069): cliente, logística, canal y acciones con
// confirmación. Confirmar descuenta stock; cancelar libera la reserva.
export function AdminSaleDetailPage() {
  const { t } = useI18n()
  const { saleId } = useParams()
  const navigate = useNavigate()
  const query = useAdminSale(Number(saleId))
  const updateStatus = useUpdateSaleStatus()

  const [pendingAction, setPendingAction] = useState(null)
  const [actionError, setActionError] = useState(null)

  const sale = query.data

  const closeModal = () => {
    setPendingAction(null)
    setActionError(null)
  }

  const handleConfirm = async () => {
    setActionError(null)
    try {
      await updateStatus.mutateAsync({ saleId: sale.id, status: pendingAction })
      closeModal()
    } catch (error) {
      setActionError(error)
    }
  }

  return (
    <Container size="lg" py="xl">
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {sale && (
          <Stack gap="lg">
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(routes.adminSales)}
            >
              {t('admin.sales.detail.back')}
            </Button>

            <PageHeader
              title={t('admin.sales.detail.title', { id: sale.id })}
              subtitle={t('admin.sales.days', { days: sale.ageDays })}
              actions={
                <Group gap="xs">
                  {sale.isStale && (
                    <Badge variant="light" color="orange">
                      {t('admin.sales.stale')}
                    </Badge>
                  )}
                  <SaleStatusBadge status={sale.status} />
                </Group>
              }
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Card withBorder radius="md" padding="md">
                <Stack gap="xs">
                  <Text fw={600}>{t('admin.sales.detail.customer')}</Text>
                  <Text size="sm">{sale.customer?.name}</Text>
                  <Text size="sm" c="dimmed">
                    {t('admin.sales.detail.phone')}: {sale.customer?.whatsappPhone}
                  </Text>
                  <Anchor size="sm" href={`mailto:${sale.customer?.email}`}>
                    {sale.customer?.email}
                  </Anchor>
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="md">
                <Stack gap="xs">
                  <Text fw={600}>{t('admin.sales.detail.coordination')}</Text>
                  <Group gap="xs">
                    <ChannelBadge channel={sale.channel} />
                    <Badge variant="light" color="gray">
                      {t(`enums.deliveryMethod.${sale.deliveryMethod}`)}
                    </Badge>
                  </Group>
                  {sale.address && <Text size="sm">{addressFullLine(sale.address)}</Text>}
                  {sale.coupon && (
                    <Text size="sm" c="dimmed">
                      {t('admin.sales.detail.coupon')}: {sale.coupon.code}
                    </Text>
                  )}
                  <DatedRow
                    label={t('admin.sales.detail.createdAt')}
                    value={sale.createdAt}
                  />
                  <DatedRow
                    label={t('admin.sales.detail.contactedAt')}
                    value={sale.contactedAt}
                  />
                  <DatedRow
                    label={t('admin.sales.detail.confirmedAt')}
                    value={sale.confirmedAt}
                  />
                  <DatedRow
                    label={t('admin.sales.detail.cancelledAt')}
                    value={sale.cancelledAt}
                  />
                </Stack>
              </Card>
            </SimpleGrid>

            <OrderSummary
              lines={sale.lines}
              subtotal={sale.subtotal}
              discount={sale.discount}
              total={sale.total}
            />

            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Text fw={600}>{t('admin.sales.detail.actions')}</Text>

                {sale.allowedTransitions.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    {t('admin.sales.noActions')}
                  </Text>
                ) : (
                  <Group gap="xs">
                    {sale.allowedTransitions.map((status) => (
                      <Button
                        key={status}
                        variant="light"
                        color={ACTIONS[status]?.color ?? 'gray'}
                        onClick={() => setPendingAction(status)}
                      >
                        {t(ACTIONS[status]?.labelKey ?? status)}
                      </Button>
                    ))}
                  </Group>
                )}
              </Stack>
            </Card>

            <Modal
              opened={pendingAction !== null}
              onClose={closeModal}
              title={t('admin.sales.confirm.title')}
              centered
            >
              <Stack gap="md">
                <Text size="sm">
                  {pendingAction && t(ACTIONS[pendingAction].bodyKey, { id: sale.id })}
                </Text>

                {actionError && <ErrorState error={actionError} />}

                <Group justify="flex-end" gap="xs">
                  <Button variant="default" onClick={closeModal}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    color={ACTIONS[pendingAction]?.color ?? 'gray'}
                    loading={updateStatus.isPending}
                    onClick={handleConfirm}
                  >
                    {t('admin.sales.confirm.accept')}
                  </Button>
                </Group>
              </Stack>
            </Modal>
          </Stack>
        )}
      </QueryBoundary>
    </Container>
  )
}
