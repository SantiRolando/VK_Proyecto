import { InsetCard, SurfaceCard } from '@components/surface-card.jsx'
import {
  POINTS_PRESETS,
  summarizePointsConfig,
} from '@features/admin/settings/points-simulation.js'
import { SettingStepper } from '@features/admin/settings/setting-stepper.jsx'
import { FIELD_BY_NAME } from '@features/admin/settings/settings-fields.js'
import { useI18n } from '@i18n/context.js'
import { splitTemplate } from '@i18n/i18n-utils.js'
import {
  Badge,
  Group,
  SimpleGrid,
  Slider,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core'
import { IconCalculator, IconGift } from '@tabler/icons-react'
import { Fragment } from 'react'

// Campos que alimentan el sorteo de puntos; el orden es el de la simulación.
const POINTS_FIELDS = ['successProbability', 'pointsPerFeedback', 'maxDailyFeedback']

const GENEROSITY_COLORS = {
  none: 'gray',
  low: 'blue',
  balanced: 'teal',
  high: 'yellow',
  extreme: 'red',
}

// Un color por número de la frase: son tres datos y el texto solo no deja ver cuál se movió.
const SIMULATION_COLORS = {
  feedbacks: 'blue.7',
  chance: 'teal.7',
  points: 'grape.7',
}

/*
  La lectura de la configuración en una frase. Se parte la plantilla traducida para no armar la
  oración con pedazos sueltos en cada idioma.
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

export function PointsSection({ values, errors, onChange }) {
  const { t } = useI18n()
  // Se recalcula con cada tecla: la lectura es la respuesta inmediata a lo que se movió.
  const summary = summarizePointsConfig(values)

  const applyPreset = (index) => onChange(POINTS_PRESETS[index].values)

  return (
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
              error={errors[name]}
              onChange={(value) => onChange({ [name]: value })}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </SurfaceCard>
  )
}
