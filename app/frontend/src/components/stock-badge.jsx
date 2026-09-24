import { Badge } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

const STATUS_COLORS = {
  in: 'green',
  low: 'orange',
  out: 'red',
}

// Estado de disponibilidad derivado: sin stock / bajo el mínimo / con stock.
export function StockBadge({ available, minStock = 0 }) {
  const { t } = useI18n()
  const status = available <= 0 ? 'out' : available < minStock ? 'low' : 'in'

  return (
    <Badge variant="light" color={STATUS_COLORS[status]}>
      {t(`stock.badge.${status}`)}
    </Badge>
  )
}
