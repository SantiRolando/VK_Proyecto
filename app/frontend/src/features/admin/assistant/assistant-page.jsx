import { PageHeader } from '@components/page-header.jsx'
import { GenerationSource } from '@constants/enums.js'
import { slugToLine } from '@constants/lines.js'
import { useCustomers } from '@features/admin/assistant/hooks/use-customers.js'
import { FitForm } from '@features/fit/fit-form.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Card, Container, Select, Stack, Switch } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

// Modo asistente (US12/T100, FR-027): el personal mide a un tercero. Reusa el
// formulario de medición; la generación queda marcada como del personal y, si
// se vincula a un cliente, aparece en el historial de ese cliente.
export function AssistantPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [onBehalf, setOnBehalf] = useState(true)
  const [customerId, setCustomerId] = useState(null)
  const customers = useCustomers()

  // Igual que `/fit`, la línea puede venir preseleccionada por query.
  const initialLine = slugToLine(searchParams.get('line'))

  return (
    <Container size="md" py="xl">
      <PageHeader
        title={t('admin.assistant.title')}
        subtitle={t('admin.assistant.subtitle')}
      />

      <Stack gap="md">
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

        <Card withBorder radius="md" padding="lg">
          <FitForm
            // Cambiar de modo o de cliente arranca con el formulario limpio.
            key={onBehalf ? `third-${customerId ?? 'none'}` : 'own'}
            initialLine={initialLine}
            source={GenerationSource.Direct}
            onBehalf={onBehalf}
            customerId={onBehalf && customerId ? Number(customerId) : null}
          />
        </Card>
      </Stack>
    </Container>
  )
}
