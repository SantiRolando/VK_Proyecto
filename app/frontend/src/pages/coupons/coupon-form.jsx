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
} from '@mantine/core'
import { useI18n } from '../../i18n/context.js'
import { couponSchema } from '../../features/coupons/coupons-schema.js'

const EMPTY_VALUES = {
  code: '',
  type: 'percentage',
  value: '',
  maxUses: '',
  startDate: '',
  endDate: '',
  active: true,
}

function CouponForm({ initialValues, onCancel, onSubmit }) {
  const { t } = useI18n()
  const [values, setValues] = useState(() =>
    initialValues ? { ...initialValues } : EMPTY_VALUES,
  )
  const [errors, setErrors] = useState({})

  const typeOptions = [
    { value: 'percentage', label: t('coupons.type.percentage') },
    { value: 'fixed', label: t('coupons.type.fixed') },
  ]

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const errorText = (field) => {
    if (!errors[field]) return null
    if (errors[field] === 'range') return t('coupons.form.range')

    const empty =
      values[field] === '' || values[field] === null || values[field] === undefined
    return empty ? t('coupons.form.required') : t('coupons.form.invalid')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsed = couponSchema.safeParse(values)

    if (!parsed.success) {
      const next = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field && next[field] === undefined) next[field] = true
      }
      setErrors(next)
      return
    }

    if (parsed.data.endDate < parsed.data.startDate) {
      setErrors({ endDate: 'range' })
      return
    }

    onSubmit(parsed.data)
  }

  const isPercentage = values.type === 'percentage'

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label={t('coupons.form.code')}
          value={values.code}
          onChange={(event) => setField('code')(event.currentTarget.value)}
          error={errorText('code')}
          required
          data-autofocus
        />
        <Select
          label={t('coupons.form.type')}
          value={values.type}
          onChange={setField('type')}
          data={typeOptions}
        />
        <NumberInput
          label={
            isPercentage
              ? t('coupons.form.value.percentage')
              : t('coupons.form.value.fixed')
          }
          value={values.value}
          onChange={setField('value')}
          error={errorText('value')}
          suffix={isPercentage ? '%' : undefined}
          prefix={isPercentage ? undefined : '$'}
          min={0}
          required
        />
        <NumberInput
          label={t('coupons.form.maxUses')}
          value={values.maxUses}
          onChange={setField('maxUses')}
          error={errorText('maxUses')}
          min={1}
          required
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            type="date"
            label={t('coupons.form.startDate')}
            value={values.startDate}
            onChange={(event) => setField('startDate')(event.currentTarget.value)}
            error={errorText('startDate')}
            required
          />
          <TextInput
            type="date"
            label={t('coupons.form.endDate')}
            value={values.endDate}
            onChange={(event) => setField('endDate')(event.currentTarget.value)}
            error={errorText('endDate')}
            required
          />
        </SimpleGrid>
        <Switch
          label={t('coupons.form.active')}
          checked={values.active}
          onChange={(event) => setField('active')(event.currentTarget.checked)}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onCancel}>
            {t('coupons.cancel')}
          </Button>
          <Button type="submit">{t('coupons.form.save')}</Button>
        </Group>
      </Stack>
    </form>
  )
}

export function CouponFormModal({ opened, onClose, initialValues, onSubmit }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t('coupons.edit') : t('coupons.add')}
      centered
    >
      <CouponForm
        initialValues={initialValues}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
