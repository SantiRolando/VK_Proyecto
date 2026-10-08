import { SETTINGS_FIELDS } from '@api/services/admin-settings-service.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { InsetCard, SurfaceCard } from '@components/surface-card.jsx'
import {
  useSettings,
  useUpdateSettings,
} from '@features/admin/settings/hooks/use-settings.js'
import {
  POINTS_PRESETS,
  summarizePointsConfig,
} from '@features/admin/settings/points-simulation.js'
import { useI18n } from '@i18n/context.js'
import { splitTemplate } from '@i18n/i18n-utils.js'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Container,
  Group,
  NumberInput,
  SimpleGrid,
  Slider,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconAddressBook,
  IconCalculator,
  IconCircleCheck,
  IconDeviceFloppy,
  IconGift,
  IconMinus,
  IconPlus,
  IconReceipt,
} from '@tabler/icons-react'
import { Fragment, useState } from 'react'

const FIELD_BY_NAME = Object.fromEntries(
  SETTINGS_FIELDS.map((field) => [field.name, field]),
)

// Campos que alimentan el sorteo de puntos; el orden es el de la simulación.
const POINTS_FIELDS = ['successProbability', 'pointsPerFeedback', 'maxDailyFeedback']

const GENEROSITY_COLORS = {
  none: 'gray',
  low: 'blue',
  balanced: 'teal',
  high: 'yellow',
  extreme: 'red',
}

/*
  Color de cada número de la frase. Son tres datos distintos y el texto solo no alcanza para
  ver cuál se movió al tocar un campo.
*/
const SIMULATION_COLORS = {
  feedbacks: 'blue.7',
  chance: 'teal.7',
  points: 'grape.7',
}

/*
  Un ajuste numérico con su propio control. Los botones son grandes porque el caso normal es
  mover la aguja de a poco, y el campo queda editable para cuando se sabe el número exacto.
  El rango sale del contrato del campo (`SETTINGS_FIELDS`), no de una copia en el formulario.
*/
function SettingStepper({ field, value, onChange }) {
  const { t } = useI18n()
  const label = t(`admin.settings.form.${field.name}`)

  const set = (next) => {
    const number = Math.round(Number(next) || 0)
    onChange(Math.min(field.max, Math.max(field.min, number)))
  }

  return (
    <InsetCard>
      <Stack gap="sm">
        <div>
          <Text fw={600}>{label}</Text>
          <Text c="dimmed" size="sm" mt={4}>
            {t(`admin.settings.form.${field.name}Hint`)}
          </Text>
        </div>

        <Group gap="xs" align="center" wrap="nowrap">
          <ActionIcon
            size={44}
            radius="md"
            variant="default"
            disabled={value <= field.min}
            aria-label={`${t('admin.settings.form.decrease')}: ${label}`}
            onClick={() => set(value - field.step)}
          >
            <IconMinus size={20} stroke={1.8} />
          </ActionIcon>

          <NumberInput
            value={value}
            onChange={set}
            min={field.min}
            max={field.max}
            step={field.step}
            allowDecimal={false}
            hideControls
            suffix={field.unit ? ` ${field.unit}` : undefined}
            aria-label={label}
            style={{ flex: 1 }}
            styles={{
              input: { textAlign: 'center', fontWeight: 700, height: 48 },
            }}
          />

          <ActionIcon
            size={44}
            radius="md"
            variant="default"
            disabled={value >= field.max}
            aria-label={`${t('admin.settings.form.increase')}: ${label}`}
            onClick={() => set(value + field.step)}
          >
            <IconPlus size={20} stroke={1.8} />
          </ActionIcon>
        </Group>
      </Stack>
    </InsetCard>
  )
}

/*
  La lectura de la configuración en una frase: los números van en negrita y con color propio,
  así se ve cuál se movió. Se parte la plantilla traducida para no armar la oración con pedazos
  sueltos en cada idioma.
*/
function SimulationPhrase({ summary }) {
  const { t, formatNumber } = useI18n()
  const values = {
    feedbacks: formatNumber(summary.feedbacks),
    chance: formatNumber(summary.chance, { maximumFractionDigits: 1 }),
    points: formatNumber(summary.expectedPoints),
  }

  return (
    <Text size="sm">
      {splitTemplate(t('admin.settings.pointsSimulation')).map((segment) =>
        segment.text !== undefined ? (
          <Fragment key={`texto:${segment.text}`}>{segment.text}</Fragment>
        ) : (
          <Text
            key={`dato:${segment.name}`}
            component="span"
            fw={700}
            c={SIMULATION_COLORS[segment.name]}
          >
            {values[segment.name]}
          </Text>
        ),
      )}
    </Text>
  )
}

// Formulario separado para poder inicializarlo con lo que llegó del backend.
function SettingsForm({ initial }) {
  const { t } = useI18n()
  const update = useUpdateSettings()

  const [values, setValues] = useState(initial)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const setField = (field) => (value) => {
    setSaved(false)
    setValues((current) => ({ ...current, [field]: value }))
  }

  const applyPreset = (index) => {
    setSaved(false)
    setValues((current) => ({ ...current, ...POINTS_PRESETS[index].values }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      await update.mutateAsync(values)
      setSaved(true)
    } catch (saveError) {
      setError(saveError)
    }
  }

  // Se recalcula con cada tecla: la lectura de la configuración es la respuesta inmediata a
  // lo que el admin acaba de mover.
  const summary = summarizePointsConfig(values)

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <SurfaceCard
          titleSectionVariant="top"
          icon={IconGift}
          title={t('admin.settings.points')}
          description={t('admin.settings.pointsDescription')}
          rightSection={
            <Tooltip
              label={t('admin.settings.pointsScale', {
                points: summary.potentialPointsPerDay,
              })}
            >
              <Badge
                variant="light"
                size="lg"
                radius="sm"
                color={GENEROSITY_COLORS[summary.level]}
              >
                {t(`admin.settings.pointsGenerosity.${summary.level}`)}
              </Badge>
            </Tooltip>
          }
        >
          <Stack gap="md">
            <InsetCard>
              <Group gap="sm" align="center" wrap="nowrap">
                <ThemeIcon variant="light" size={30} radius="sm">
                  <IconCalculator size={18} stroke={1.6} />
                </ThemeIcon>
                <SimulationPhrase summary={summary} />
              </Group>
            </InsetCard>

            <InsetCard>
              <Stack gap="md">
                <div>
                  <Text fw={600}>{t('admin.settings.pointsPreset')}</Text>
                  <Text c="dimmed" size="sm" mt={4}>
                    {t('admin.settings.pointsPresetHint')}
                  </Text>
                </div>

                <Slider
                  min={0}
                  max={POINTS_PRESETS.length - 1}
                  step={1}
                  value={summary.presetIndex}
                  onChange={applyPreset}
                  label={(index) =>
                    t(`admin.settings.pointsGenerosity.${POINTS_PRESETS[index].level}`)
                  }
                  // El nombre accesible va en el thumb: la raíz del Slider no es el control.
                  thumbLabel={t('admin.settings.pointsPreset')}
                  thumbValueText={t(`admin.settings.pointsGenerosity.${summary.level}`)}
                  // Solo los puntos: las etiquetas de Mantine se centran sobre la marca y las
                  // de los extremos se salen de la tarjeta.
                  marks={[...POINTS_PRESETS.keys()].map((index) => ({ value: index }))}
                />

                <Group justify="space-between" gap="xs" mt={4}>
                  {POINTS_PRESETS.map((preset) => (
                    <Text key={preset.level} size="xs" c="dimmed">
                      {t(`admin.settings.pointsGenerosity.${preset.level}`)}
                    </Text>
                  ))}
                </Group>
              </Stack>
            </InsetCard>

            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              {POINTS_FIELDS.map((name) => (
                <SettingStepper
                  key={name}
                  field={FIELD_BY_NAME[name]}
                  value={values[name]}
                  onChange={setField(name)}
                />
              ))}
            </SimpleGrid>
          </Stack>
        </SurfaceCard>

        <SurfaceCard
          titleSectionVariant="top"
          icon={IconAddressBook}
          title={t('admin.settings.contact')}
          description={t('admin.settings.contactDescription')}
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label={t('admin.settings.form.coordinationEmail')}
              type="email"
              value={values.coordinationEmail}
              onChange={(event) =>
                setField('coordinationEmail')(event.currentTarget.value)
              }
            />
            <TextInput
              label={t('admin.settings.form.coordinationWhatsapp')}
              value={values.coordinationWhatsapp}
              onChange={(event) =>
                setField('coordinationWhatsapp')(event.currentTarget.value)
              }
            />
          </SimpleGrid>
        </SurfaceCard>

        <SurfaceCard
          titleSectionVariant="top"
          icon={IconReceipt}
          title={t('admin.settings.sales')}
          description={t('admin.settings.salesDescription')}
        >
          <NumberInput
            label={t('admin.settings.form.staleSaleDays')}
            description={t('admin.settings.form.staleSaleDaysHint')}
            value={values.staleSaleDays}
            onChange={(value) => setField('staleSaleDays')(Number(value) || 0)}
            min={0}
            max={365}
            allowDecimal={false}
            maw={280}
          />
        </SurfaceCard>

        {saved && (
          <Alert variant="light" color="teal" icon={<IconCircleCheck size={18} />}>
            {t('admin.settings.saved')}
          </Alert>
        )}
        {error && <ErrorState error={error} onRetry={() => setError(null)} />}

        <Group justify="flex-end">
          <Button
            type="submit"
            loading={update.isPending}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

export function SettingsPage() {
  const { t } = useI18n()
  const query = useSettings()

  return (
    <Container size="md" py="xl">
      <PageHeader
        title={t('admin.settings.title')}
        subtitle={t('admin.settings.subtitle')}
      />

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data && <SettingsForm initial={query.data} />}
      </QueryBoundary>
    </Container>
  )
}
