/*
  Cupones del panel: plantillas canjeables y cupones asignados. Editar el `pointsCost` de una
  plantilla se refleja al instante en el cliente (`GET /rewards` lee la misma colección).
  La validación es la de las reglas compartidas, con los campos que usa el formulario.
*/

import { ApiError } from '@api/client/api-error.js'
import {
  couponDraftErrors,
  endOfCouponDay,
  normalizeCouponCode,
  optionalNumber,
  startOfCouponDay,
} from '@features/admin/coupons/coupon-rules.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

function serializeAdminCoupon(db, coupon, now = new Date()) {
  const owner = db.users.find((item) => item.id === coupon.userId) ?? null

  return {
    id: coupon.id,
    code: coupon.couponCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount ?? null,
    maxUses: coupon.maxUses ?? null,
    pointsCost: coupon.pointsCost ?? null,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    active: coupon.active !== false,
    usageCount: coupon.usageCount ?? 0,
    owner: owner ? { id: owner.id, name: owner.name } : null,
    // Plantilla canjeable hoy (lo mismo que ofrece `GET /rewards`).
    redeemable:
      coupon.active !== false &&
      coupon.pointsCost != null &&
      new Date(coupon.validFrom) <= now &&
      new Date(coupon.validUntil) >= now,
  }
}

// Rechaza la plantilla nombrando los campos, como los manda el formulario.
function assertDraft(db, draft, ignoreId = null) {
  const takenCodes = db.discountCoupons
    .filter((coupon) => coupon.id !== ignoreId)
    .map((coupon) => coupon.couponCode)
  const fields = Object.keys(couponDraftErrors(draft, { takenCodes }))
  if (fields.length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields })
  }
}

// Un PATCH puede traer solo un campo: se valida la plantilla que queda, no el parche suelto.
function draftFrom(coupon, body) {
  return {
    couponCode: coupon.couponCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount ?? null,
    maxUses: coupon.maxUses ?? null,
    pointsCost: coupon.pointsCost ?? null,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    ...body,
  }
}

function applyDraft(coupon, draft) {
  coupon.couponCode = normalizeCouponCode(draft.couponCode)
  coupon.discountType = draft.discountType
  coupon.discountValue = Number(draft.discountValue)
  coupon.maxDiscount = optionalNumber(draft.maxDiscount)
  coupon.maxUses = optionalNumber(draft.maxUses)
  coupon.pointsCost = optionalNumber(draft.pointsCost)
  // El formulario manda días: el "desde" abre su día y el "hasta" lo cierra entero.
  coupon.validFrom = startOfCouponDay(draft.validFrom)
  coupon.validUntil = endOfCouponDay(draft.validUntil)
}

register(
  'GET',
  '/admin/coupons',
  () => {
    const db = getDb()
    const data = [...db.discountCoupons]
      .sort((a, b) => a.id - b.id)
      .map((coupon) => serializeAdminCoupon(db, coupon))

    return { status: 200, data, meta: { total: data.length } }
  },
  { auth: 'admin' },
)

register(
  'POST',
  '/admin/coupons',
  (req) => {
    const db = getDb()
    assertDraft(db, req.body)

    return mutate((current) => {
      const coupon = {
        id: nextId(current.discountCoupons),
        productId: null,
        userId: null,
        usageCount: 0,
        active: true,
      }
      applyDraft(coupon, req.body)
      coupon.active = req.body.active === undefined ? true : Boolean(req.body.active)
      current.discountCoupons.push(coupon)

      return { status: 201, data: serializeAdminCoupon(current, coupon) }
    })
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  '/admin/coupons/:id',
  (req) => {
    return mutate((db) => {
      const coupon = db.discountCoupons.find((item) => item.id === Number(req.params.id))
      if (!coupon) throw new ApiError(404, 'NOT_FOUND')

      const draft = draftFrom(coupon, req.body)
      assertDraft(db, draft, coupon.id)
      applyDraft(coupon, draft)
      if (req.body.active !== undefined) {
        coupon.active = Boolean(req.body.active)
      }

      return { status: 200, data: serializeAdminCoupon(db, coupon) }
    })
  },
  { auth: 'admin' },
)
