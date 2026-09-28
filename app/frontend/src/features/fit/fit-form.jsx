import { routes } from '@app/routes.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { fitSchema } from '@features/fit/fit-schema.js'
import { useCreateGeneration } from '@features/fit/hooks/use-create-generation.js'
import { MeasureHelp } from '@features/fit/measure-help.jsx'
import { OutOfRange } from '@features/fit/out-of-range.jsx'
import { useI18n } from '@i18n/context.js'
import {
  Button,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconHelp } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

const LINE_OPTIONS = ['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']

const MEASURE_FIELDS = ['height', 'bust', 'waist', 'hip', 'torso']

const INITIAL_VALUES = {
  line: '',
  height: '',
  bust: '',
  waist: '',
  hip: '',
  torso: '',
}

// Formulario de medición (T039): línea + cinco medidas con validación de
// formato. La precarga de línea (QR) y el origen (`source`) llegan por props
// desde `fit-page`; el cálculo de talle lo hace la capa de datos.
export function FitForm({
  initialLine,
  source,
  profileId = null,
  initialMeasures = null,
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const createGeneration = useCreateGeneration()
  const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false)

  const [values, setValues] = useState({
    ...INITIAL_VALUES,
    line: initialLine ?? '',
    // Con perfil activo, el formulario arranca precargado (US5/T073).
    ...(initialMeasures ?? {}),
  })
  const [errors, setErrors] = useState({})
  const [outOfRange, setOutOfRange] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const errorText = (field) => {
    if (!errors[field]) return null
    return errors[field] === 'required'
      ? t('validation.required')
      : t('validation.invalid')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const parsed = fitSchema.safeParse(values)
    if (!parsed.success) {
      const next = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field && next[field] === undefined) {
          next[field] = issue.message === 'required' ? 'required' : 'invalid'
        }
      }
      setErrors(next)
      return
    }

    setSubmitError(null)
    try {
      const generation = await createGeneration.mutateAsync({
        ...parsed.data,
        source,
        profileId,
      })
      navigate(routes.fitResult(generation.id))
    } catch (error) {
      if (error?.code === 'OUT_OF_RANGE') {
        setOutOfRange(true)
      } else {
        setSubmitError(error)
      }
    }
  }

  if (outOfRange) {
    return <OutOfRange onReset={() => setOutOfRange(false)} />
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            {t('fit.form.hint')}
          </Text>
          <Button
            variant="subtle"
            size="xs"
            type="button"
            leftSection={<IconHelp size={14} />}
            onClick={openHelp}
          >
            {t('fit.form.help')}
          </Button>
        </Group>

        <Select
          label={t('fit.form.line')}
          placeholder={t('fit.form.line.placeholder')}
          data={LINE_OPTIONS.map((line) => ({
            value: line,
            label: t(`enums.line.${line}`),
          }))}
          value={values.line || null}
          onChange={setField('line')}
          error={errorText('line')}
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
              required
            />
          ))}
        </SimpleGrid>

        {submitError && (
          <ErrorState error={submitError} onRetry={() => setSubmitError(null)} />
        )}

        <Button type="submit" size="lg" loading={createGeneration.isPending}>
          {t('fit.form.submit')}
        </Button>
      </Stack>

      <MeasureHelp opened={helpOpened} onClose={closeHelp} />
    </form>
  )
}
