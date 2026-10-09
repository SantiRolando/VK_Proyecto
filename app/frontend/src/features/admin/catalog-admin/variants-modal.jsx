import { ColorDot } from '@components/color-dot.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { useProductDetail } from '@features/admin/catalog-admin/hooks/use-products.js'
import { VariantFormModal } from '@features/admin/catalog-admin/variant-form-modal.jsx'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

/*
  Variantes de un producto: talle, color y SKU, con el físico que acumulan los movimientos. El
  listado se vuelve tarjetas en pantallas chicas, así la tabla no se sale de la ventana. El
  formulario de la variante se abre encima de esta.
*/
export function VariantsModal({ product, opened, onClose }) {
  const { t } = useI18n()
  const detail = useProductDetail(product?.id)
  const [formTarget, setFormTarget] = useState(undefined)

  const items = detail.data?.variants ?? []

  const columns = [
    {
      key: 'size',
      header: t('admin.products.variant.size'),
      // La tarjeta del telefono ya muestra talle, color y SKU en su titulo.
      hideInCard: true,
      render: (variant) => <Text size="sm">{variant.size?.code}</Text>,
    },
    {
      key: 'color',
      header: t('admin.products.variant.color'),
      hideInCard: true,
      render: (variant) => <ColorDot color={variant.color} />,
    },
    {
      key: 'sku',
      header: t('admin.products.variant.sku'),
      hideInCard: true,
      render: (variant) => <Text size="sm">{variant.sku}</Text>,
    },
    {
      key: 'quantity',
      header: t('admin.inventory.physical'),
      render: (variant) => (
        <Group gap={6} wrap="wrap">
          <Text size="sm" fw={600}>
            {variant.quantity}
          </Text>
          {!variant.active && (
            <Badge variant="light" color="gray" size="xs">
              {t('admin.inventory.inactive')}
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'minStock',
      header: t('admin.inventory.min'),
      render: (variant) => <Text size="sm">{variant.minStock}</Text>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (variant) => (
        <Button
          variant="light"
          size="compact-sm"
          rightSection={<IconPencil size={14} />}
          onClick={() => setFormTarget(variant)}
        >
          {t('common.edit')}
        </Button>
      ),
    },
  ]

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={opened}
      onClose={onClose}
      title={`${t('admin.products.variants')} · ${product?.model ?? ''}`}
      size="xl"
      centered
    >
      <Stack gap="md">
        <Group justify="flex-end">
          <Button
            size="compact-sm"
            rightSection={<IconPlus size={14} />}
            onClick={() => setFormTarget(null)}
          >
            {t('admin.products.variant.new')}
          </Button>
        </Group>

        <QueryBoundary
          isLoading={detail.isPending}
          isError={detail.isError}
          error={detail.error}
          onRetry={detail.refetch}
        >
          {detail.data &&
            (items.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('admin.products.variant.empty')}
              </Text>
            ) : (
              <ResponsiveList
                data={items}
                getKey={(variant) => variant.id}
                columns={columns}
                minWidth={620}
                cardTitle={(variant) => (
                  <div>
                    <Text fw={600} size="sm">
                      {variant.size?.code} · {variant.sku}
                    </Text>
                    <ColorDot color={variant.color} />
                  </div>
                )}
              />
            ))}
        </QueryBoundary>
      </Stack>

      {formTarget !== undefined && (
        <VariantFormModal
          key={formTarget?.id ?? 'new'}
          product={product}
          variant={formTarget}
          opened
          onClose={() => setFormTarget(undefined)}
        />
      )}
    </Modal>
  )
}
