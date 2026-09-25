import { useState } from 'react'
import { Alert, Button, SegmentedControl, Select, Stack, Text } from '@mantine/core'
import { IconMapPin, IconShoppingBag } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { ErrorState } from '../../components/feedback/error-state.jsx'
import { ListSkeleton } from '../../components/feedback/skeletons.jsx'
import { AddressForm } from './address-form.jsx'
import { addressLine, addressFullLine } from './address-utils.js'

// Paso 1 del checkout (T062): retiro en local o envío a una dirección de la
// agenda (con alta rápida si todavía no hay ninguna).
export function DeliveryStep({
  method,
  onMethodChange,
  addresses,
  isLoading,
  queryError,
  onRetry,
  addressId,
  onAddressChange,
  invalid,
}) {
  const { t } = useI18n()
  const [adding, setAdding] = useState(false)

  return (
    <Stack gap="md">
      <SegmentedControl
        fullWidth
        value={method}
        onChange={onMethodChange}
        data={[
          { value: 'StorePickup', label: t('enums.deliveryMethod.StorePickup') },
          { value: 'HomeDelivery', label: t('enums.deliveryMethod.HomeDelivery') },
        ]}
      />

      {method === 'StorePickup' ? (
        <Alert variant="light" color="vikinga" icon={<IconShoppingBag size={18} />}>
          <Text size="sm">{t('checkout.delivery.pickupHint')}</Text>
        </Alert>
      ) : (
        <Stack gap="sm">
          {isLoading && <ListSkeleton rows={2} />}
          {!isLoading && queryError && (
            <ErrorState error={queryError} onRetry={onRetry} />
          )}

          {!isLoading && !queryError && (
            <>
              {addresses.length === 0 && (
                <Alert variant="light" color="orange">
                  <Text size="sm">{t('checkout.delivery.noAddresses')}</Text>
                </Alert>
              )}

              {addresses.length > 0 && (
                <Select
                  label={t('checkout.delivery.address')}
                  placeholder={t('checkout.delivery.addressPlaceholder')}
                  data={addresses.map((address) => ({
                    value: String(address.id),
                    label: addressLine(address),
                  }))}
                  value={addressId != null ? String(addressId) : null}
                  onChange={(value) => onAddressChange(value ? Number(value) : null)}
                  error={invalid ? t('validation.required') : null}
                  allowDeselect={false}
                />
              )}

              {adding ? (
                <AddressForm
                  onCreated={(address) => {
                    setAdding(false)
                    onAddressChange(address.id)
                  }}
                  onCancel={() => setAdding(false)}
                />
              ) : (
                <Button
                  variant="light"
                  size="compact-sm"
                  leftSection={<IconMapPin size={14} />}
                  onClick={() => setAdding(true)}
                >
                  {t('checkout.delivery.newAddress')}
                </Button>
              )}

              {addressId != null && !adding && (
                <Text size="xs" c="dimmed">
                  {addressFullLine(
                    addresses.find((address) => address.id === addressId),
                  )}
                </Text>
              )}
            </>
          )}
        </Stack>
      )}
    </Stack>
  )
}
