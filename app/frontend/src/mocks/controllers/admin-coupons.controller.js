// Cupones del panel (US11/T097, FR-026): plantillas canjeables y cupones
// asignados. Editar el `pointsCost` de una plantilla se refleja al instante en
// el cliente (`GET /rewards` lee la misma colección).

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const DISCOUNT_TYPES = ['Fixed', 'Percentage']

export function serializeAdminCoupon(db, coupon, now = new Date()) {
  const owner = db.users.find((item) => item.id === coupon.userId) ?? null

  return {
    id: coupon.id,
    code: coupon.couponCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount ?? null,
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

function validateDiscount(type, value) {
  if (!DISCOUNT_TYPES.includes(type)) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['discountType'] })
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['discountValue'] })
  }
  if (type === 'Percentage' && number > 100) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['discountValue'] })
  }
  return number
}

function validateDate(field, value) {
  const time = new Date(String(value)).getTime()
  if (Number.isNaN(time)) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: [field] })
  }
  return new Date(time).toISOString()
}

function validatePointsCost(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['pointsCost'] })
  }
  return number
}

function normalizeCode(db, code, ignoreId = null) {
  const value = String(code ?? '')
    .trim()
    .toUpperCase()
  if (!value) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['couponCode'] })

  const taken = db.discountCoupons.some(
    (coupon) => coupon.id !== ignoreId && coupon.couponCode.toUpperCase() === value,
  )
  if (taken) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['couponCode'] })
  return value
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
    const {
      couponCode,
      discountType,
      discountValue,
      maxDiscount = null,
      pointsCost = null,
      validFrom,
      validUntil,
      active = true,
    } = req.body
    requireFields(req.body, [
      'couponCode',
      'discountType',
      'discountValue',
      'validFrom',
      'validUntil',
    ])

    const value = validateDiscount(discountType, discountValue)
    const cost = validatePointsCost(pointsCost)

    return mutate((db) => {
      const coupon = {
        id: nextId(db.discountCoupons),
        productId: null,
        userId: null,
        couponCode: normalizeCode(db, couponCode),
        usageCount: 0,
        discountType,
        discountValue: value,
        maxDiscount: maxDiscount === null ? null : Number(maxDiscount),
        pointsCost: cost,
        validFrom: validateDate('validFrom', validFrom),
        validUntil: validateDate('validUntil', validUntil),
        active: Boolean(active),
      }
      db.discountCoupons.push(coupon)

      return { status: 201, data: serializeAdminCoupon(db, coupon) }
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

      if (req.body.couponCode !== undefined) {
        coupon.couponCode = normalizeCode(db, req.body.couponCode, coupon.id)
      }
      if (req.body.discountType !== undefined) {
        coupon.discountType = req.body.discountType
        coupon.discountValue = validateDiscount(
          coupon.discountType,
          req.body.discountValue ?? coupon.discountValue,
        )
      } else if (req.body.discountValue !== undefined) {
        coupon.discountValue = validateDiscount(
          coupon.discountType,
          req.body.discountValue,
        )
      }
      if (req.body.maxDiscount !== undefined) {
        coupon.maxDiscount =
          req.body.maxDiscount === null ? null : Number(req.body.maxDiscount)
      }
      if (req.body.pointsCost !== undefined) {
        coupon.pointsCost = validatePointsCost(req.body.pointsCost)
      }
      if (req.body.validFrom !== undefined) {
        coupon.validFrom = validateDate('validFrom', req.body.validFrom)
      }
      if (req.body.validUntil !== undefined) {
        coupon.validUntil = validateDate('validUntil', req.body.validUntil)
      }
      if (req.body.active !== undefined) {
        coupon.active = Boolean(req.body.active)
      }

      return { status: 200, data: serializeAdminCoupon(db, coupon) }
    })
  },
  { auth: 'admin' },
)
