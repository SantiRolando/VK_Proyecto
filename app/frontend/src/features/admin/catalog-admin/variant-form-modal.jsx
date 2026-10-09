import { ApiError } from '@api/client/api-error.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { COLOR_OPTIONS, colorLabel } from '@constants/colors.js'
import {
  useCreateVariant,
  useSetVariantActive,
  useUpdateVariant,
} from '@features/admin/catalog-admin/hooks/use-products.js'
import { useSizes } from '@hooks/use-sizes.js'
import { useI18n } from '@i18n/context.js'
import {
  Autocomplete,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useState } from 'react'

/*
  Alta y edición de una variante (talle + color). El talle no se cambia: si está mal, se crea
  otra variante.
*/
export function VariantFormModal({ product, variant, opened, onClose }) {
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

  // El físico nace en 0: solo lo mueven los movimientos de stock.
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
