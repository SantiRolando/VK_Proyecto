import {
  computeDiscount,
  couponDraftErrors,
  couponProblem,
  endOfCouponDay,
  fixedDiscountAmount,
  normalizeCouponCode,
  optionalNumber,
  startOfCouponDay,
} from '@features/admin/coupons/coupon-rules.js'
import { describe, expect, it } from 'vitest'

const NOW = new Date('2026-09-24T12:00:00Z')

function coupon(overrides = {}) {
  return {
    id: 1,
    productId: null,
    userId: null,
    couponCode: 'VIKI10',
    usageCount: 0,
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscount: 500,
    pointsCost: null,
    validFrom: '2026-09-01T00:00:00Z',
    validUntil: '2026-10-01T00:00:00Z',
    active: true,
    ...overrides,
  }
}

function draft(overrides = {}) {
  return {
    couponCode: 'NUEVO10',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscount: null,
    pointsCost: null,
    validFrom: '2026-09-01',
    validUntil: '2026-12-31',
    active: true,
    ...overrides,
  }
}

describe('normalizeCouponCode', () => {
  it('recorta y pasa a mayúsculas', () => {
    expect(normalizeCouponCode(' viki10 ')).toBe('VIKI10')
    expect(normalizeCouponCode(null)).toBe('')
  })
})

describe('optionalNumber', () => {
  it('un campo vacío es sin valor, no cero', () => {
    expect(optionalNumber('')).toBeNull()
    expect(optionalNumber(null)).toBeNull()
    expect(optionalNumber(undefined)).toBeNull()
    expect(optionalNumber('20')).toBe(20)
  })
})

describe('couponProblem', () => {
  it('no hay problema con un cupón vigente de campaña', () => {
    expect(couponProblem(coupon(), { userId: 2, now: NOW })).toBeNull()
  })

  it('detecta inactivo, vencido y no empezado', () => {
    expect(couponProblem(coupon({ active: false }), { userId: 2, now: NOW })).toBe(
      'inactive',
    )
    expect(
      couponProblem(coupon({ validUntil: '2026-09-01T00:00:00Z' }), {
        userId: 2,
        now: NOW,
      }),
    ).toBe('expired')
    expect(
      couponProblem(coupon({ validFrom: '2026-10-01T00:00:00Z' }), {
        userId: 2,
        now: NOW,
      }),
    ).toBe('notStarted')
  })

  it('un cupón con dueño solo sirve para su dueño', () => {
    expect(couponProblem(coupon({ userId: 2 }), { userId: 3, now: NOW })).toBe('notOwner')
    expect(couponProblem(coupon({ userId: 2 }), { userId: 2, now: NOW })).toBeNull()
  })

  it('un cupón con tope de usos deja de servir cuando lo alcanza', () => {
    const conTope = coupon({ maxUses: 3, usageCount: 2 })
    expect(couponProblem(conTope, { userId: 2, now: NOW })).toBeNull()
    expect(couponProblem({ ...conTope, usageCount: 3 }, { userId: 2, now: NOW })).toBe(
      'usedUp',
    )
    // Sin tope, los usos no tienen límite.
    expect(couponProblem(coupon({ usageCount: 99 }), { userId: 2, now: NOW })).toBeNull()
  })
})

describe('computeDiscount', () => {
  it('porcentaje sobre el subtotal', () => {
    expect(computeDiscount(coupon(), 2000)).toBe(200)
  })

  it('porcentaje con tope en maxDiscount', () => {
    expect(computeDiscount(coupon(), 20000)).toBe(500)
  })

  it('porcentaje sin tope definido', () => {
    expect(computeDiscount(coupon({ maxDiscount: null }), 20000)).toBe(2000)
  })

  it('monto fijo, nunca mayor al subtotal', () => {
    const fixed = coupon({ discountType: 'Fixed', discountValue: 500 })
    expect(computeDiscount(fixed, 2000)).toBe(500)
    expect(computeDiscount(fixed, 300)).toBe(300)
  })

  it('el tope recorta también a los de monto fijo', () => {
    const fixed = coupon({ discountType: 'Fixed', discountValue: 5000, maxDiscount: 100 })
    expect(computeDiscount(fixed, 2000)).toBe(100)
  })

  it('sin cupón o sin subtotal el descuento es 0', () => {
    expect(computeDiscount(null, 2000)).toBe(0)
    expect(computeDiscount(coupon(), 0)).toBe(0)
  })
})

describe('fixedDiscountAmount', () => {
  it('aplica el tope, que es lo que el cupón concede de verdad', () => {
    const fixed = coupon({ discountType: 'Fixed', discountValue: 5000, maxDiscount: 100 })
    expect(fixedDiscountAmount(fixed)).toBe(100)
  })

  it('sin tope devuelve el monto declarado', () => {
    const fixed = coupon({ discountType: 'Fixed', discountValue: 500, maxDiscount: null })
    expect(fixedDiscountAmount(fixed)).toBe(500)
  })

  it('en los porcentuales el monto depende del subtotal', () => {
    expect(fixedDiscountAmount(coupon())).toBeNull()
  })
})

describe('couponDraftErrors', () => {
  it('una plantilla completa no tiene errores', () => {
    expect(couponDraftErrors(draft())).toEqual({})
  })

  it('pide el código y rechaza uno repetido sin distinguir mayúsculas', () => {
    expect(couponDraftErrors(draft({ couponCode: '  ' }))).toMatchObject({
      couponCode: 'required',
    })
    expect(
      couponDraftErrors(draft({ couponCode: ' viki10 ' }), { takenCodes: ['VIKI10'] }),
    ).toMatchObject({ couponCode: 'duplicateCode' })
  })

  it('el descuento tiene que ser positivo y el porcentaje no pasa de 100', () => {
    expect(couponDraftErrors(draft({ discountValue: 0 }))).toMatchObject({
      discountValue: 'notPositive',
    })
    expect(couponDraftErrors(draft({ discountValue: 150 }))).toMatchObject({
      discountValue: 'percentageTooHigh',
    })
    // El tope de 100 es del porcentaje: un monto fijo puede ser mayor.
    expect(
      couponDraftErrors(draft({ discountType: 'Fixed', discountValue: 5000 })),
    ).toEqual({})
  })

  it('rechaza un tipo de descuento que no existe', () => {
    expect(couponDraftErrors(draft({ discountType: 'Magic' }))).toMatchObject({
      discountType: 'invalid',
    })
  })

  it('el tope y el costo en puntos se validan como números', () => {
    expect(couponDraftErrors(draft({ maxDiscount: 'abc' }))).toMatchObject({
      maxDiscount: 'invalid',
    })
    expect(couponDraftErrors(draft({ pointsCost: 2.5 }))).toMatchObject({
      pointsCost: 'invalid',
    })
    // La base exige `points_cost > 0`.
    expect(couponDraftErrors(draft({ pointsCost: 0 }))).toMatchObject({
      pointsCost: 'notPositive',
    })
  })

  it('las fechas son obligatorias y el fin no puede ir antes del inicio', () => {
    expect(couponDraftErrors(draft({ validFrom: null }))).toMatchObject({
      validFrom: 'required',
    })
    expect(couponDraftErrors(draft({ validUntil: null }))).toMatchObject({
      validUntil: 'required',
    })
    expect(
      couponDraftErrors(draft({ validFrom: '2026-12-31', validUntil: '2026-09-01' })),
    ).toMatchObject({ validUntil: 'dateOrder' })
    // El "hasta" cierra su día entero: el mismo día es un cupón de un día.
    expect(
      couponDraftErrors(draft({ validFrom: '2026-09-01', validUntil: '2026-09-01' })),
    ).toEqual({})
  })

  it('el tope de usos es un entero mayor que cero', () => {
    expect(couponDraftErrors(draft({ maxUses: 5 }))).toEqual({})
    // Vacío es un cupón sin tope de usos.
    expect(couponDraftErrors(draft({ maxUses: null }))).toEqual({})
    expect(couponDraftErrors(draft({ maxUses: 2.5 }))).toMatchObject({
      maxUses: 'invalid',
    })
    expect(couponDraftErrors(draft({ maxUses: 0 }))).toMatchObject({
      maxUses: 'notPositive',
    })
  })
})

describe('startOfCouponDay y endOfCouponDay', () => {
  it('el "desde" arranca su día y el "hasta" lo termina, en UTC', () => {
    expect(startOfCouponDay('2026-10-08')).toBe('2026-10-08T00:00:00.000Z')
    expect(endOfCouponDay('2026-10-08')).toBe('2026-10-08T23:59:59.999Z')
  })

  it('un valor que ya trae hora se respeta', () => {
    const instante = '2026-10-08T14:30:00.000Z'
    expect(startOfCouponDay(instante)).toBe(instante)
    expect(endOfCouponDay(instante)).toBe(instante)
  })

  it('el último día elegido queda cubierto entero', () => {
    const hasta = endOfCouponDay('2026-10-08')
    const coupon = {
      active: true,
      validFrom: startOfCouponDay('2026-10-01'),
      validUntil: hasta,
    }

    expect(couponProblem(coupon, { now: new Date('2026-10-08T23:00:00Z') })).toBeNull()
    expect(couponProblem(coupon, { now: new Date('2026-10-09T00:00:01Z') })).toBe(
      'expired',
    )
  })
})
