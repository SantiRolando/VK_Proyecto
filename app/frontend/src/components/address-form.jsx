import { isApiError } from '@api/client/api-error.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { useI18n } from '@i18n/context.js'
import { Button, Group, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { addressSchema } from '@utils/address.js'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'

const EMPTY_ADDRESS = {
  street: '',
  number: '',
  city: '',
  department: '',
  reference: '',
}

// Formulario de dirección (US4/US5), compartido por el checkout y la agenda de
// la cuenta: alta o edición según `initialValues`. Quien lo usa aporta la
// mutación (`onSubmit`) y reacciona al guardado (`onSaved`).
export function AddressForm({
  initialValues,
  onSubmit,
  onSaved,
  onCancel,
  submitLabel,
  isPending = false,
}) {
  const { t } = useI18n()

  const [values, setValues] = useState(() => ({
    ...EMPTY_ADDRESS,
    ...initialValues,
  }))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const setField = (field) => (event) => {
    // Se lee el valor en el momento del evento: React puede ejecutar el updater
    // más tarde, cuando `currentTarget` ya es null.
    const { value } = event.currentTarget
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const errorText = (field) => (errors[field] ? t(`validation.${errors[field]}`) : null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const parsed = addressSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setServerError(null)
    try {
      const saved = await onSubmit(parsed.data)
      onSaved?.(saved)
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label={t('address.street')}
            value={values.street}
            onChange={setField('street')}
            error={errorText('street')}
            required
          />
          <TextInput
            label={t('address.number')}
            value={values.number}
            onChange={setField('number')}
            error={errorText('number')}
            required
          />
          <TextInput
            label={t('address.city')}
            value={values.city}
            onChange={setField('city')}
            error={errorText('city')}
            required
          />
          <TextInput
            label={t('address.department')}
            value={values.department}
            onChange={setField('department')}
            error={errorText('department')}
            required
          />
        </SimpleGrid>
        <TextInput
          label={t('address.reference')}
          value={values.reference}
          onChange={setField('reference')}
          error={errorText('reference')}
        />

        {serverError && <ErrorState error={serverError} />}

        <Group>
          <Button type="submit" loading={isPending}>
            {submitLabel ?? t('address.save')}
          </Button>
          {onCancel && (
            <Button variant="subtle" type="button" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
        </Group>
      </Stack>
    </form>
  )
}
