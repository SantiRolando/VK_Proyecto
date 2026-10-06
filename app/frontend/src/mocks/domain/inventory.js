/*
  Movimientos de stock del panel. El ajuste es auditable: `applyStockTransaction` valida
  el motivo y la dirección, ajusta el físico de cada variante y devuelve las líneas para
  que el controller arme la TRANSACTION. Si un ingreso lleva el disponible de 0 a > 0,
  dispara el aviso de reposición.
*/

import { ApiError } from '@api/client/api-error.js'
import { notifyRestockAlerts } from '@mocks/domain/alerts.js'
import { availableQuantity } from '@mocks/domain/stock.js'

/*
  Motivos que el admin registra a mano. `SaleConfirmed` lo crea la confirmación de venta
  y no se elige desde el formulario.
*/
export const MANUAL_REASONS = [
  'GoodsReceipt',
  'SizeExchange',
  'LossDefective',
  'ManualAdjustment',
]

// Algunos motivos fijan la dirección; el resto la elige el admin.
const FIXED_DIRECTIONS = { GoodsReceipt: 'Inbound', LossDefective: 'Outbound' }

/*
  Dirección impuesta por el motivo (null = la elige el admin). El FE la recibe por
  contrato, así no repite la regla.
*/
export function fixedDirection(reason) {
  return FIXED_DIRECTIONS[reason] ?? null
}

export function resolveDirection(reason, direction) {
  const fixed = fixedDirection(reason)
  if (fixed) return fixed
  if (direction !== 'Inbound' && direction !== 'Outbound') {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['direction'] })
  }
  return direction
}

function normalizeLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['lines'] })
  }

  const quantities = new Map()
  for (const line of lines) {
    const variantId = Number(line?.variantId)
    const quantity = Number(line?.quantity)
    const valid =
      Number.isInteger(variantId) &&
      variantId > 0 &&
      Number.isInteger(quantity) &&
      quantity > 0
    if (!valid) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['lines'] })

    quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity)
  }

  return [...quantities.entries()].map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }))
}

export function applyStockTransaction(db, { reason, direction, lines }) {
  const resolved = resolveDirection(reason, direction)
  const normalized = normalizeLines(lines)

  // Validar todo antes de tocar el físico: un movimiento no puede quedar a medias.
  const prepared = normalized.map((line) => {
    const variant = db.productVariants.find((item) => item.id === line.variantId)
    if (!variant) throw new ApiError(404, 'NOT_FOUND', { variantId: line.variantId })
    if (!variant.active) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['variantId'] })
    }
    if (resolved === 'Outbound' && line.quantity > variant.quantity) {
      throw new ApiError(422, 'VALIDATION_ERROR', {
        fields: ['quantity'],
        variantId: variant.id,
        physical: variant.quantity,
      })
    }

    return {
      variant,
      quantity: line.quantity,
      wasAvailable: availableQuantity(db, variant.id),
    }
  })

  let alertsNotified = 0
  for (const item of prepared) {
    item.variant.quantity += resolved === 'Inbound' ? item.quantity : -item.quantity

    // Reposición: la variante pasa de 0 a tener disponible.
    if (resolved === 'Inbound' && item.wasAvailable === 0) {
      if (availableQuantity(db, item.variant.id) > 0) {
        alertsNotified += notifyRestockAlerts(db, item.variant.id)
      }
    }
  }

  return {
    direction: resolved,
    alertsNotified,
    lines: prepared.map((item) => ({
      variantId: item.variant.id,
      quantity: item.quantity,
    })),
  }
}
