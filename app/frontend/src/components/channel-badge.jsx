import { Badge } from '@mantine/core'
import { IconBrandWhatsapp, IconMail } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'

const CHANNEL_ICONS = {
  Email: IconMail,
  Whatsapp: IconBrandWhatsapp,
}

// Canal de coordinación de una venta: ícono + etiqueta i18n.
export function ChannelBadge({ channel }) {
  const { t } = useI18n()
  const Icon = CHANNEL_ICONS[channel] ?? IconMail
  const color = channel === 'Whatsapp' ? 'teal' : 'blue'

  return (
    <Badge variant="light" color={color} leftSection={<Icon size={12} />}>
      {t(`enums.channel.${channel}`)}
    </Badge>
  )
}
