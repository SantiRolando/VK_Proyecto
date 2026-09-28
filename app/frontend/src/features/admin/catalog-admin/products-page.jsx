import { EmptyState } from '@components/feedback/empty-state.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { COLOR_OPTIONS, colorHex, colorLabel } from '@constants/colors.js'
import {
  useCreateProduct,
  useProducts,
  useRemoveProduct,
  useSizes,
  useUpdateProduct,
} from '@features/admin/catalog-admin/hooks/use-products.js'
import {
  useCreateVariant,
  useInventory,
  useUpdateVariant,
} from '@features/admin/inventory/hooks/use-inventory.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  Radio,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { IconPackage, IconPlus, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'

const LINES = ['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']

const EMPTY_PRODUCT = { line: null, model: '', description: '', price: 0, active: true }

function ColorSwatch({ color }) {
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
      <Text size="sm">{colorLabel(color)}</Text>
    </Group>
  )
}

function ProductFormModal({ product, opened, onClose }) {
  const { t } = useI18n()
  const create = useCreateProduct()
  const update = useUpdateProduct()

  const [values, setValues] = useState(() => ({
    ...EMPTY_PRODUCT,
    ...(product ?? {}),
  }))
  const [error, setError] = useState(null)

  const setField = (field) => (value) =>
    setValues((current) => ({ ...current, [field]: value }))

  const saving = create.isPending || update.isPending

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      if (product) {
        await update.mutateAsync({
          productId: product.id,
          model: values.model,
          description: values.description,
          price: Number(values.price),
          active: values.active,
        })
      } else {
        await create.mutateAsync({
          line: values.line,
          model: values.model,
          description: values.description,
          price: Number(values.price),
        })
      }
      onClose()
    } catch (saveError) {
      setError(saveError)
    }
  }

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={opened}
      onClose={onClose}
      title={product ? t('admin.products.edit') : t('admin.products.new')}
      centered
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="sm">
          {!product && (
            <Radio.Group
              label={t('admin.products.form.line')}
              value={values.line}
              onChange={setField('line')}
              withAsterisk
            >
              <Group gap="lg" mt="xs">
                {LINES.map((value) => (
                  <Radio key={value} value={value} label={t(`enums.line.${value}`)} />
                ))}
              </Group>
            </Radio.Group>
          )}

          <TextInput
            label={t('admin.products.form.model')}
            placeholder={t('admin.products.form.modelPlaceholder')}
            value={values.model}
            onChange={(event) => setField('model')(event.currentTarget.value)}
            required
          />
          <Textarea
            label={t('admin.products.form.description')}
            value={values.description}
            onChange={(event) => setField('description')(event.currentTarget.value)}
            minRows={2}
          />
          <NumberInput
            label={t('admin.products.form.price')}
            value={values.price}
            onChange={setField('price')}
            min={0}
            suffix=" UYU"
            required
          />
          {product && (
            <Switch
              label={t('admin.products.form.active')}
              checked={values.active}
              onChange={(event) => setField('active')(event.currentTarget.checked)}
            />
          )}

          {error && <ErrorState error={error} onRetry={() => setError(null)} />}

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

function VariantFormModal({ product, variant, opened, onClose }) {
  const { t } = useI18n()
  const sizes = useSizes(product?.line)
  const create = useCreateVariant()
  const update = useUpdateVariant()

  const [values, setValues] = useState(() => ({
    sizeId: null,
    color: COLOR_OPTIONS[0],
    sku: '',
    quantity: 0,
    minStock: 0,
    active: true,
    ...(variant ?? {}),
  }))
  const [error, setError] = useState(null)

  const setField = (field) => (value) =>
    setValues((current) => ({ ...current, [field]: value }))

  const saving = create.isPending || update.isPending

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      if (variant) {
        await update.mutateAsync({
          variantId: variant.id,
          color: values.color,
          sku: values.sku,
          minStock: Number(values.minStock),
          active: values.active,
        })
      } else {
        await create.mutateAsync({
          productId: product.id,
          sizeId: Number(values.sizeId),
          color: values.color,
          sku: values.sku,
          quantity: Number(values.quantity),
          minStock: Number(values.minStock),
        })
      }
      onClose()
    } catch (saveError) {
      setError(saveError)
    }
  }

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={opened}
      onClose={onClose}
      title={variant ? t('admin.products.variant.edit') : t('admin.products.variant.new')}
      centered
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="sm">
          {variant ? (
            <Text size="sm" c="dimmed">
              {t('admin.products.variant.size')}: {variant.size?.code} ·{' '}
              {t('admin.inventory.available')}: {variant.available}
            </Text>
          ) : (
            <Select
              label={t('admin.products.variant.size')}
              data={
                sizes.data?.map((size) => ({
                  value: String(size.id),
                  label: size.code,
                })) ?? []
              }
              value={values.sizeId === null ? null : String(values.sizeId)}
              onChange={setField('sizeId')}
              required
            />
          )}

          <Select
            label={t('admin.products.variant.color')}
            data={COLOR_OPTIONS.map((value) => ({
              value,
              label: colorLabel(value),
            }))}
            value={values.color}
            onChange={setField('color')}
            allowDeselect={false}
            required
          />
          <TextInput
            label={t('admin.products.variant.sku')}
            value={values.sku}
            onChange={(event) => setField('sku')(event.currentTarget.value)}
            required
          />

          {!variant && (
            <NumberInput
              label={t('admin.inventory.physical')}
              description={t('admin.products.variant.quantityHint')}
              value={values.quantity}
              onChange={setField('quantity')}
              min={0}
            />
          )}

          <NumberInput
            label={t('admin.inventory.min')}
            value={values.minStock}
            onChange={setField('minStock')}
            min={0}
          />

          {variant && (
            <Switch
              label={t('admin.products.form.active')}
              checked={values.active}
              onChange={(event) => setField('active')(event.currentTarget.checked)}
            />
          )}

          {error && <ErrorState error={error} onRetry={() => setError(null)} />}

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

function VariantsModal({ product, opened, onClose }) {
  const { t } = useI18n()
  const variants = useInventory({ productId: product?.id, pageSize: 200 })
  const [formTarget, setFormTarget] = useState(undefined)

  const items = variants.data?.items ?? []

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={opened}
      onClose={onClose}
      title={`${t('admin.products.variants')} · ${product?.model ?? ''}`}
      size="lg"
      centered
    >
      <Stack gap="md">
        <Group justify="flex-end">
          <Button
            size="compact-sm"
            leftSection={<IconPlus size={14} />}
            onClick={() => setFormTarget(null)}
          >
            {t('admin.products.variant.new')}
          </Button>
        </Group>

        <QueryBoundary
          isLoading={variants.isPending}
          isError={variants.isError}
          error={variants.error}
          onRetry={variants.refetch}
        >
          {variants.data &&
            (items.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('admin.products.variant.empty')}
              </Text>
            ) : (
              <Table.ScrollContainer minWidth={640}>
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('admin.products.variant.size')}</Table.Th>
                      <Table.Th>{t('admin.products.variant.color')}</Table.Th>
                      <Table.Th>{t('admin.products.variant.sku')}</Table.Th>
                      <Table.Th ta="right">{t('admin.inventory.available')}</Table.Th>
                      <Table.Th ta="right">{t('admin.inventory.min')}</Table.Th>
                      <Table.Th>{t('common.actions')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {items.map((variant) => (
                      <Table.Tr key={variant.id}>
                        <Table.Td>
                          <Text size="sm">{variant.size?.code}</Text>
                        </Table.Td>
                        <Table.Td>
                          <ColorSwatch color={variant.color} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{variant.sku}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text
                            size="sm"
                            fw={600}
                            c={variant.isCritical ? 'red' : undefined}
                          >
                            {variant.available}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm">{variant.minStock}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            variant="subtle"
                            size="compact-sm"
                            onClick={() => setFormTarget(variant)}
                          >
                            {t('admin.products.edit')}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
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

// Catálogo del panel (US9/T092): CRUD de productos con baja lógica y sus
// variantes (Producto + Color + Talle, con SKU único).
export function ProductsPage() {
  const { t } = useI18n()
  const query = useProducts()
  const removeProduct = useRemoveProduct()
  const updateProduct = useUpdateProduct()

  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [variantsOf, setVariantsOf] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [removeError, setRemoveError] = useState(null)

  const products = query.data?.items ?? []

  const handleRemove = async () => {
    setRemoveError(null)
    try {
      await removeProduct.mutateAsync(removing.id)
      setRemoving(null)
    } catch (error) {
      setRemoveError(error)
    }
  }

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.products.title')}
        subtitle={t('admin.products.subtitle')}
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            {t('admin.products.new')}
          </Button>
        }
      />

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {products.length === 0 ? (
          <EmptyState icon={IconPackage} title={t('admin.products.empty')} />
        ) : (
          <Stack gap="sm">
            {products.map((product) => (
              <Card key={product.id} withBorder radius="md" padding="md">
                <Group justify="space-between" gap="sm" wrap="wrap" align="flex-start">
                  <div>
                    <Group gap="xs" wrap="nowrap">
                      <Text fw={600}>{product.model}</Text>
                      <Badge variant="light" color="vikinga">
                        {t(`enums.line.${product.line}`)}
                      </Badge>
                      {!product.active && (
                        <Badge variant="light" color="gray">
                          {t('admin.products.inactive')}
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" c="dimmed" mt={4}>
                      {product.description}
                    </Text>
                    <Group gap="xs" mt={6}>
                      <Text size="sm" fw={600}>
                        <Money value={product.price} />
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('admin.products.variantCount', {
                          count: product.activeVariantCount,
                        })}
                      </Text>
                    </Group>
                  </div>

                  <Group gap="xs" wrap="wrap">
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => setVariantsOf(product)}
                    >
                      {t('admin.products.variants')}
                    </Button>
                    <Button
                      variant="light"
                      size="compact-sm"
                      onClick={() => setEditing(product)}
                    >
                      {t('admin.products.edit')}
                    </Button>
                    {product.active ? (
                      <Button
                        variant="subtle"
                        color="red"
                        size="compact-sm"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => {
                          setRemoveError(null)
                          setRemoving(product)
                        }}
                      >
                        {t('common.delete')}
                      </Button>
                    ) : (
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        loading={updateProduct.isPending}
                        onClick={() =>
                          updateProduct.mutate({ productId: product.id, active: true })
                        }
                      >
                        {t('admin.products.reactivate')}
                      </Button>
                    )}
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
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
            <Button color="red" loading={removeProduct.isPending} onClick={handleRemove}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
