import { useState } from 'react'
import {
  Button,
  Image,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { useI18n } from '../../i18n/context.js'
import { sizingSchema } from '../../features/sizing/sizing-schema.js'
import { recommendSize } from '../../features/sizing/recommend-size.js'

import heightImage from '../../assets/altura.jpg'
import hipImage from '../../assets/cadera.jpg'
import waistImage from '../../assets/cintura.jpg'
import bustImage from '../../assets/pecho.jpg'
import torsoImage from '../../assets/torso.jpg'

const initialValues = {
  sex: 'woman',
  product: 'women-endurance',
  height: '',
  waist: '',
  hip: '',
  bust: '',
  torso: '',
}

const REQUIRED_BY_SEX = {
  woman: ['waist', 'bust'],
  man: ['waist', 'hip'],
}

const MEASUREMENT_FIELDS = [
  { field: 'height', key: 'generator.form.height', image: heightImage },
  { field: 'waist', key: 'generator.form.waist', image: waistImage },
  { field: 'hip', key: 'generator.form.hip', image: hipImage },
  { field: 'bust', key: 'generator.form.bust', image: bustImage },
  { field: 'torso', key: 'generator.form.torso', image: torsoImage },
]

function MeasurementReference({ activeField }) {
  const { t } = useI18n()
  const meta =
    MEASUREMENT_FIELDS.find((item) => item.field === activeField) ??
    MEASUREMENT_FIELDS[0]

  return (
    <Paper withBorder radius="md" p="md" className="md:sticky md:top-20">
      <Text fw={600} mb="xs">
        {t('generator.reference.title')}
      </Text>
      <Image src={meta.image} alt={t(meta.key)} h={300} fit="contain" radius="sm" />
      <Text size="sm" c="dimmed" mt="xs" ta="center">
        {t(meta.key)}
      </Text>
    </Paper>
  )
}

export function SizingForm({ onResult }) {
  const { t } = useI18n()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [activeField, setActiveField] = useState(null)

  const sexOptions = [
    { value: 'woman', label: t('generator.form.sex.woman') },
    { value: 'man', label: t('generator.form.sex.man') },
  ]

  const productOptions = {
    woman: [
      { value: 'women-endurance', label: t('generator.form.product.women-endurance') },
      { value: 'women-soft', label: t('generator.form.product.women-soft') },
    ],
    man: [
      { value: 'men-jammer', label: t('generator.form.product.men-jammer') },
      { value: 'men-sungas', label: t('generator.form.product.men-sungas') },
    ],
  }

  const isRequired = (field) => REQUIRED_BY_SEX[values.sex].includes(field)

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSexChange = (value) => {
    setValues((current) => ({
      ...current,
      sex: value,
      product: value === 'woman' ? 'women-endurance' : 'men-jammer',
    }))
  }

  const errorText = (field) => {
    if (!errors[field]) return null
    return errors[field] === 'required'
      ? t('generator.form.required')
      : t('generator.form.invalid')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsed = sizingSchema.safeParse(values)

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

    setErrors({})
    onResult(recommendSize(parsed.data))
  }

  return (
    <form onSubmit={handleSubmit}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label={t('generator.form.sex')}
              value={values.sex}
              onChange={handleSexChange}
              data={sexOptions}
            />
            <Select
              label={t('generator.form.product')}
              value={values.product}
              onChange={setField('product')}
              data={productOptions[values.sex]}
            />
          </SimpleGrid>

          <Text size="xs" c="dimmed">
            {t('generator.form.requiredHint')}
          </Text>

          <SimpleGrid cols={{ base: 2, sm: 3 }}>
            {MEASUREMENT_FIELDS.map(({ field, key }) => (
              <NumberInput
                key={field}
                label={t(key)}
                value={values[field]}
                onChange={setField(field)}
                onFocus={() => setActiveField(field)}
                error={errorText(field)}
                description={
                  isRequired(field) ? undefined : t('generator.form.optional')
                }
                min={0}
                required={isRequired(field)}
              />
            ))}
          </SimpleGrid>

          <Button type="submit" size="lg">
            {t('generator.form.submit')}
          </Button>
        </Stack>

        <MeasurementReference activeField={activeField} />
      </SimpleGrid>
    </form>
  )
}
