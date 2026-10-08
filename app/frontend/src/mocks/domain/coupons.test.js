import { findCouponByCode, saleDiscount } from '@mocks/domain/coupons.js'
import { describe, expect, it } from 'vitest'

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
