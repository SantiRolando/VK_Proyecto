import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body, auth } = {}) {
  return handle({ method, url, query: {}, body: body ?? {}, auth, guestSessionId: null })
}

const ANA = { token: 'vkfit.2.test' }

describe('GET /me/points', () => {
  it('devuelve el saldo y los movimientos ordenados por fecha', async () => {
    const result = await call('GET', '/me/points', { auth: ANA })

    expect(result.data.balance).toBe(120)
    const types = result.data.movements.map((movement) => movement.type)
    expect(types).toContain('Adjustment')
    expect(types).toContain('Feedback')

    const dates = result.data.movements.map((movement) =>
      new Date(movement.createdAt).getTime(),
    )
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('requiere sesión', async () => {
    await expect(call('GET', '/me/points')).rejects.toMatchObject({ status: 401 })
  })
})

describe('GET /rewards', () => {
  it('lista solo las plantillas canjeables', async () => {
    const result = await call('GET', '/rewards', { auth: ANA })

    expect(result.data.map((template) => template.code)).toEqual(['VIKI10', 'ENVIO5'])
    expect(result.data[0]).toMatchObject({
      discountType: 'Percentage',
      discountValue: 10,
      maxDiscount: 500,
      pointsCost: 100,
    })
  })
})

describe('GET /me/coupons', () => {
  it('devuelve los cupones propios vigentes', async () => {
    const result = await call('GET', '/me/coupons', { auth: ANA })

    expect(result.data.map((coupon) => coupon.code)).toEqual(['ANA15'])
  })
})

describe('POST /rewards/:couponId/redeem', () => {
  it('canjea la plantilla: crea el cupón propio y descuenta los puntos', async () => {
    const result = await call('POST', '/rewards/2/redeem', { auth: ANA })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({ balance: 60, cost: 60 })
    expect(result.data.coupon).toMatchObject({
      discountType: 'Fixed',
      discountValue: 500,
      usageCount: 0,
    })
    expect(result.data.coupon.code).toMatch(/^ENVIO5-/)
    expect(result.data.movement).toMatchObject({
      points: -60,
      type: 'Redemption',
      couponId: result.data.coupon.id,
    })

    expect(getDb().users.find((user) => user.id === 2).pointsBalance).toBe(60)

    // El cupón aparece en "mis cupones" y sigue siendo válido.
    const mine = await call('GET', '/me/coupons', { auth: ANA })
    expect(mine.data.map((coupon) => coupon.code)).toContain(result.data.coupon.code)
  })

  it('rechaza el canje sin puntos suficientes', async () => {
    await call('POST', '/rewards/1/redeem', { auth: ANA }) // 120 - 100 = 20

    await expect(call('POST', '/rewards/2/redeem', { auth: ANA })).rejects.toMatchObject({
      status: 422,
      code: 'POINTS_INSUFFICIENT',
    })
  })

  it('404 cuando la plantilla no existe o no es canjeable', async () => {
    // La 3 (ANA15) es un cupón asignado, no una plantilla canjeable.
    await expect(call('POST', '/rewards/3/redeem', { auth: ANA })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
    await expect(
      call('POST', '/rewards/999/redeem', { auth: ANA }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  it('el cupón canjeado se puede aplicar en el checkout', async () => {
    const { data } = await call('POST', '/rewards/2/redeem', { auth: ANA })
    const variant = getDb().productVariants.find((item) => item.active)

    const validation = await call('POST', '/coupons/validate', {
      body: { code: data.coupon.code, items: [{ variantId: variant.id, quantity: 1 }] },
      auth: ANA,
    })

    expect(validation.data).toMatchObject({ valid: true, code: data.coupon.code })
    expect(validation.data.discount).toBeGreaterThan(0)
  })
})
