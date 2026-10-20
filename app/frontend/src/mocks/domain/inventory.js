/*
  Movimientos de stock del panel. El ajuste es auditable: `applyStockTransaction` valida el
  motivo, la dirección y las líneas, ajusta el físico de cada variante y devuelve las líneas
  para que el controller arme la TRANSACTION.
*/

import { ApiError } from '@api/client/api-error.js'
import { StockDirection, StockReason } from '@constants/enums.js'
import { notifyRestockAlerts } from '@mocks/domain/alerts.js'
import { availableQuantity } from '@mocks/domain/stock.js'

// Motivos que el admin registra a mano: `SaleConfirmed` lo crea la confirmación de venta.
export const MANUAL_REASONS = [
  StockReason.GoodsReceipt,
  StockReason.SizeExchange,
  StockReason.LossDefective,
  StockReason.ManualAdjustment,
]

function checkDirection(direction) {
  if (!Object.values(StockDirection).includes(direction)) {
    throw new ApiError(400, 'VALIDATION_ERROR', { fields: ['direction'] })
  }
}

function normalizeLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', { fields: ['lines'] })
  }

  const seen = new Set()
  for (const line of lines) {
    const variantId = Number(line?.variantId)
    const quantity = Number(line?.quantity)
    const valid =
      Number.isInteger(variantId) &&
      variantId > 0 &&
      Number.isInteger(quantity) &&
      quantity > 0
    if (!valid) throw new ApiError(400, 'VALIDATION_ERROR', { fields: ['lines'] })

    // Un movimiento no repite la variante en dos líneas.
    if (seen.has(variantId)) throw new ApiError(400, 'BAD_REQUEST')
    seen.add(variantId)
  }

  return lines.map((line) => ({
    variantId: Number(line.variantId),
    quantity: Number(line.quantity),
  }))
}

/*
  La variante queda crítica cuando el disponible, que descuenta lo reservado por ventas
  abiertas, cae por debajo del mínimo. Solo se abre una alerta si no hay una activa.
*/
function openCriticalAlert(db, variant) {
  const alreadyActive = db.alerts.some(
    (alert) =>
      alert.variantId === variant.id &&
      alert.alertType === 'CriticalStock' &&
      alert.status === 'Active',
  )
  if (alreadyActive) return

  db.alerts.push({
    id: db.alerts.reduce((max, alert) => Math.max(max, alert.id), 0) + 1,
    variantId: variant.id,
    userId: null,
    alertType: 'CriticalStock',
    notificationMode: 'InApp',
    status: 'Active',
    createdAt: new Date().toISOString(),
  })
}

export function applyStockTransaction(db, { reason, direction, lines }) {
  if (!MANUAL_REASONS.includes(reason)) throw new ApiError(400, 'BAD_REQUEST')
  checkDirection(direction)

  const normalized = normalizeLines(lines)

  // Validar todo antes de tocar el físico: un movimiento no puede quedar a medias.
  const prepared = normalized.map((line) => {
    const variant = db.productVariants.find((item) => item.id === line.variantId)
    if (!variant) throw new ApiError(404, 'NOT_FOUND', { variantId: line.variantId })
    if (
      direction === StockDirection.Outbound &&
      line.quantity > availableQuantity(db, variant.id)
    ) {
      throw new ApiError(409, 'CONFLICT')
    }

    return {
      variant,
      quantity: line.quantity,
      wasAvailable: availableQuantity(db, variant.id),
    }
  })

  for (const item of prepared) {
    item.variant.quantity +=
      direction === StockDirection.Inbound ? item.quantity : -item.quantity

    // Reposición: la variante pasa de 0 a tener disponible.
    if (direction === StockDirection.Inbound && item.wasAvailable === 0) {
      if (availableQuantity(db, item.variant.id) > 0) {
        notifyRestockAlerts(db, item.variant.id)
      }
    }

    if (availableQuantity(db, item.variant.id) < item.variant.minStock) {
      openCriticalAlert(db, item.variant)
    }
  }

  return {
    direction,
    lines: prepared.map((item) => ({
      variantId: item.variant.id,
      quantity: item.quantity,
    })),
  }
}
