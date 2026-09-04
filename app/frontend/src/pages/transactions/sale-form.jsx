import { useMemo, useState } from 'react'
import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { saleSchema } from '../../features/transactions/transaction-schema.js'
import { mockUsers } from '../../mocks/users.js'
import { mockCoupons } from '../../mocks/coupons.js'
import { getProductOptions } from './product-helpers.js'
import { TransactionLinesEditor } from './transaction-lines-editor.jsx'

const createEmptyLine = () => ({ productId: null, quantity: '' })

function SaleForm({ initialValues, onCancel, onSubmit }) {
  const { t } = useI18n()
  const [values, setValues] = useState(() =>
    initialValues
      ? {
          date: initialValues.date,
          customerId: initialValues.customerId ?? '',
          couponId: initialValues.couponId ?? '',
          delivery: initialValues.delivery ?? false,
          address: initialValues.address ?? '',
          lines: initialValues.lines.map((line) => ({ ...line })),
        }
      : {
          date: '',
          customerId: '',
          couponId: '',
          delivery: false,
          address: '',
          lines: [createEmptyLine()],
        },
  )
  const [errors, setErrors] = useState({})

  const productOptions = useMemo(() => getProductOptions(t), [t])

  const customerOptions = mockUsers.map((user) => ({
    value: String(user.id),
    label: user.name,
  }))

  const couponOptions = mockCoupons.map((coupon) => ({
    value: String(coupon.id),
    label: coupon.code,
  }))

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const errorText = (field) => {
    if (!errors[field]) return null
    const empty =
      values[field] === '' || values[field] === null || values[field] === undefined
    return empty ? t('transactions.form.required') : t('transactions.form.invalid')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsed = saleSchema.safeParse(values)

    if (!parsed.success) {
      const next = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'lines') {
          next.lines = true
          continue
        }
        if (field && next[field] === undefined) next[field] = true
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
          type="date"
          label={t('transactions.form.date')}
          value={values.date}
          onChange={(event) => setField('date')(event.currentTarget.value)}
          error={errorText('date')}
          required
          data-autofocus
        />
        <Select
          label={`${t('transactions.form.customer')} (${t('transactions.form.optional')})`}
          placeholder={t('transactions.form.customer.placeholder')}
          data={customerOptions}
          value={values.customerId === '' ? null : String(values.customerId)}
          onChange={(value) => setField('customerId')(value == null ? '' : Number(value))}
          clearable
          searchable
        />
        <Select
          label={`${t('transactions.form.coupon')} (${t('transactions.form.optional')})`}
          placeholder={t('transactions.form.coupon.placeholder')}
          data={couponOptions}
          value={values.couponId === '' ? null : String(values.couponId)}
          onChange={(value) => setField('couponId')(value == null ? '' : Number(value))}
          clearable
          searchable
        />
        <Switch
          label={t('transactions.form.delivery')}
          checked={values.delivery}
          onChange={(event) => setField('delivery')(event.currentTarget.checked)}
        />
        <TextInput
          label={`${t('transactions.form.address')} (${t('transactions.form.optional')})`}
          value={values.address}
          onChange={(event) => setField('address')(event.currentTarget.value)}
        />
        <TransactionLinesEditor
          lines={values.lines}
          onChange={(lines) => setValues((current) => ({ ...current, lines }))}
          productOptions={productOptions}
          error={errors.lines ? t('transactions.form.lines.required') : null}
        />

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={onCancel}
            leftSection={<IconX size={16} />}
          >
            {t('transactions.cancel')}
          </Button>
          <Button type="submit">{t('transactions.form.save')}</Button>
        </Group>
      </Stack>
    </form>
  )
}

export function SaleFormModal({ opened, onClose, initialValues, onSubmit }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t('transactions.editSale') : t('transactions.sale')}
      centered
      size="lg"
    >
      <SaleForm
        initialValues={initialValues}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
