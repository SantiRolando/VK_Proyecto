// Reglas derivadas de POINTS_MOVEMENT y DISCOUNT_COUPON (§5.3 del plan,
// FR-017/FR-018/FR-019). Vive en el mock: el FE solo muestra el resultado.
//
// Feedback: una sola vez por generación. Si el cliente está autenticado, no
// agotó el tope diario y el sorteo acierta → suma puntos. El azar se inyecta
// (`random`) para poder testear sin depender de `Math.random`.
//
// Canje: requiere `pointsBalance >= pointsCost`; crea una copia del cupón
// plantilla con dueño y código único, y registra el movimiento negativo.

import { ApiError } from '@api/client/api-error.js'
import { settingNumber } from '@mocks/domain/settings.js'

export const FEEDBACK_RATINGS = ['Small', 'Correct', 'Large']

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id ?? 0), 0) + 1
}

function sameDay(a, b) {
  const left = new Date(a)
  const right = new Date(b)
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

// Feedback que *otorgó* puntos hoy: el tope diario cuenta premios, no
// calificaciones (un feedback sin puntos no consume cupo — §2.5).
export function feedbackAwardsToday(db, userId, now = new Date()) {
  return db.pointsMovements.filter(
    (movement) =>
      movement.userId === userId &&
      movement.type === 'Feedback' &&
      movement.points > 0 &&
      sameDay(movement.createdAt, now),
  ).length
}

export function dailyLimitReached(db, userId, now = new Date()) {
  const limit = settingNumber(db.settings, 'max_daily_feedback', 5)
  return feedbackAwardsToday(db, userId, now) >= limit
}

// Otorga (o no) puntos por un feedback ya validado. Muta al usuario y los
// movimientos; devuelve el `reward` que consume el FE.
export function grantFeedbackReward(
  db,
  { user, generationId, now = new Date(), random = Math.random },
) {
  const base = {
    awarded: false,
    points: 0,
    balance: user.pointsBalance,
    dailyLimitReached: false,
  }

  if (dailyLimitReached(db, user.id, now)) {
    return { ...base, dailyLimitReached: true }
  }

  const probability = settingNumber(db.settings, 'success_probability', 0)
  if (random() * 100 >= probability) return base

  const points = settingNumber(db.settings, 'points_per_feedback', 0)
  if (points <= 0) return base

  user.pointsBalance += points
  db.pointsMovements.push({
    id: nextId(db.pointsMovements),
    userId: user.id,
    generationId,
    couponId: null,
    points,
    type: 'Feedback',
    createdAt: now.toISOString(),
  })

  return { awarded: true, points, balance: user.pointsBalance, dailyLimitReached: false }
}

// Plantillas canjeables: activas, con costo en puntos y dentro de vigencia.
export function redeemableTemplates(db, now = new Date()) {
  return db.discountCoupons.filter(
    (coupon) =>
      coupon.active &&
      coupon.pointsCost != null &&
      new Date(coupon.validFrom) <= now &&
      new Date(coupon.validUntil) >= now,
  )
}

function uniqueCouponCode(db, base) {
  let attempt = db.discountCoupons.length + 1
  let code = ''
  do {
    code = `${base}-${attempt.toString(36).toUpperCase()}`
    attempt += 1
  } while (db.discountCoupons.some((coupon) => coupon.couponCode.toUpperCase() === code))
  return code
}

// Canjea una plantilla por una copia propia. Lanza 422 si no alcanzan los
// puntos (caso borde del plan §2.5).
export function redeemTemplate(db, { user, template, now = new Date() }) {
  const cost = Number(template.pointsCost ?? 0)
  if (user.pointsBalance < cost) {
    throw new ApiError(422, 'POINTS_INSUFFICIENT', {
      required: cost,
      balance: user.pointsBalance,
    })
  }

  user.pointsBalance -= cost

  const coupon = {
    id: nextId(db.discountCoupons),
    productId: template.productId ?? null,
    userId: user.id,
    couponCode: uniqueCouponCode(db, template.couponCode),
    usageCount: 0,
    discountType: template.discountType,
    discountValue: template.discountValue,
    maxDiscount: template.maxDiscount ?? null,
    pointsCost: null,
    validFrom: now.toISOString(),
    validUntil: template.validUntil,
    active: true,
  }
  db.discountCoupons.push(coupon)

  db.pointsMovements.push({
    id: nextId(db.pointsMovements),
    userId: user.id,
    generationId: null,
    couponId: coupon.id,
    points: -cost,
    type: 'Redemption',
    createdAt: now.toISOString(),
  })

  return { coupon, balance: user.pointsBalance, cost }
}
