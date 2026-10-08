/*
  El cupón sobre la base mock. La semántica vive en las reglas compartidas
  (`features/admin/coupons/coupon-rules.js`): acá queda lo que toca la base y el error de la API.
*/

import { ApiError } from '@api/client/api-error.js'
import {
  computeDiscount,
  couponProblem,
  normalizeCouponCode,
} from '@features/admin/coupons/coupon-rules.js'

export function findCouponByCode(db, code) {
  const normalized = normalizeCouponCode(code)
  if (!normalized) return null
  return (
    db.discountCoupons.find(
      (coupon) => normalizeCouponCode(coupon.couponCode) === normalized,
    ) ?? null
  )
}

export function assertCouponUsable(coupon, options) {
  const problem = couponProblem(coupon, options)
  if (problem) {
    throw new ApiError(422, 'COUPON_INVALID', { reason: problem })
  }
  return coupon
}

/*
  Descuento de una venta: snapshot del momento de la compra y, si falta (las ventas sembradas
  no lo guardan), derivado del cupón asociado.
*/
export function saleDiscount(db, sale, subtotal) {
  if (sale.discountAmount != null) return sale.discountAmount
  const coupon = db.discountCoupons.find((item) => item.id === sale.couponId)
  return computeDiscount(coupon, subtotal)
}
