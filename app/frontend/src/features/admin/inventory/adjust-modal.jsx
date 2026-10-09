import { ErrorState } from '@components/feedback/error-state.jsx'
import {
  useAdjustStock,
  useStockReasons,
} from '@features/admin/inventory/hooks/use-inventory.js'
import { useI18n } from '@i18n/context.js'
import { Button, Group, Modal, NumberInput, Radio, Stack, Text } from '@mantine/core'
import { useState } from 'react'

/*
  Ajuste de una variante: el motivo es obligatorio; la dirección la impone el motivo para los
  motivos que la fijan (el mock lo informa) y el resto la elige el admin. El físico cambia solo
  por acá, así todo ajuste queda auditado.
*/
export function AdjustModal({ variant, opened, onClose }) {
  const { t } = useI18n()
  const reasons = useStockReasons()
  const adjust = useAdjustStock()

  const [reason, setReason] = useState(null)
  const [direction, setDirection] = useState('Inbound')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState(null)

  const selected = reasons.data?.find((item) => item.value === reason)
  const fixedDirection = selected?.direction ?? null
  const open = opened && variant !== null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!reason) return

    setError(null)
    try {
      await adjust.mutateAsync({
        reason,
        direction: fixedDirection ?? direction,
        lines: [{ variantId: variant.id, quantity: Number(quantity) }],
      })
      setReason(null)
      setQuantity(1)
      onClose()
    } catch (adjustError) {
      setError(adjustError)
    }
  }

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={open}
      onClose={onClose}
      title={t('admin.inventory.adjust')}
      centered
    >
      {variant && (
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <div>
              <Text fw={600}>{variant.sku}</Text>
              <Text size="sm" c="dimmed">
                {t('admin.inventory.physical')}: {variant.quantity} ·{' '}
                {t('admin.inventory.reserved')}: {variant.reserved} ·{' '}
                {t('admin.inventory.available')}: {variant.available}
              </Text>
            </div>

            <Radio.Group
              label={t('admin.inventory.reason')}
              value={reason}
              onChange={setReason}
              withAsterisk
            >
              <Stack gap={6} mt="xs">
                {(reasons.data ?? []).map((item) => (
                  <Radio
                    key={item.value}
                    value={item.value}
                    label={t(`enums.transactionReason.${item.value}`)}
                  />
                ))}
              </Stack>
            </Radio.Group>

            {fixedDirection ? (
              <Text size="sm" c="dimmed">
                {t('admin.inventory.directionFixed', {
                  direction: t(`enums.transactionDirection.${fixedDirection}`),
                })}
              </Text>
            ) : (
              <Radio.Group
                label={t('admin.inventory.direction')}
                value={direction}
                onChange={setDirection}
              >
                <Group gap="lg" mt="xs">
                  {['Inbound', 'Outbound'].map((value) => (
                    <Radio
                      key={value}
                      value={value}
                      label={t(`enums.transactionDirection.${value}`)}
                      disabled={!reason}
                    />
                  ))}
                </Group>
              </Radio.Group>
            )}

            <NumberInput
              label={t('admin.inventory.quantity')}
              value={quantity}
              onChange={(value) => setQuantity(Number(value) || 1)}
              min={1}
              required
            />

            {error && <ErrorState error={error} onRetry={() => setError(null)} />}

            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={adjust.isPending} disabled={!reason}>
                {t('admin.inventory.save')}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
