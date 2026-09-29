import { ListSkeleton } from '@components/feedback/skeletons.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { GenerationSource } from '@constants/enums.js'
import { slugToLine } from '@constants/lines.js'
import { useResolvedProfile } from '@features/account/hooks/use-profiles.js'
import { useCustomers } from '@features/admin/assistant/hooks/use-customers.js'
import { useAuth } from '@features/auth/auth-context.js'
import { FitForm } from '@features/fit/fit-form.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Card, Container, Select, Stack, Switch } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { measuresFormValues } from '@utils/measures.js'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

// Origen de la consulta (FR-003): `?src=` explícito o, si la ruta trae línea
// preseleccionada (QR), `QR`; por defecto `Direct`.
function resolveSource(searchParams) {
  const src = searchParams.get('src')
  if (src === 'landing') return GenerationSource.Landing
  if (src === 'qr') return GenerationSource.QR
  if (searchParams.get('line') || searchParams.get('linea')) return GenerationSource.QR
  return GenerationSource.Direct
}

// Pantalla de medición (US1): acepta `/fit?line=endurance` (alias `linea=`,
// Q-10), registra el origen de la consulta y, con sesión, precarga el perfil
// activo (US5/T073).
//
// Modo asistente (US12, FR-027): para un admin, la misma pantalla suma el switch
// "para terceros" y el vínculo opcional a un cliente. Antes vivía en una ruta
// aparte (`/admin/assistant`) que era el mismo formulario con esos dos controles;
// se unificó acá porque no justificaba una pantalla propia
// (bug squash sesión #1).
export function FitPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const { profile, isPending } = useResolvedProfile()

  const isAdmin = user?.type === 'Admin'
  const [onBehalf, setOnBehalf] = useState(false)
  const [customerId, setCustomerId] = useState(null)
  // Solo se piden clientes cuando el modo asistente está activo.
  const customers = useCustomers({ enabled: isAdmin && onBehalf })

  const initialLine = slugToLine(searchParams.get('line') ?? searchParams.get('linea'))
  const source = resolveSource(searchParams)
  // Se espera a los perfiles para no mostrar el formulario vacío y precargarlo
  // un instante después. En modo asistente no aplica: son medidas de un tercero.
  const loadingProfile = isAuthenticated && isPending && !onBehalf

  return (
    <Container size="md" py="xl">
      <PageHeader title={t('fit.title')} subtitle={t('fit.subtitle')} />

      <Stack gap="md">
        {isAdmin && (
          <Card withBorder radius="md" padding="md">
            <Switch
              label={t('admin.assistant.forThirdParties')}
              checked={onBehalf}
              onChange={(event) => setOnBehalf(event.currentTarget.checked)}
            />

            {onBehalf && (
              <Stack gap="sm" mt="md">
                <Select
                  label={t('admin.assistant.linkCustomer')}
                  description={t('admin.assistant.linkCustomerHint')}
                  placeholder={t('admin.assistant.noCustomer')}
                  clearable
                  searchable
                  data={(customers.data?.items ?? []).map((customer) => ({
                    value: String(customer.id),
                    label: `${customer.name} · ${customer.email}`,
                  }))}
                  value={customerId}
                  onChange={setCustomerId}
                />
                <Alert variant="light" color="blue" icon={<IconInfoCircle size={18} />}>
                  {t('admin.assistant.hint')}
                </Alert>
              </Stack>
            )}
          </Card>
        )}

        <Card withBorder radius="md" padding="lg">
          {loadingProfile ? (
            <ListSkeleton rows={3} />
          ) : (
            <FitForm
              // Cambiar de perfil o de modo remonta el formulario con valores nuevos.
              key={onBehalf ? `third-${customerId ?? 'none'}` : (profile?.id ?? 'guest')}
              initialLine={initialLine}
              source={source}
              profileId={onBehalf ? null : (profile?.id ?? null)}
              initialMeasures={onBehalf || !profile ? null : measuresFormValues(profile)}
              onBehalf={onBehalf}
              customerId={onBehalf && customerId ? Number(customerId) : null}
            />
          )}
        </Card>
      </Stack>
    </Container>
  )
}
