import { DEMO_CASES } from '@features/fit/demo-cases.js'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, Card, SimpleGrid, Stack, Text } from '@mantine/core'
import { IconFlask } from '@tabler/icons-react'

// Orden en que se listan las medidas de un caso (solo las que la tabla usa).
const MEASURE_ORDER = ['bust', 'waist', 'hip', 'age']

function measuresText(t, measures) {
  return MEASURE_ORDER.filter((field) => measures[field] != null)
    .map((field) => `${t(`fit.measure.${field}`)} ${measures[field]}`)
    .join(' · ')
}

// "M · Talle directo" / "Sin talle · Talle con aviso". El porqué de una
// derivación se muestra aparte, con la misma etiqueta que en el resultado.
function expectedText(t, expected) {
  const size = expected.size ?? t('fit.demo.noSize')
  return `${size} · ${t(`enums.outcome.${expected.outcome}`)}`
}

/*
  Precarga de casos para demo y desarrollo: sección visible solo para
  un admin y declarada temporal en pantalla. Elegir un caso llena el formulario
  —sube el estado a `FitPage`, que remonta `FitForm` con valores nuevos— y
  nunca genera: el click en el generador sigue siendo manual.
*/
export function DemoCasesCard({ onSelect }) {
  const { t } = useI18n()

  return (
    <Alert
      variant="light"
      color="grape"
      icon={<IconFlask size={18} />}
      title={t('fit.demo.title')}
    >
      <Stack gap="sm">
        <Text size="sm">{t('fit.demo.notice')}</Text>
        <Text size="sm" c="dimmed">
          {t('fit.demo.hint')}
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {DEMO_CASES.map((demoCase) => (
            <Card key={demoCase.id} withBorder radius="md" padding="sm">
              <Stack gap={4}>
                <Text fw={600} size="sm">
                  {t(`fit.demo.case.${demoCase.id}`)}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(`enums.line.${demoCase.line}`)} ·{' '}
                  {t(`enums.audience.${demoCase.audience}`)} ·{' '}
                  {measuresText(t, demoCase.measures)}
                </Text>
                <Text size="sm">
                  {t('fit.demo.expected')}: {expectedText(t, demoCase.expected)}
                </Text>
                {demoCase.expected.referralReason && (
                  <Text size="xs" c="dimmed">
                    {t(`enums.referralReason.${demoCase.expected.referralReason}`)}
                  </Text>
                )}
                <Button
                  type="button"
                  size="xs"
                  variant="light"
                  mt={4}
                  aria-label={t('fit.demo.applyCase', {
                    name: t(`fit.demo.case.${demoCase.id}`),
                  })}
                  onClick={() => onSelect(demoCase)}
                >
                  {t('fit.demo.apply')}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Alert>
  )
}
