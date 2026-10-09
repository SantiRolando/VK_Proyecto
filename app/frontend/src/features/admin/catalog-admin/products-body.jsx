import { EmptyState } from '@components/feedback/empty-state.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { Audience } from '@constants/enums.js'
import {
  useProducts,
  useSetProductActive,
} from '@features/admin/catalog-admin/hooks/use-products.js'
import { ProductFormModal } from '@features/admin/catalog-admin/product-form-modal.jsx'
import { VariantsModal } from '@features/admin/catalog-admin/variants-modal.jsx'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Group, Modal, Stack, Text, Title } from '@mantine/core'
import {
  IconListDetails,
  IconPackage,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react'
import { useState } from 'react'

/*
  Catálogo del panel: un listado compacto de productos, con la baja lógica y el acceso a sus
  variantes. Las tres acciones van con el mismo peso visual; el color solo distingue la baja.
*/
export function ProductsBody() {
  const { t } = useI18n()
  const query = useProducts()
  const setActive = useSetProductActive()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [variantsOf, setVariantsOf] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [removeError, setRemoveError] = useState(null)

  const products = query.data?.items ?? []

  // "Dar de baja" es desactivar: el catálogo del cliente deja de ofrecerlo y
  // sus variantes no cuentan como stock.
  const handleRemove = async () => {
    setRemoveError(null)
    try {
      await setActive.mutateAsync({ productId: removing.id, active: false })
      setRemoving(null)
    } catch (error) {
      setRemoveError(error)
    }
  }

  const actionsOf = (product) => (
    <Group gap="xs" wrap="wrap">
      <Button
        variant="light"
        size="compact-xs"
        rightSection={<IconListDetails size={14} />}
        onClick={() => setVariantsOf(product)}
      >
        {t('admin.products.variants')}
      </Button>
      <Button
        variant="light"
        size="compact-xs"
        rightSection={<IconPencil size={14} />}
        onClick={() => setEditing(product)}
      >
        {t('common.edit')}
      </Button>
      {product.active ? (
        <Button
          variant="light"
          color="red"
          size="compact-xs"
          rightSection={<IconTrash size={14} />}
          onClick={() => {
            setRemoveError(null)
            setRemoving(product)
          }}
        >
          {t('common.delete')}
        </Button>
      ) : (
        <Button
          variant="light"
          size="compact-xs"
          loading={setActive.isPending}
          rightSection={<IconRefresh size={14} />}
          onClick={() => setActive.mutate({ productId: product.id, active: true })}
        >
          {t('admin.products.reactivate')}
        </Button>
      )}
    </Group>
  )

  const columns = [
    {
      key: 'product',
      header: t('admin.products.column.product'),
      // En la tabla el modelo va solo: la descripción vive en la tarjeta del teléfono.
      hideInCard: true,
      render: (product) => (
        <Text fw={600} size="sm">
          {product.model}
        </Text>
      ),
    },
    {
      key: 'line',
      header: t('admin.products.column.line'),
      render: (product) => (
        <Group gap="xs" wrap="wrap">
          <Badge variant="light" color="blue">
            {t(`enums.line.${product.line}`)}
          </Badge>
          {product.audience === Audience.Kids && (
            <Badge variant="light" color="gray">
              {t('enums.audience.Kids')}
            </Badge>
          )}
          {!product.active && (
            <Badge variant="light" color="gray">
              {t('admin.products.inactive')}
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'price',
      header: t('admin.products.column.price'),
      render: (product) => (
        <Text size="sm">
          <Money value={product.price} />
        </Text>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: actionsOf,
    },
  ]

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <div>
          <Title order={2} size="h4">
            {t('admin.products.title')}
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            {t('admin.products.subtitle')}
          </Text>
        </div>
        <Button rightSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
          {t('admin.products.new')}
        </Button>
      </Group>

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {products.length === 0 ? (
          <EmptyState icon={IconPackage} title={t('admin.products.empty')} />
        ) : (
          <ResponsiveList
            data={products}
            getKey={(product) => product.id}
            columns={columns}
            minWidth={760}
            cardTitle={(product) => (
              <div>
                <Group gap="xs" wrap="wrap">
                  <Text fw={600} size="sm">
                    {product.model}
                  </Text>
                  {!product.active && (
                    <Badge variant="light" color="gray">
                      {t('admin.products.inactive')}
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  {product.description}
                </Text>
              </div>
            )}
          />
        )}
      </QueryBoundary>

      {creating && (
        <ProductFormModal product={null} opened onClose={() => setCreating(false)} />
      )}
      {editing && (
        <ProductFormModal
          key={editing.id}
          product={editing}
          opened
          onClose={() => setEditing(null)}
        />
      )}
      {variantsOf && (
        <VariantsModal
          key={variantsOf.id}
          product={variantsOf}
          opened
          onClose={() => setVariantsOf(null)}
        />
      )}

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={removing !== null}
        onClose={() => setRemoving(null)}
        title={t('admin.products.removeTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {t('admin.products.removeBody', { model: removing?.model })}
          </Text>
          {removeError && (
            <ErrorState error={removeError} onRetry={() => setRemoveError(null)} />
          )}
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setRemoving(null)}>
              {t('common.cancel')}
            </Button>
            <Button color="red" loading={setActive.isPending} onClick={handleRemove}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
