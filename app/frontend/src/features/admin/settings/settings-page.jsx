import { isApiError } from '@api/client/api-error.js'
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
import { settingsValidation } from '@features/admin/settings/settings-validation.js'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, Container, Group, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconCircleCheck, IconDeviceFloppy } from '@tabler/icons-react'
import { useState } from 'react'

// Formulario separado de la página para poder inicializarlo con lo que llegó del backend.
function SettingsForm({ initial }) {
  const { t } = useI18n()
  const update = useUpdateSettings()

  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const form = useForm({
    initialValues: initial,
    validate: settingsValidation,
    validateInputOnBlur: true,
  })

  // Una sola puerta de escritura: cada sección manda el parche de sus campos. Va por
  // `setFieldValue` y no por `setValues` para que el error del campo se limpie al tocarlo.
  const change = (patch) => {
    setSaved(false)
    for (const [field, value] of Object.entries(patch)) {
      form.setFieldValue(field, value)
    }
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSaved(false)
    setError(null)
    try {
      await update.mutateAsync(values)
      setSaved(true)
    } catch (saveError) {
      // El 422 del mock nombra los campos que rechazó: se muestran bajo su input.
      const fields = isApiError(saveError) ? saveError.details?.fields : null
      if (fields?.length) {
        form.setErrors(Object.fromEntries(fields.map((name) => [name, 'invalid'])))
      } else {
        setError(saveError)
      }
    }
  })

  // Las reglas devuelven el código y acá se traduce: las secciones reciben el texto listo.
  const errors = Object.fromEntries(
    Object.entries(form.errors).map(([field, code]) => [field, t(`validation.${code}`)]),
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <PointsSection values={form.values} errors={errors} onChange={change} />
        <ContactSection values={form.values} errors={errors} onChange={change} />
        <SalesSection values={form.values} errors={errors} onChange={change} />

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
