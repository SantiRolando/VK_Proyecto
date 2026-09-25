import { describe, expect, it } from 'vitest'
import {
  computeDiscount,
  couponProblem,
  findCouponByCode,
  saleDiscount,
} from './coupons.js'

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

describe('findCouponByCode', () => {
  const db = { discountCoupons: [coupon()] }

  it('busca sin distinguir mayúsculas ni espacios', () => {
    expect(findCouponByCode(db, ' viki10 ')?.id).toBe(1)
  })

  it('devuelve null con un código vacío o inexistente', () => {
    expect(findCouponByCode(db, '')).toBeNull()
    expect(findCouponByCode(db, 'NOPE')).toBeNull()
  })
})

describe('couponProblem', () => {
  it('no hay problema con un cupón vigente de campaña', () => {
    expect(couponProblem(coupon(), { userId: 2, now: NOW })).toBeNull()
  })

  it('detecta inactivo, vencido y no empezado', () => {
    expect(couponProblem(coupon({ active: false }), { userId: 2, now: NOW })).toBe('inactive')
    expect(couponProblem(coupon({ validUntil: '2026-09-01T00:00:00Z' }), { userId: 2, now: NOW })).toBe('expired')
    expect(couponProblem(coupon({ validFrom: '2026-10-01T00:00:00Z' }), { userId: 2, now: NOW })).toBe('notStarted')
  })

  it('un cupón con dueño solo sirve para su dueño', () => {
    expect(couponProblem(coupon({ userId: 2 }), { userId: 3, now: NOW })).toBe('notOwner')
    expect(couponProblem(coupon({ userId: 2 }), { userId: 2, now: NOW })).toBeNull()
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

  it('sin cupón o sin subtotal el descuento es 0', () => {
    expect(computeDiscount(null, 2000)).toBe(0)
    expect(computeDiscount(coupon(), 0)).toBe(0)
  })
})

describe('saleDiscount', () => {
  it('usa el snapshot de la venta cuando existe', () => {
    const db = { discountCoupons: [coupon()] }
    const sale = { couponId: 1, discountAmount: 42 }
    expect(saleDiscount(db, sale, 2000)).toBe(42)
  })

  it('deriva el descuento del cupón en las ventas sembradas', () => {
    const db = { discountCoupons: [coupon()] }
    const sale = { couponId: 1 }
    expect(saleDiscount(db, sale, 2000)).toBe(200)
  })

  it('sin cupón el descuento es 0', () => {
    expect(saleDiscount({ discountCoupons: [] }, { couponId: null }, 2000)).toBe(0)
  })
})
