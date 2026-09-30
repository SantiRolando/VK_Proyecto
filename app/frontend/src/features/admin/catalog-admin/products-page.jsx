import { ApiError } from '@api/client/api-error.js'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { COLOR_OPTIONS, colorHex, colorLabel } from '@constants/colors.js'
import { Audience, KIDS_LINES, Line } from '@constants/enums.js'
import {
  useCreateProduct,
  useCreateVariant,
  useProductDetail,
  useProducts,
  useSetProductActive,
  useSetVariantActive,
  useUpdateProduct,
  useUpdateVariant,
} from '@features/admin/catalog-admin/hooks/use-products.js'
import { useSizes } from '@hooks/use-sizes.js'
import { useI18n } from '@i18n/context.js'
import {
  Autocomplete,
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

const LINES = Object.values(Line)
const AUDIENCES = Object.values(Audience)

const EMPTY_PRODUCT = {
  line: null,
  audience: Audience.Adult,
  model: '',
  description: '',
  price: 0,
  active: true,
}

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

  const setActive = useSetProductActive()

  const saving = create.isPending || update.isPending || setActive.isPending
  const noTable =
    values.audience === Audience.Kids && values.line && !KIDS_LINES.includes(values.line)

  // La edición es un PUT completo; el estado activo va por su propio endpoint.
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    const price =
      values.price === '' || values.price === null ? null : Number(values.price)
    if (!values.line || !values.model.trim() || price === null || price < 0) {
      setError(new ApiError(400, 'VALIDATION_ERROR'))
      return
    }
    try {
      const payload = {
        line: values.line,
        audience: values.audience,
        model: values.model,
        description: values.description,
        price: Number(values.price),
      }
      if (product) {
        await update.mutateAsync({ productId: product.id, ...payload })
        if (values.active !== product.active) {
          await setActive.mutateAsync({ productId: product.id, active: values.active })
        }
      } else {
        await create.mutateAsync(payload)
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
            <>
              <Radio.Group
                label={t('admin.products.form.audience')}
                value={values.audience}
                onChange={setField('audience')}
                withAsterisk
              >
                <Group gap="lg" mt="xs">
                  {AUDIENCES.map((value) => (
                    <Radio
                      key={value}
                      value={value}
                      label={t(`enums.audience.${value}`)}
                    />
                  ))}
                </Group>
              </Radio.Group>
              <Radio.Group
                label={t('admin.products.form.line')}
                value={values.line}
                onChange={setField('line')}
                withAsterisk
              >
                <Group gap="lg" mt="xs">
                  {LINES.map((value) => (
                    <Radio
                      key={value}
                      value={value}
                      label={t(`enums.line.${value}`)}
                      disabled={
                        values.audience === Audience.Kids && !KIDS_LINES.includes(value)
                      }
                    />
                  ))}
                </Group>
              </Radio.Group>
              {noTable && (
                <Text size="sm" c="orange">
                  {t('fit.form.noTable')}
                </Text>
              )}
            </>
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
            <Button type="submit" loading={saving} disabled={Boolean(noTable)}>
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
  const sizes = useSizes(product?.line, product?.audience)
  const create = useCreateVariant()
  const update = useUpdateVariant()
  const setActive = useSetVariantActive()

  const [values, setValues] = useState(() => ({
    sizeId: null,
    color: '',
    sku: '',
    minStock: 0,
    active: true,
    ...(variant ?? {}),
  }))
  const [error, setError] = useState(null)

  const setField = (field) => (value) =>
    setValues((current) => ({ ...current, [field]: value }))

  const saving = create.isPending || update.isPending || setActive.isPending

  // El talle no se cambia (se crea otra variante) y el físico nace en 0: solo
  // lo mueven los movimientos de stock.
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    if ((!variant && !values.sizeId) || !values.color.trim() || !values.sku.trim()) {
      setError(new ApiError(400, 'VALIDATION_ERROR'))
      return
    }
    try {
      const payload = {
        productId: product.id,
        sizeId: Number(variant ? variant.sizeId : values.sizeId),
        color: values.color,
        sku: values.sku,
        minStock: Number(values.minStock),
      }
      if (variant) {
        await update.mutateAsync({ variantId: variant.id, ...payload })
        if (values.active !== variant.active) {
          await setActive.mutateAsync({
            productId: product.id,
            variantId: variant.id,
            active: values.active,
          })
        }
      } else {
        await create.mutateAsync(payload)
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
              {t('admin.inventory.physical')}: {variant.quantity}
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

          <Autocomplete
            label={t('admin.products.variant.color')}
            description={t('admin.products.variant.colorHint')}
            data={COLOR_OPTIONS.map(colorLabel)}
            value={values.color}
            onChange={setField('color')}
            required
          />
          <TextInput
            label={t('admin.products.variant.sku')}
            value={values.sku}
            onChange={(event) => setField('sku')(event.currentTarget.value)}
            required
          />

          {!variant && (
            <Text size="xs" c="dimmed">
              {t('admin.products.variant.quantityHint')}
            </Text>
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
  const detail = useProductDetail(product?.id)
  const [formTarget, setFormTarget] = useState(undefined)

  const items = detail.data?.variants ?? []

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
              <Table.ScrollContainer minWidth={640}>
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('admin.products.variant.size')}</Table.Th>
                      <Table.Th>{t('admin.products.variant.color')}</Table.Th>
                      <Table.Th>{t('admin.products.variant.sku')}</Table.Th>
                      <Table.Th ta="right">{t('admin.inventory.physical')}</Table.Th>
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
                          <Group gap={6} justify="flex-end" wrap="nowrap">
                            <Text size="sm" fw={600}>
                              {variant.quantity}
                            </Text>
                            {!variant.active && (
                              <Badge variant="light" color="gray" size="xs">
                                {t('admin.inventory.inactive')}
                              </Badge>
                            )}
                          </Group>
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
  const setActive = useSetProductActive()

  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
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
                    <Text size="sm" c="dimmed" mt={4}>
                      {product.description}
                    </Text>
                    <Group gap="xs" mt={6}>
                      <Text size="sm" fw={600}>
                        <Money value={product.price} />
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
                        loading={setActive.isPending}
                        onClick={() =>
                          setActive.mutate({ productId: product.id, active: true })
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
            <Button color="red" loading={setActive.isPending} onClick={handleRemove}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
