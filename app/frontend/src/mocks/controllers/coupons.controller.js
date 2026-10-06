/*
  Cupones: valida el cupón que el cliente escribe en el checkout contra las líneas
  elegidas.
*/

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb } from '@mocks/db/database.js'
import {
  assertCouponUsable,
  computeDiscount,
  findCouponByCode,
} from '@mocks/domain/coupons.js'
import { round2 } from '@mocks/domain/money.js'
import { resolveSaleLines, subtotalOf } from '@mocks/domain/sales.js'
import { register } from '@mocks/router/mock-router.js'

register(
  'POST',
  '/coupons/validate',
  (req) => {
    const { code, items } = req.body
    requireFields(req.body, ['code'])

    const db = getDb()
    const coupon = findCouponByCode(db, code)
    if (!coupon) throw new ApiError(422, 'COUPON_INVALID', { reason: 'notFound' })
    assertCouponUsable(coupon, { userId: req.auth.user.id })

    // Sin líneas (por ejemplo, validar al entrar al checkout) el descuento es 0.
    const subtotal =
      Array.isArray(items) && items.length > 0
        ? subtotalOf(resolveSaleLines(db, items))
        : 0
    const discount = computeDiscount(coupon, subtotal)

    return {
      status: 200,
      data: {
        valid: true,
        code: coupon.couponCode,
        discount,
        subtotal,
        total: round2(subtotal - discount),
        coupon: {
          id: coupon.id,
          code: coupon.couponCode,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount ?? null,
        },
      },
    }
  },
  { auth: 'user' },
)
