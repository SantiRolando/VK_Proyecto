/*
  Recompensas: plantillas de cupón canjeables por puntos, canje y "mis cupones". La validez
  del cupón canjeado es la misma que la de la plantilla (`domain/coupons.js` la evalúa en
  el checkout).
*/

import { ApiError } from '@api/client/api-error.js'
import { serializeMovement } from '@mocks/controllers/points.controller.js'
import { getDb, mutate } from '@mocks/db/database.js'
import { couponProblem } from '@mocks/domain/coupons.js'
import { redeemableTemplates, redeemTemplate } from '@mocks/domain/points.js'
import { register } from '@mocks/router/mock-router.js'

// Plantilla disponible para canjear (el `pointsCost` es lo que ve el cliente).
function serializeTemplate(coupon) {
  return {
    id: coupon.id,
    code: coupon.couponCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount ?? null,
    pointsCost: coupon.pointsCost,
  }
}

function serializeOwnedCoupon(coupon) {
  return {
    id: coupon.id,
    code: coupon.couponCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount ?? null,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    usageCount: coupon.usageCount,
  }
}

register(
  'GET',
  '/rewards',
  () => {
    const templates = redeemableTemplates(getDb()).map(serializeTemplate)
    return { status: 200, data: templates }
  },
  { auth: 'user' },
)

register(
  'GET',
  '/me/coupons',
  (req) => {
    const db = getDb()
    const now = new Date()
    const mine = db.discountCoupons
      .filter(
        (coupon) =>
          coupon.userId === req.auth.user.id &&
          couponProblem(coupon, { userId: req.auth.user.id, now }) === null,
      )
      .sort((a, b) => new Date(b.validUntil) - new Date(a.validUntil))
      .map(serializeOwnedCoupon)

    return { status: 200, data: mine }
  },
  { auth: 'user' },
)

register(
  'POST',
  '/rewards/:couponId/redeem',
  (req) => {
    return mutate((db) => {
      const template =
        db.discountCoupons.find((coupon) => coupon.id === Number(req.params.couponId)) ??
        null
      const available =
        template &&
        redeemableTemplates(db).some((candidate) => candidate.id === template.id)
      if (!available) throw new ApiError(404, 'NOT_FOUND')

      const { coupon, balance, cost } = redeemTemplate(db, {
        user: req.auth.user,
        template,
      })

      return {
        status: 201,
        data: {
          coupon: serializeOwnedCoupon(coupon),
          balance,
          cost,
          movement: serializeMovement(db.pointsMovements[db.pointsMovements.length - 1]),
        },
      }
    })
  },
  { auth: 'user' },
)
