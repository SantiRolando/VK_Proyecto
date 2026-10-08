import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { ContactSection } from '@features/admin/settings/contact-section.jsx'
import {
  useSettings,
  useUpdateSettings,
} from '@features/admin/settings/hooks/use-settings.js'
import { PointsSection } from '@features/admin/settings/points-section.jsx'
import { SalesSection } from '@features/admin/settings/sales-section.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, Container, Group, Stack } from '@mantine/core'
import { IconCircleCheck, IconDeviceFloppy } from '@tabler/icons-react'
import { useState } from 'react'

// Formulario separado de la página para poder inicializarlo con lo que llegó del backend.
function SettingsForm({ initial }) {
  const { t } = useI18n()
  const update = useUpdateSettings()

  const [values, setValues] = useState(initial)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  // Una sola puerta de escritura: cada sección manda el parche de sus campos.
  const change = (patch) => {
    setSaved(false)
    setValues((current) => ({ ...current, ...patch }))
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
        <PointsSection values={values} onChange={change} />
        <ContactSection values={values} onChange={change} />
        <SalesSection values={values} onChange={change} />

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
