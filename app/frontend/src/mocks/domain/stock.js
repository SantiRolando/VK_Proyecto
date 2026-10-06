/*
  Reglas derivadas de stock. El ER no tiene columna de "reservado": la reserva se deriva
  de las ventas abiertas.
*/

import { RESERVING_SALE_STATUSES } from '@mocks/domain/sale-state-machine.js'

// Σ SaleLine.quantity de ventas en PendingCoordination | Contacted.
export function reservedQuantity(db, variantId) {
  const reservingSaleIds = new Set(
    db.sales
      .filter((sale) => RESERVING_SALE_STATUSES.includes(sale.status))
      .map((sale) => sale.id),
  )

  return db.saleLines
    .filter((line) => line.variantId === variantId && reservingSaleIds.has(line.saleId))
    .reduce((sum, line) => sum + line.quantity, 0)
}

// disponible = físico − reservado (nunca negativo).
export function availableQuantity(db, variantId) {
  const variant = db.productVariants.find((item) => item.id === variantId)
  if (!variant) return 0
  return Math.max(0, variant.quantity - reservedQuantity(db, variantId))
}

/*
  ¿Hay alguna variante activa de ese talle con stock disponible? Es la base de
  `SIZE_GENERATION.stockAvailableAtQuery`.
*/
export function hasStockForSize(db, sizeId) {
  return db.productVariants.some(
    (variant) =>
      variant.active &&
      variant.sizeId === sizeId &&
      availableQuantity(db, variant.id) > 0,
  )
}

// Stock crítico: variante activa con disponible por debajo del mínimo.
export function isCriticalStock(db, variant) {
  if (!variant.active) return false
  return availableQuantity(db, variant.id) < variant.minStock
}

export function listCriticalVariants(db) {
  return db.productVariants.filter((variant) => isCriticalStock(db, variant))
}
