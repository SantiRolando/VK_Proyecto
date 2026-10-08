import { routes } from '@app/routes.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { Audience, GenerationOutcome, KIDS_LINES, Line } from '@constants/enums.js'
import { fitSchema } from '@features/fit/fit-schema.js'
import { useCreateGeneration } from '@features/fit/hooks/use-create-generation.js'
import { MeasureHelp } from '@features/fit/measure-help.jsx'
import { OutOfRange } from '@features/fit/out-of-range.jsx'
import { requiredMeasuresOf, useSizes } from '@hooks/use-sizes.js'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconHelp, IconInfoCircle } from '@tabler/icons-react'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'
import { useNavigate } from 'react-router'

const LINE_OPTIONS = Object.values(Line)
const AUDIENCE_OPTIONS = Object.values(Audience)
const MEASURE_FIELDS = ['height', 'bust', 'waist', 'hip', 'torso']

const INITIAL_VALUES = {
  line: '',
  audience: Audience.Adult,
  height: '',
  bust: '',
  waist: '',
  hip: '',
  torso: '',
  age: '',
}

/*
  Formulario de medición: línea + público, las cinco medidas y la edad (para niños). Qué medidas
  son obligatorias lo dice la tabla de talles de la API.

  En modo asistente se agrega `onBehalf` (+ `customerId` opcional): el personal genera la
  medición para un tercero.
*/
export function FitForm({
  initialLine,
  initialAudience,
  source,
  profileId = null,
  initialMeasures = null,
  onBehalf = false,
  customerId = null,
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const createGeneration = useCreateGeneration()
  const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false)

  const [values, setValues] = useState({
    ...INITIAL_VALUES,
    line: initialLine ?? '',
    audience: initialAudience ?? Audience.Adult,
    // Con perfil activo, el formulario arranca precargado.
    ...(initialMeasures ?? {}),
  })
  const [errors, setErrors] = useState({})
  const [referral, setReferral] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const sizes = useSizes(values.line || null, values.audience)
  const required = requiredMeasuresOf(sizes.data)
  const isKids = values.audience === Audience.Kids
  const noTable = isKids && values.line && !KIDS_LINES.includes(values.line)

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const errorText = (field) => (errors[field] ? t(`validation.${errors[field]}`) : null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    // Fuera de niños la edad no se pide: no debe bloquear el envío.
    const parsed = fitSchema(required).safeParse(isKids ? values : { ...values, age: '' })
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    setSubmitError(null)
    try {
      const generation = await createGeneration.mutateAsync({
        ...parsed.data,
        source,
        profileId,
        onBehalf: Boolean(onBehalf),
        // Sin vínculo, la generación queda sin cliente.
        ...(onBehalf && customerId ? { customerId } : {}),
      })
      if (generation.outcome === GenerationOutcome.Referred) {
        setReferral(generation.referralReason)
        return
      }
      navigate(routes.fitResult(generation.id, onBehalf ? { onBehalf: 1 } : undefined))
    } catch (error) {
      setSubmitError(error)
    }
  }

  if (referral) {
    return <OutOfRange reason={referral} onReset={() => setReferral(null)} />
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
            rightSection={<IconHelp size={14} />}
            onClick={openHelp}
          >
            {t('fit.form.help')}
          </Button>
        </Group>

        <Radio.Group
          label={t('fit.form.audience')}
          value={values.audience}
          onChange={setField('audience')}
        >
          <Group gap="lg" mt="xs">
            {AUDIENCE_OPTIONS.map((value) => (
              <Radio key={value} value={value} label={t(`enums.audience.${value}`)} />
            ))}
          </Group>
        </Radio.Group>

        <Select
          label={t('fit.form.line')}
          placeholder={t('fit.form.line.placeholder')}
          data={LINE_OPTIONS.map((line) => ({
            value: line,
            label: t(`enums.line.${line}`),
            disabled: isKids && !KIDS_LINES.includes(line),
          }))}
          value={values.line || null}
          onChange={setField('line')}
          error={errorText('line')}
          required
        />

        {noTable && (
          <Alert variant="light" color="orange" icon={<IconInfoCircle size={18} />}>
            {t('fit.form.noTable')}
          </Alert>
        )}
        {sizes.isError && <ErrorState error={sizes.error} onRetry={sizes.refetch} />}

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
              required={required.includes(field)}
            />
          ))}
          {isKids && (
            <NumberInput
              label={t('fit.form.age')}
              value={values.age}
              onChange={setField('age')}
              error={errorText('age')}
              min={1}
              max={120}
              required={required.includes('age')}
            />
          )}
        </SimpleGrid>

        {submitError && (
          <ErrorState error={submitError} onRetry={() => setSubmitError(null)} />
        )}

        <Button
          type="submit"
          size="lg"
          loading={
            createGeneration.isPending || (Boolean(values.line) && sizes.isPending)
          }
          disabled={Boolean(noTable) || sizes.isError}
        >
          {t('fit.form.submit')}
        </Button>
      </Stack>

      <MeasureHelp opened={helpOpened} onClose={closeHelp} />
    </form>
  )
}
