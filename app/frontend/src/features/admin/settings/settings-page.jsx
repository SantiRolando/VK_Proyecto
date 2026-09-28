import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import {
  useSettings,
  useUpdateSettings,
} from '@features/admin/settings/hooks/use-settings.js'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Button,
  Card,
  Container,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconCircleCheck } from '@tabler/icons-react'
import { useState } from 'react'

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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <Card withBorder radius="md" padding="lg">
          <Text fw={600} mb="md">
            {t('admin.settings.points')}
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <NumberInput
              label={t('admin.settings.form.successProbability')}
              description={t('admin.settings.form.successProbabilityHint')}
              value={values.successProbability}
              onChange={(value) => setField('successProbability')(Number(value) || 0)}
              min={0}
              max={100}
              suffix=" %"
              allowDecimal={false}
            />
            <NumberInput
              label={t('admin.settings.form.pointsPerFeedback')}
              value={values.pointsPerFeedback}
              onChange={(value) => setField('pointsPerFeedback')(Number(value) || 0)}
              min={0}
              max={1000}
              allowDecimal={false}
            />
            <NumberInput
              label={t('admin.settings.form.maxDailyFeedback')}
              description={t('admin.settings.form.maxDailyFeedbackHint')}
              value={values.maxDailyFeedback}
              onChange={(value) => setField('maxDailyFeedback')(Number(value) || 0)}
              min={0}
              max={100}
              allowDecimal={false}
            />
          </SimpleGrid>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Text fw={600} mb="md">
            {t('admin.settings.contact')}
          </Text>
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
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Text fw={600} mb="md">
            {t('admin.settings.sales')}
          </Text>
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
        </Card>

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

// Reglas del juego (US11/T098, FR-026): probabilidad y puntos del feedback,
// contacto de coordinación y antigüedad de reservas (Q-11).
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
