import { ErrorState } from '@components/feedback/error-state.jsx'
import { useI18n } from '@i18n/context.js'
import { Button, Group, NumberInput, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { MEASURE_FIELDS, measuresShape } from '@utils/measures.js'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().trim().min(1, { message: 'required' }).max(60, { message: 'invalid' }),
  ...measuresShape,
})

const EMPTY_PROFILE = {
  name: '',
  height: '',
  bust: '',
  waist: '',
  hip: '',
  torso: '',
  age: '',
}

// Formulario de perfil de medidas (US5/T074), compartido por la pantalla de
// perfiles y el modal "guardar como perfil" del resultado. Las medidas son
// opcionales: qué necesita cada tabla lo pide el formulario de medición.
export function ProfileForm({
  initialValues,
  onSubmit,
  onSaved,
  onCancel,
  submitLabel,
  isPending = false,
}) {
  const { t } = useI18n()

  const [values, setValues] = useState(() => ({
    ...EMPTY_PROFILE,
    ...initialValues,
  }))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const errorText = (field) => (errors[field] ? t(`validation.${errors[field]}`) : null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const parsed = profileSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setServerError(null)
    try {
      const saved = await onSubmit(parsed.data)
      onSaved?.(saved)
    } catch (error) {
      setServerError(error)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="sm">
        <TextInput
          label={t('account.profiles.form.name')}
          placeholder={t('account.profiles.form.namePlaceholder')}
          value={values.name}
          onChange={(event) => setField('name')(event.currentTarget.value)}
          error={errorText('name')}
          required
        />

        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {MEASURE_FIELDS.map((field) => (
            <NumberInput
              key={field}
              label={t(`fit.form.${field}`)}
              suffix=" cm"
              value={values[field]}
              onChange={setField(field)}
              error={errorText(field)}
              min={0}
            />
          ))}
          <NumberInput
            label={t('fit.form.age')}
            value={values.age}
            onChange={setField('age')}
            error={errorText('age')}
            min={1}
            max={120}
          />
        </SimpleGrid>

        {serverError && <ErrorState error={serverError} />}

        <Group>
          <Button type="submit" loading={isPending}>
            {submitLabel ?? t('common.save')}
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
