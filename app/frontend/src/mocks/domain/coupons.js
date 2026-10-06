/*
  Reglas derivadas de DISCOUNT_COUPON. El checkout ofrece un cupón opcional: al crear la
  venta se valida, se guarda el descuento aplicado y se incrementa `usageCount`; al
  cancelar la venta, se decrementa.
*/

import { ApiError } from '@api/client/api-error.js'
import { round2 } from '@mocks/domain/money.js'

export function findCouponByCode(db, code) {
  const normalized = String(code ?? '')
    .trim()
    .toUpperCase()
  if (!normalized) return null
  return (
    db.discountCoupons.find((coupon) => coupon.couponCode.toUpperCase() === normalized) ??
    null
  )
}

// Motivo por el que el cupón no sirve para este usuario, o null si sirve.
export function couponProblem(coupon, { userId, now = new Date() } = {}) {
  if (!coupon.active) return 'inactive'
  if (new Date(coupon.validFrom) > now) return 'notStarted'
  if (new Date(coupon.validUntil) < now) return 'expired'
  // Los cupones canjeados por puntos tienen dueño; los de campaña no.
  if (coupon.userId != null && coupon.userId !== userId) return 'notOwner'
  return null
}

/*
  `Percentage` sobre el subtotal con tope en `maxDiscount`; `Fixed` como monto fijo.
  Nunca descuenta más que el subtotal.
*/
export function computeDiscount(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0

  const raw =
    coupon.discountType === 'Fixed'
      ? coupon.discountValue
      : (subtotal * coupon.discountValue) / 100
  const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw

  return round2(Math.min(capped, subtotal))
}

export function assertCouponUsable(coupon, options) {
  const problem = couponProblem(coupon, options)
  if (problem) {
    throw new ApiError(422, 'COUPON_INVALID', { reason: problem })
  }
  return coupon
}

/*
  Descuento de una venta: snapshot del momento de la compra y, si falta (las ventas
  sembradas no lo guardan), derivado del cupón asociado.
*/
export function saleDiscount(db, sale, subtotal) {
  if (sale.discountAmount != null) return sale.discountAmount
  const coupon = db.discountCoupons.find((item) => item.id === sale.couponId)
  return computeDiscount(coupon, subtotal)
}
