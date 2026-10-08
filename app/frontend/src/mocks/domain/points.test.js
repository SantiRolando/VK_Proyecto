import {
  dailyLimitReached,
  feedbackAwardsToday,
  grantFeedbackReward,
  redeemableTemplates,
  redeemTemplate,
} from '@mocks/domain/points.js'
import { describe, expect, it } from 'vitest'

const NOW = new Date('2026-09-24T12:00:00Z')

function settings(overrides = {}) {
  const values = {
    success_probability: '30',
    points_per_feedback: '10',
    max_daily_feedback: '5',
    ...overrides,
  }
  return Object.entries(values).map(([key, value]) => ({ key, value }))
}

function movement(overrides = {}) {
  return {
    id: 1,
    userId: 2,
    generationId: 100,
    couponId: null,
    points: 10,
    type: 'Feedback',
    createdAt: NOW.toISOString(),
    ...overrides,
  }
}

function db(overrides = {}) {
  return {
    settings: settings(),
    pointsMovements: [],
    discountCoupons: [],
    ...overrides,
  }
}

const user = (overrides = {}) => ({ id: 2, pointsBalance: 40, ...overrides })

describe('tope diario de feedback', () => {
  it('cuenta solo los premios del día', () => {
    const state = db({
      pointsMovements: [
        movement({ id: 1, createdAt: NOW.toISOString() }),
        movement({ id: 2, createdAt: '2026-09-23T12:00:00Z' }), // ayer
        movement({ id: 3, points: -10, type: 'Redemption' }), // canje
        movement({ id: 4, points: 0, generationId: 99 }), // sin puntos
        movement({ id: 5, userId: 3 }), // otro usuario
      ],
    })

    expect(feedbackAwardsToday(state, 2, NOW)).toBe(1)
    expect(dailyLimitReached(state, 2, NOW)).toBe(false)
  })

  it('marca el tope al alcanzar `max_daily_feedback`', () => {
    const state = db({
      settings: settings({ max_daily_feedback: '2' }),
      pointsMovements: [
        movement({ id: 1, createdAt: NOW.toISOString() }),
        movement({ id: 2, createdAt: NOW.toISOString() }),
      ],
    })

    expect(dailyLimitReached(state, 2, NOW)).toBe(true)
  })
})

describe('grantFeedbackReward', () => {
  it('no otorga puntos si el tope diario está agotado', () => {
    const state = db({
      settings: settings({ max_daily_feedback: '2' }),
      pointsMovements: [movement(), movement({ id: 2 })],
    })
    const ana = user()

    const reward = grantFeedbackReward(state, {
      user: ana,
      generationId: 200,
      now: NOW,
      random: () => 0,
    })

    expect(reward).toEqual({
      awarded: false,
      points: 0,
      balance: 40,
      dailyLimitReached: true,
    })
    expect(ana.pointsBalance).toBe(40)
    expect(state.pointsMovements).toHaveLength(2)
  })

  it('no otorga puntos cuando el sorteo falla', () => {
    const state = db()
    const ana = user()

    // 30 % de probabilidad: 0.5 → 50 no acierta.
    const reward = grantFeedbackReward(state, {
      user: ana,
      generationId: 200,
      now: NOW,
      random: () => 0.5,
    })

    expect(reward).toMatchObject({ awarded: false, points: 0, dailyLimitReached: false })
    expect(state.pointsMovements).toHaveLength(0)
  })

  it('otorga puntos cuando el sorteo acierta y registra el movimiento', () => {
    const state = db()
    const ana = user()

    const reward = grantFeedbackReward(state, {
      user: ana,
      generationId: 200,
      now: NOW,
      random: () => 0.1,
    })

    expect(reward).toEqual({
      awarded: true,
      points: 10,
      balance: 50,
      dailyLimitReached: false,
    })
    expect(ana.pointsBalance).toBe(50)
    expect(state.pointsMovements[0]).toMatchObject({
      userId: 2,
      generationId: 200,
      points: 10,
      type: 'Feedback',
      createdAt: NOW.toISOString(),
    })
  })
})

describe('canje de cupones', () => {
  const template = {
    id: 1,
    productId: null,
    userId: null,
    couponCode: 'VIKI10',
    usageCount: 12,
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscount: 500,
    pointsCost: 100,
    validFrom: '2026-09-01T00:00:00Z',
    validUntil: '2026-10-01T00:00:00Z',
    active: true,
  }

  it('lista solo plantillas activas, con costo y vigentes', () => {
    const state = db({
      discountCoupons: [
        template,
        { ...template, id: 2, active: false },
        { ...template, id: 3, pointsCost: null },
        { ...template, id: 4, validUntil: '2026-09-01T00:00:00Z' },
      ],
    })

    expect(redeemableTemplates(state, NOW).map((coupon) => coupon.id)).toEqual([1])
  })

  it('rechaza el canje cuando no alcanzan los puntos', () => {
    const state = db({ discountCoupons: [template] })

    expect(() =>
      redeemTemplate(state, { user: user(), template, now: NOW }),
    ).toThrowError(expect.objectContaining({ status: 422, code: 'POINTS_INSUFFICIENT' }))
  })

  it('crea una copia propia con código único y descuenta los puntos', () => {
    const state = db({ discountCoupons: [template] })
    const ana = user({ pointsBalance: 120 })

    const { coupon, balance, cost } = redeemTemplate(state, {
      user: ana,
      template,
      now: NOW,
    })

    expect(balance).toBe(20)
    expect(ana.pointsBalance).toBe(20)
    expect(cost).toBe(100)
    expect(coupon).toMatchObject({
      userId: 2,
      couponCode: 'VIKI10-2',
      usageCount: 0,
      // El cupón canjeado se usa una sola vez.
      maxUses: 1,
      discountType: 'Percentage',
      discountValue: 10,
      pointsCost: null,
      active: true,
    })
    // La plantilla no se toca y el movimiento es negativo.
    expect(state.discountCoupons).toHaveLength(2)
    expect(coupon.id).not.toBe(template.id)
    expect(state.pointsMovements[0]).toMatchObject({
      userId: 2,
      couponId: coupon.id,
      points: -100,
      type: 'Redemption',
    })
  })
})
