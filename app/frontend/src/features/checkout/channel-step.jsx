import { useI18n } from '@i18n/context.js'
import { Alert, SegmentedControl, Stack, Text } from '@mantine/core'
import { IconMessage } from '@tabler/icons-react'

// Paso 2 del checkout (T062): Email (por defecto) o WhatsApp. El canal no
// muta después de crear la venta (§5.4), así que se elige acá y no en el
// seguimiento.
export function ChannelStep({ channel, onChannelChange }) {
  const { t } = useI18n()

  return (
    <Stack gap="md">
      <SegmentedControl
        fullWidth
        value={channel}
        onChange={onChannelChange}
        data={[
          { value: 'Email', label: t('enums.channel.Email') },
          { value: 'Whatsapp', label: t('enums.channel.Whatsapp') },
        ]}
      />

      <Alert variant="light" color="vikinga" icon={<IconMessage size={18} />}>
        <Text size="sm">{t('checkout.channel.hint')}</Text>
      </Alert>
    </Stack>
  )
}
