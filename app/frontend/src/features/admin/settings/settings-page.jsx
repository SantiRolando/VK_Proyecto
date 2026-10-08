import { SETTINGS_FIELDS } from '@api/services/admin-settings-service.js'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { InsetCard, SurfaceCard } from '@components/surface-card.jsx'
import {
  useSettings,
  useUpdateSettings,
} from '@features/admin/settings/hooks/use-settings.js'
import { summarizePointsConfig } from '@features/admin/settings/points-simulation.js'
import { useI18n } from '@i18n/context.js'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Container,
  Group,
  NumberInput,
  SimpleGrid,
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
  IconGift,
  IconMinus,
  IconPlus,
  IconReceipt,
} from '@tabler/icons-react'
import { useState } from 'react'

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
                <Text size="sm">
                  {t('admin.settings.pointsSimulation', {
                    feedbacks: summary.feedbacks,
                    chance: summary.chance,
                    points: summary.expectedPoints,
                  })}
                </Text>
              </Group>
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

        <Button type="submit" loading={update.isPending} w={220}>
          {t('common.save')}
        </Button>
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
