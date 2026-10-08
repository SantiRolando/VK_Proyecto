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
import { settingsSchema } from '@features/admin/settings/settings-schema.js'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, Container, Group, Stack } from '@mantine/core'
import { IconCircleCheck, IconDeviceFloppy } from '@tabler/icons-react'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { useState } from 'react'

// Formulario separado de la página para poder inicializarlo con lo que llegó del backend.
function SettingsForm({ initial }) {
  const { t } = useI18n()
  const update = useUpdateSettings()

  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  // Una sola puerta de escritura: cada sección manda el parche de sus campos, y tocar un
  // campo se lleva su error.
  const change = (patch) => {
    setSaved(false)
    setValues((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const field of Object.keys(patch)) delete next[field]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const parsed = settingsSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error))
      return
    }

    try {
      // Se manda el estado completo y no `parsed.data`: el schema valida solo los canales
      // de contacto, así que `parsed.data` se comería los campos numéricos.
      await update.mutateAsync(values)
      setSaved(true)
      setErrors({})
    } catch (saveError) {
      // El 422 del mock nombra los campos que rechazó: se muestran bajo su input.
      const fields = isApiError(saveError) ? saveError.details?.fields : null
      if (fields?.length) {
        setErrors(Object.fromEntries(fields.map((name) => [name, 'invalid'])))
      } else {
        setError(saveError)
      }
    }
  }

  // Los códigos de la validación se traducen acá: las secciones reciben el texto listo.
  const messages = Object.fromEntries(
    Object.entries(errors).map(([field, code]) => [field, t(`validation.${code}`)]),
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <PointsSection values={values} errors={messages} onChange={change} />
        <ContactSection values={values} errors={messages} onChange={change} />
        <SalesSection values={values} errors={messages} onChange={change} />

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
