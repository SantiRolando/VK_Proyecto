import { useState } from 'react'
import { Button, Group, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'
import { isApiError } from '../../api/client/api-error.js'
import { ErrorState } from '../../components/feedback/error-state.jsx'
import { collectFieldErrors } from '../../utils/zod-errors.js'
import { useCreateAddress } from './hooks/use-addresses.js'
import { addressSchema } from './checkout-schema.js'

const INITIAL_VALUES = {
  street: '',
  number: '',
  city: '',
  department: '',
  reference: '',
}

// Alta de dirección desde el checkout (T059). Al guardarla se selecciona como
// destino del envío. La agenda completa llega en US5.
export function AddressForm({ onCreated, onCancel }) {
  const { t } = useI18n()
  const createAddress = useCreateAddress()

  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const setField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.currentTarget.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const errorText = (field) =>
    errors[field] ? t(`validation.${errors[field]}`) : null

  const handleSubmit = async (event) => {
    event.preventDefault()

    const parsed = addressSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setServerError(null)
    try {
      const address = await createAddress.mutateAsync(parsed.data)
      setValues(INITIAL_VALUES)
      onCreated(address)
    } catch (error) {
      setServerError(isApiError(error) ? error : null)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label={t('checkout.address.street')}
            value={values.street}
            onChange={setField('street')}
            error={errorText('street')}
            required
          />
          <TextInput
            label={t('checkout.address.number')}
            value={values.number}
            onChange={setField('number')}
            error={errorText('number')}
            required
          />
          <TextInput
            label={t('checkout.address.city')}
            value={values.city}
            onChange={setField('city')}
            error={errorText('city')}
            required
          />
          <TextInput
            label={t('checkout.address.department')}
            value={values.department}
            onChange={setField('department')}
            error={errorText('department')}
            required
          />
        </SimpleGrid>
        <TextInput
          label={t('checkout.address.reference')}
          value={values.reference}
          onChange={setField('reference')}
          error={errorText('reference')}
        />

        {serverError && <ErrorState error={serverError} />}

        <Group>
          <Button type="submit" loading={createAddress.isPending}>
            {t('checkout.address.submit')}
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
