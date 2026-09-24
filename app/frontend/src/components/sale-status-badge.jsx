import { Badge } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

const STATUS_COLORS = {
  PendingCoordination: 'yellow',
  Contacted: 'blue',
  Confirmed: 'green',
  Cancelled: 'red',
}

// Estado de una venta: etiqueta i18n + color consistente (máquina de
// estados en mocks/domain/sale-state-machine.js).
export function SaleStatusBadge({ status }) {
  const { t } = useI18n()

  return (
    <Badge variant="light" color={STATUS_COLORS[status] ?? 'gray'}>
      {t(`enums.saleStatus.${status}`)}
    </Badge>
  )
}
