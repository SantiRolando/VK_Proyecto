import { ApiError } from '@api/client/api-error.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { Audience, KIDS_LINES, Line } from '@constants/enums.js'
import {
  useCreateProduct,
  useSetProductActive,
  useUpdateProduct,
} from '@features/admin/catalog-admin/hooks/use-products.js'
import { useI18n } from '@i18n/context.js'
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Radio,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
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

/*
  Alta y edición de un producto. El público y la línea solo se eligen al crear: cambiarlos
  después dejaría variantes de otra tabla de talles colgando del producto.
*/
export function ProductFormModal({ product, opened, onClose }) {
  const { t } = useI18n()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const setActive = useSetProductActive()

  const [values, setValues] = useState(() => ({
    ...EMPTY_PRODUCT,
    ...(product ?? {}),
  }))
  const [error, setError] = useState(null)

  const setField = (field) => (value) =>
    setValues((current) => ({ ...current, [field]: value }))

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
