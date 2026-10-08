import { round2 } from '@utils/money.js'

/*
  Reglas del cupón en un solo lugar: qué tipos existen, cómo se normaliza el código, cuándo
  sirve un cupón, cuánto descuenta y qué tiene que cumplir una plantilla. Las usan la pantalla
  del panel, el checkout y el mock que hace de endpoint, así no hay una copia por lado.
  Lo que falla se devuelve como código: el texto lo pone la UI.
*/

export const DISCOUNT_TYPES = ['Fixed', 'Percentage']
export const PERCENTAGE_MAX = 100

// El código se guarda y se busca normalizado, así el mismo cupón se encuentra escrito como sea.
export function normalizeCouponCode(code) {
  return String(code ?? '')
    .trim()
    .toUpperCase()
}

// Motivo por el que el cupón no sirve para este usuario, o null si sirve.
export function couponProblem(coupon, { userId, now = new Date() } = {}) {
  if (!coupon.active) return 'inactive'
  if (new Date(coupon.validFrom) > now) return 'notStarted'
  if (new Date(coupon.validUntil) < now) return 'expired'
  // Los cupones canjeados por puntos tienen dueño; los de campaña no.
  if (coupon.userId != null && coupon.userId !== userId) return 'notOwner'
  // Sin `maxUses` el cupón no tiene tope de usos.
  if (coupon.maxUses != null && (coupon.usageCount ?? 0) >= coupon.maxUses)
    return 'usedUp'
  return null
}

/*
  Descuento sobre el subtotal: `Percentage` es un porcentaje del subtotal y `Fixed` un monto.
  El tope recorta a los dos y nunca se descuenta más que el subtotal.
*/
export function computeDiscount(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0

  const raw =
    coupon.discountType === 'Fixed'
      ? coupon.discountValue
      : (coupon.discountValue * subtotal) / 100
  const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw

  return round2(Math.min(capped, subtotal))
}

/*
  El monto que la plantilla descuenta sobre un subtotal donde el tope entra entero. Los
  porcentuales dependen del subtotal, así que devuelve null.
*/
export function fixedDiscountAmount(coupon) {
  if (coupon.discountType !== 'Fixed') return null
  return coupon.maxDiscount != null
    ? Math.min(coupon.discountValue, coupon.maxDiscount)
    : coupon.discountValue
}

function isMissing(value) {
  return value === null || value === undefined || value === ''
}

// Un campo numérico opcional vacío es "sin valor", no cero: vaciar el tope no lo lleva a 0.
export function optionalNumber(value) {
  return isMissing(value) ? null : Number(value)
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/*
  La API recibe el día sin hora ni zona, y el endpoint lo resuelve contra UTC 0: el "desde"
  arranca ese día y el "hasta" lo termina entero, así el último día elegido cuenta completo.
  Un valor que ya trae hora se respeta tal cual.
*/
export function startOfCouponDay(value) {
  const text = String(value ?? '')
  return DATE_ONLY.test(text) ? `${text}T00:00:00.000Z` : new Date(text).toISOString()
}

export function endOfCouponDay(value) {
  const text = String(value ?? '')
  return DATE_ONLY.test(text) ? `${text}T23:59:59.999Z` : new Date(text).toISOString()
}

function timeOf(value) {
  const time = new Date(String(value)).getTime()
  return Number.isNaN(time) ? null : time
}

// El día del cupón es el día UTC: la API no maneja zonas.
function utcDayOf(value) {
  const time = timeOf(value)
  return time === null ? null : new Date(time).toISOString().slice(0, 10)
}

/*
  Errores de una plantilla, por campo: `{}` si está bien. Son los mismos campos que rechaza el
  endpoint, para que el formulario no tenga que esperar el viaje de ida y vuelta.
*/
export function couponDraftErrors(draft, { takenCodes = [] } = {}) {
  const errors = {}

  const code = normalizeCouponCode(draft.couponCode)
  if (!code) {
    errors.couponCode = 'required'
  } else if (takenCodes.map(normalizeCouponCode).includes(code)) {
    errors.couponCode = 'duplicateCode'
  }

  const value = Number(draft.discountValue)
  if (!DISCOUNT_TYPES.includes(draft.discountType)) {
    errors.discountType = 'invalid'
  } else if (!Number.isFinite(value) || value <= 0) {
    errors.discountValue = 'notPositive'
  } else if (draft.discountType === 'Percentage' && value > PERCENTAGE_MAX) {
    errors.discountValue = 'percentageTooHigh'
  }

  if (!isMissing(draft.maxDiscount) && !Number.isFinite(Number(draft.maxDiscount))) {
    errors.maxDiscount = 'invalid'
  }

  if (!isMissing(draft.pointsCost)) {
    const points = Number(draft.pointsCost)
    if (!Number.isInteger(points)) {
      errors.pointsCost = 'invalid'
    } else if (points <= 0) {
      errors.pointsCost = 'notPositive'
    }
  }

  // La base exige `max_uses > 0`; vacío es un cupón sin tope de usos.
  if (!isMissing(draft.maxUses)) {
    const uses = Number(draft.maxUses)
    if (!Number.isInteger(uses)) {
      errors.maxUses = 'invalid'
    } else if (uses <= 0) {
      errors.maxUses = 'notPositive'
    }
  }

  const from = utcDayOf(draft.validFrom)
  const until = utcDayOf(draft.validUntil)
  if (from === null) errors.validFrom = 'required'
  if (until === null) errors.validUntil = 'required'
  /*
    El "hasta" cierra su día entero, así que el mismo día es un cupón de un día y la base
    (`valid_until > valid_from`) se cumple igual.
  */
  if (from !== null && until !== null && until < from) errors.validUntil = 'dateOrder'

  return errors
}
