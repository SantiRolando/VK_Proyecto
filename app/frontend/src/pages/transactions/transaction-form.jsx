import { useMemo, useState } from 'react'
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { transactionSchema } from '../../features/transactions/transaction-schema.js'
import { NON_SALE_REASONS } from '../../features/transactions/transactions-options.js'
import { getProductOptions } from './product-helpers.js'
import { TransactionLinesEditor } from './transaction-lines-editor.jsx'

const createEmptyLine = () => ({ productId: null, quantity: '' })

function TransactionForm({ initialValues, onCancel, onSubmit }) {
  const { t } = useI18n()
  const [values, setValues] = useState(() =>
    initialValues
      ? {
          reason: initialValues.reason,
          date: initialValues.date,
          lines: initialValues.lines.map((line) => ({ ...line })),
        }
      : {
          reason: 'entrada',
          date: '',
          lines: [createEmptyLine()],
        },
  )
  const [errors, setErrors] = useState({})

  const productOptions = useMemo(() => getProductOptions(t), [t])

  const reasonOptions = NON_SALE_REASONS.map((reason) => ({
    value: reason.id,
    label: t(reason.labelKey),
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
    const parsed = transactionSchema.safeParse(values)

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
        <Select
          label={t('transactions.form.reason')}
          value={values.reason}
          onChange={setField('reason')}
          data={reasonOptions}
          error={errorText('reason')}
          required
        />
        <TextInput
          type="date"
          label={t('transactions.form.date')}
          value={values.date}
          onChange={(event) => setField('date')(event.currentTarget.value)}
          error={errorText('date')}
          required
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

export function TransactionFormModal({ opened, onClose, initialValues, onSubmit }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t('transactions.edit') : t('transactions.add')}
      centered
      size="lg"
    >
      <TransactionForm
        initialValues={initialValues}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
