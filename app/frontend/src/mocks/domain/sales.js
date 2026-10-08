/*
  Reglas de composición de SALE. "Crear venta" es atómico: se resuelven las líneas contra
  el catálogo y se valida la disponibilidad de todas antes de escribir nada. La reserva es
  derivada de las ventas abiertas (`domain/stock.js`): no hay tabla de reservas.
*/

import { ApiError } from '@api/client/api-error.js'
import { round2 } from '@mocks/domain/money.js'
import { RESERVING_SALE_STATUSES } from '@mocks/domain/sale-state-machine.js'
import { settingNumber } from '@mocks/domain/settings.js'
import { availableQuantity } from '@mocks/domain/stock.js'

export const SALE_CHANNELS = ['Email', 'Whatsapp']
export const DELIVERY_METHODS = ['StorePickup', 'HomeDelivery']

/*
  Une ítems repetidos de la misma variante: dos líneas de 1 unidad no pueden pasar la
  validación de stock cuando solo hay una disponible.
*/
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['items'] })
  }

  const quantities = new Map()
  for (const item of items) {
    const variantId = Number(item?.variantId)
    const quantity = Number(item?.quantity)
    const valid =
      Number.isInteger(variantId) &&
      variantId > 0 &&
      Number.isInteger(quantity) &&
      quantity > 0
    if (!valid) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['items'] })
    }
    quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity)
  }

  return [...quantities.entries()].map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }))
}

/*
  Resuelve cada ítem contra el catálogo: variante y producto activos, talle y precio
  unitario del producto. No valida stock (`checkAvailability`).
*/
export function resolveSaleLines(db, items) {
  return normalizeItems(items).map(({ variantId, quantity }) => {
    const variant = db.productVariants.find(
      (item) => item.id === variantId && item.active,
    )
    if (!variant) throw new ApiError(404, 'NOT_FOUND', { variantId })

    const product = db.products.find(
      (item) => item.id === variant.productId && item.active,
    )
    if (!product) throw new ApiError(404, 'NOT_FOUND', { variantId })

    return {
      variantId,
      quantity,
      unitPrice: product.price,
      lineTotal: round2(product.price * quantity),
      variant,
      product,
      size: db.sizes.find((item) => item.id === variant.sizeId) ?? null,
    }
  })
}

export function subtotalOf(lines) {
  return round2(lines.reduce((sum, line) => sum + line.lineTotal, 0))
}

/*
  409 con la variante y las unidades disponibles para que la pantalla pueda explicar el
  conflicto sin perder la selección.
*/
export function checkAvailability(db, lines) {
  for (const line of lines) {
    const available = availableQuantity(db, line.variantId)
    if (line.quantity > available) {
      throw new ApiError(409, 'STOCK_INSUFFICIENT', {
        variantId: line.variantId,
        available,
        requested: line.quantity,
      })
    }
  }
}

/*
  Líneas de una venta con el detalle que consumen las pantallas: producto, talle, color y
  totales.
*/
export function saleLinesWithDetails(db, sale) {
  return db.saleLines
    .filter((line) => line.saleId === sale.id)
    .map((line) => {
      const variant =
        db.productVariants.find((item) => item.id === line.variantId) ?? null
      const product = variant
        ? (db.products.find((item) => item.id === variant.productId) ?? null)
        : null
      const size = variant
        ? (db.sizes.find((item) => item.id === variant.sizeId) ?? null)
        : null

      return {
        id: line.id,
        variantId: line.variantId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: round2(line.unitPrice * line.quantity),
        color: variant?.color ?? null,
        sku: variant?.sku ?? null,
        product: product
          ? {
              id: product.id,
              line: product.line,
              model: product.model,
              description: product.description,
            }
          : null,
        size: size ? { id: size.id, code: size.code } : null,
      }
    })
}

/*
  Antigüedad de una venta en días, para que el admin vea las que llevan mucho tiempo abiertas.
  Se redondea: la seed fija las fechas a las 12:00, así que con `floor` el resultado dependía
  de la hora a la que corriera el proceso.
*/
export function saleAgeDays(sale, now = new Date()) {
  const created = new Date(sale.createdAt).getTime()
  return Math.max(0, Math.round((now.getTime() - created) / 86_400_000))
}

// ¿La venta sigue reteniendo stock y pasó el umbral `stale_sale_days`?
export function isStaleSale(db, sale, now = new Date()) {
  if (!RESERVING_SALE_STATUSES.includes(sale.status)) return false
  const threshold = settingNumber(db.settings, 'stale_sale_days', 3)
  return saleAgeDays(sale, now) >= threshold
}

/*
  Confirmar la venta: descuenta el físico de cada variante y devuelve sus líneas para
  registrar el movimiento de stock.
*/
export function applyConfirmationToStock(db, sale) {
  const lines = db.saleLines.filter((line) => line.saleId === sale.id)

  for (const line of lines) {
    const variant = db.productVariants.find((item) => item.id === line.variantId)
    if (!variant) continue
    variant.quantity = Math.max(0, variant.quantity - line.quantity)
  }

  return lines
}

// Cancelar la venta: la reserva se libera sola (es derivada) y el cupón recupera su uso.
export function releaseCouponUsage(db, sale) {
  if (!sale.couponId) return null

  const coupon = db.discountCoupons.find((item) => item.id === sale.couponId)
  if (!coupon) return null

  coupon.usageCount = Math.max(0, coupon.usageCount - 1)
  return coupon
}
