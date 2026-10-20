import { ErrorState } from '@components/feedback/error-state.jsx'
import { StockDirection } from '@constants/enums.js'
import { useAdjustStock } from '@features/admin/inventory/hooks/use-inventory.js'
import {
  fixedDirection,
  MANUAL_REASONS,
} from '@features/admin/inventory/stock-reasons.js'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Radio,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useState } from 'react'

const NOTE_MAX_LENGTH = 300

/*
  Ajuste de una variante: el motivo es obligatorio y algunos motivos fijan la dirección. El
  físico cambia solo por acá, así todo ajuste queda auditado.
*/
export function AdjustModal({ variant, opened, onClose }) {
  const { t } = useI18n()
  const adjust = useAdjustStock()

  const [reason, setReason] = useState(null)
  const [direction, setDirection] = useState(StockDirection.Inbound)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [insufficient, setInsufficient] = useState(false)

  const open = opened && variant !== null
  const selectedDirection = fixedDirection(reason) ?? direction

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!reason) return

    /*
      La salida descuenta del disponible, que es el físico menos lo reservado por ventas
      abiertas: se comprueba acá para decirlo con el número que el admin está mirando.
    */
    if (
      selectedDirection === StockDirection.Outbound &&
      Number(quantity) > variant.available
    ) {
      setInsufficient(true)
      return
    }

    setInsufficient(false)
    setError(null)
    try {
      await adjust.mutateAsync({
        reason,
        direction: selectedDirection,
        note,
        lines: [{ variantId: variant.id, quantity: Number(quantity) }],
      })
      setReason(null)
      setQuantity(1)
      setNote('')
      onClose()
    } catch (adjustError) {
      setError(adjustError)
    }
  }

  const conflict = insufficient || error?.status === 409

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
                {MANUAL_REASONS.map((value) => (
                  <Radio
                    key={value}
                    value={value}
                    label={t(`enums.transactionReason.${value}`)}
                  />
                ))}
              </Stack>
            </Radio.Group>

            {fixedDirection(reason) ? (
              <Text size="sm" c="dimmed">
                {t('admin.inventory.directionFixed', {
                  direction: t(`enums.transactionDirection.${selectedDirection}`),
                })}
              </Text>
            ) : (
              <Radio.Group
                label={t('admin.inventory.direction')}
                value={direction}
                onChange={setDirection}
              >
                <Group gap="lg" mt="xs">
                  {Object.values(StockDirection).map((value) => (
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

            <Textarea
              label={t('admin.inventory.note')}
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder={t('admin.inventory.notePlaceholder')}
              maxLength={NOTE_MAX_LENGTH}
              rows={2}
            />

            {conflict && (
              <Alert
                variant="light"
                color="red"
                title={t('common.error')}
                icon={<IconAlertCircle size={18} />}
              >
                <Text size="sm">
                  {t('admin.inventory.insufficient', { count: variant.available })}
                </Text>
              </Alert>
            )}

            {!conflict && error && (
              <ErrorState error={error} onRetry={() => setError(null)} />
            )}

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
