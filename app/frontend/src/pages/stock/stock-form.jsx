import { useState } from 'react'
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  TextInput,
  Textarea,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { stockSchema } from '../../features/stock/stock-schema.js'
import {
  COLORS,
  MODELS,
  getModelSizes,
} from '../../features/stock/stock-options.js'

const EMPTY_VALUES = {
  barcode: '',
  model: 'women-endurance',
  size: '',
  color: '',
  minStock: '',
  quantity: '',
  kid: false,
  name: '',
  description: '',
}

function StockForm({ initialValues, onCancel, onSubmit }) {
  const { t } = useI18n()
  const [values, setValues] = useState(() =>
    initialValues ? { ...initialValues } : EMPTY_VALUES,
  )
  const [errors, setErrors] = useState({})

  const modelOptions = MODELS.map((model) => ({
    value: model.id,
    label: t(model.labelKey),
  }))

  const sizeOptions = getModelSizes(values.model).map((size) => ({
    value: size,
    label: size,
  }))

  const colorOptions = COLORS.map((color) => ({
    value: color.id,
    label: t(color.labelKey),
  }))

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleModelChange = (value) => {
    setValues((current) => ({
      ...current,
      model: value,
      size: getModelSizes(value).includes(current.size) ? current.size : '',
    }))
  }

  const errorText = (field) => {
    if (!errors[field]) return null
    if (errors[field] === 'invalid') return t('stock.form.size.invalid')

    const empty =
      values[field] === '' || values[field] === null || values[field] === undefined
    return empty ? t('stock.form.required') : t('stock.form.invalid')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsed = stockSchema.safeParse(values)

    if (!parsed.success) {
      const next = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field && next[field] === undefined) {
          next[field] = issue.message === 'invalid' ? 'invalid' : true
        }
      }
      setErrors(next)
      return
    }

    onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label={`${t('stock.form.barcode')} (${t('stock.form.optional')})`}
          value={values.barcode}
          onChange={(event) => setField('barcode')(event.currentTarget.value)}
          data-autofocus
        />
        <Select
          label={t('stock.form.model')}
          value={values.model}
          onChange={handleModelChange}
          data={modelOptions}
          error={errorText('model')}
          required
        />
        <Select
          label={t('stock.form.size')}
          value={values.size}
          onChange={setField('size')}
          data={sizeOptions}
          error={errorText('size')}
          required
        />
        <Select
          label={t('stock.form.color')}
          value={values.color}
          onChange={setField('color')}
          data={colorOptions}
          error={errorText('color')}
          required
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <NumberInput
            label={t('stock.form.minStock')}
            value={values.minStock}
            onChange={setField('minStock')}
            error={errorText('minStock')}
            min={0}
            required
          />
          <NumberInput
            label={t('stock.form.quantity')}
            value={values.quantity}
            onChange={setField('quantity')}
            error={errorText('quantity')}
            min={0}
            required
          />
        </SimpleGrid>
        <Switch
          label={t('stock.form.kid')}
          checked={values.kid}
          onChange={(event) => setField('kid')(event.currentTarget.checked)}
        />
        <TextInput
          label={`${t('stock.form.name')} (${t('stock.form.optional')})`}
          value={values.name}
          onChange={(event) => setField('name')(event.currentTarget.value)}
        />
        <Textarea
          label={`${t('stock.form.description')} (${t('stock.form.optional')})`}
          value={values.description}
          onChange={(event) => setField('description')(event.currentTarget.value)}
          autosize
          minRows={2}
        />

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={onCancel}
            leftSection={<IconX size={16} />}
          >
            {t('stock.cancel')}
          </Button>
          <Button type="submit">{t('stock.form.save')}</Button>
        </Group>
      </Stack>
    </form>
  )
}

export function StockFormModal({ opened, onClose, initialValues, onSubmit }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t('stock.edit') : t('stock.add')}
      centered
    >
      <StockForm
        initialValues={initialValues}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
