import { EmptyState } from '@components/feedback/empty-state.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { colorHex, colorLabel } from '@constants/colors.js'
import {
  useAdjustStock,
  useInventory,
  useStockReasons,
} from '@features/admin/inventory/hooks/use-inventory.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Radio,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core'
import { IconAlertTriangle, IconBox, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

const ALL = 'all'
const LINES = ['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']

function ColorDot({ color }) {
  return (
    <Group gap={6} wrap="nowrap">
      <span
        style={{
          backgroundColor: colorHex(color),
          borderRadius: 999,
          display: 'inline-block',
          height: 12,
          width: 12,
        }}
      />
      {colorLabel(color)}
    </Group>
  )
}

// Modal de ajuste (T090): motivo obligatorio; la dirección la impone el motivo
// para los motivos que la fijan (el mock lo informa) y el resto la elige el
// admin. El físico cambia solo por acá, así todo ajuste queda auditado.
function AdjustModal({ variant, opened, onClose }) {
  const { t } = useI18n()
  const reasons = useStockReasons()
  const adjust = useAdjustStock()

  const [reason, setReason] = useState(null)
  const [direction, setDirection] = useState('Inbound')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState(null)

  const selected = reasons.data?.find((item) => item.value === reason)
  const fixedDirection = selected?.direction ?? null
  const open = opened && variant !== null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!reason) return

    setError(null)
    try {
      await adjust.mutateAsync({
        reason,
        direction: fixedDirection ?? direction,
        lines: [{ variantId: variant.id, quantity: Number(quantity) }],
      })
      setReason(null)
      setQuantity(1)
      onClose()
    } catch (adjustError) {
      setError(adjustError)
    }
  }

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={open}
      onClose={onClose}
      title={t('admin.inventory.adjust')}
      centered
    >
      {variant && (
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <div>
              <Text fw={600}>{variant.sku}</Text>
              <Text size="sm" c="dimmed">
                {t('admin.inventory.physical')}: {variant.quantity} ·{' '}
                {t('admin.inventory.reserved')}: {variant.reserved} ·{' '}
                {t('admin.inventory.available')}: {variant.available}
              </Text>
            </div>

            <Radio.Group
              label={t('admin.inventory.reason')}
              value={reason}
              onChange={setReason}
              withAsterisk
            >
              <Stack gap={6} mt="xs">
                {(reasons.data ?? []).map((item) => (
                  <Radio
                    key={item.value}
                    value={item.value}
                    label={t(`enums.transactionReason.${item.value}`)}
                  />
                ))}
              </Stack>
            </Radio.Group>

            {fixedDirection ? (
              <Text size="sm" c="dimmed">
                {t('admin.inventory.directionFixed', {
                  direction: t(`enums.transactionDirection.${fixedDirection}`),
                })}
              </Text>
            ) : (
              <Radio.Group
                label={t('admin.inventory.direction')}
                value={direction}
                onChange={setDirection}
              >
                <Group gap="lg" mt="xs">
                  {['Inbound', 'Outbound'].map((value) => (
                    <Radio
                      key={value}
                      value={value}
                      label={t(`enums.transactionDirection.${value}`)}
                      disabled={!reason}
                    />
                  ))}
                </Group>
              </Radio.Group>
            )}

            <NumberInput
              label={t('admin.inventory.quantity')}
              value={quantity}
              onChange={(value) => setQuantity(Number(value) || 1)}
              min={1}
              required
            />

            {error && <ErrorState error={error} onRetry={() => setError(null)} />}

            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={adjust.isPending} disabled={!reason}>
                {t('admin.inventory.save')}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}

// Inventario por variante (US9/T090): físico / reservado / disponible, alerta
// de stock crítico y ajuste auditado con motivo obligatorio.
export function InventoryPage() {
  const { t } = useI18n()
  const [line, setLine] = useState(ALL)
  const [lowStock, setLowStock] = useState(false)
  const [adjusting, setAdjusting] = useState(null)

  const query = useInventory({
    line: line === ALL ? null : line,
    lowStock: lowStock ? 'true' : null,
    pageSize: 100,
  })

  const items = query.data?.items ?? []

  const columns = [
    {
      key: 'sku',
      header: t('admin.inventory.column.sku'),
      render: (item) => (
        <div>
          <Text fw={600} size="sm">
            {item.sku}
          </Text>
          <Text size="xs" c="dimmed">
            {item.product?.model} · {item.size?.code}
          </Text>
        </div>
      ),
    },
    {
      key: 'color',
      header: t('admin.inventory.column.color'),
      render: (item) => <ColorDot color={item.color} />,
    },
    {
      key: 'physical',
      header: t('admin.inventory.physical'),
      render: (item) => <Text size="sm">{item.quantity}</Text>,
    },
    {
      key: 'reserved',
      header: t('admin.inventory.reserved'),
      render: (item) => <Text size="sm">{item.reserved}</Text>,
    },
    {
      key: 'available',
      header: t('admin.inventory.available'),
      render: (item) => (
        <Text size="sm" fw={600} c={item.isCritical ? 'red' : undefined}>
          {item.available}
        </Text>
      ),
    },
    {
      key: 'min',
      header: t('admin.inventory.min'),
      render: (item) => <Text size="sm">{item.minStock}</Text>,
    },
    {
      key: 'status',
      header: t('admin.inventory.column.status'),
      render: (item) => (
        <Group gap="xs" wrap="nowrap">
          {item.isCritical ? (
            <Badge
              variant="light"
              color="red"
              leftSection={<IconAlertTriangle size={12} />}
            >
              {t('admin.inventory.critical')}
            </Badge>
          ) : (
            <Badge variant="light" color="teal">
              {t('admin.inventory.ok')}
            </Badge>
          )}
          {!item.active && (
            <Badge variant="light" color="gray">
              {t('admin.inventory.inactive')}
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item) => (
        <Button
          variant="light"
          size="compact-sm"
          leftSection={<IconPlus size={14} />}
          onClick={() => setAdjusting(item)}
        >
          {t('admin.inventory.adjust')}
        </Button>
      ),
    },
  ]

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.inventory.title')}
        subtitle={t('admin.inventory.subtitle')}
      />

      <Stack gap="md">
        <Group justify="space-between" gap="sm" wrap="wrap">
          <Group gap="sm" wrap="wrap">
            <Select
              data={[
                { value: ALL, label: t('admin.inventory.filter.allLines') },
                ...LINES.map((value) => ({
                  value,
                  label: t(`enums.line.${value}`),
                })),
              ]}
              value={line}
              onChange={(value) => setLine(value ?? ALL)}
              allowDeselect={false}
              w={200}
              aria-label={t('admin.inventory.filter.line')}
            />
            <Switch
              label={t('admin.inventory.filter.lowStock')}
              checked={lowStock}
              onChange={(event) => setLowStock(event.currentTarget.checked)}
            />
          </Group>

          {query.data && (
            <Text size="sm" c="dimmed">
              {t('admin.inventory.results', { count: query.data.meta.total })}
            </Text>
          )}
        </Group>

        <QueryBoundary
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
        >
          {query.data &&
            (items.length === 0 ? (
              <EmptyState icon={IconBox} title={t('admin.inventory.empty')} />
            ) : (
              <ResponsiveList
                data={items}
                getKey={(item) => item.id}
                columns={columns}
                minWidth={900}
                cardTitle={(item) => (
                  <div>
                    <Text fw={600} size="sm">
                      {item.sku}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {item.product?.model} · {item.size?.code}
                    </Text>
                  </div>
                )}
              />
            ))}
        </QueryBoundary>
      </Stack>

      <AdjustModal
        key={adjusting?.id ?? 'none'}
        variant={adjusting}
        opened={adjusting !== null}
        onClose={() => setAdjusting(null)}
      />
    </Container>
  )
}
