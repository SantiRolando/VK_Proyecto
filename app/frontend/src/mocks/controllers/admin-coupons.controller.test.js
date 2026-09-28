import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body, auth, query } = {}) {
  return handle({
    method,
    url,
    query: query ?? {},
    body: body ?? {},
    auth,
    guestSessionId: null,
  })
}

const ADMIN = { token: 'vkfit.1.test' }
const ANA = { token: 'vkfit.2.test' }

describe('GET /admin/coupons', () => {
  it('lista plantillas y cupones con dueño y si son canjeables', async () => {
    const result = await call('GET', '/admin/coupons', { auth: ADMIN })

    expect(result.data.length).toBe(getDb().discountCoupons.length)

    const viki = result.data.find((coupon) => coupon.code === 'VIKI10')
    expect(viki).toMatchObject({ pointsCost: 100, redeemable: true, owner: null })

    // VIP5000 está inactivo y ANA15 es de Ana.
    expect(result.data.find((coupon) => coupon.code === 'VIP5000').redeemable).toBe(false)
    expect(result.data.find((coupon) => coupon.code === 'ANA15').owner).toEqual({
      id: 2,
      name: 'Ana Rodríguez',
    })
  })
})

describe('POST /admin/coupons', () => {
  it('crea una plantilla canjeable', async () => {
    const result = await call('POST', '/admin/coupons', {
      auth: ADMIN,
      body: {
        couponCode: ' ola10 ',
        discountType: 'Percentage',
        discountValue: 10,
        maxDiscount: 300,
        pointsCost: 50,
        validFrom: '2026-09-01',
        validUntil: '2026-12-31',
      },
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      code: 'OLA10',
      pointsCost: 50,
      redeemable: true,
      usageCount: 0,
    })
  })

  it('valida código repetido, descuento y tipos', async () => {
    await expect(
      call('POST', '/admin/coupons', {
        auth: ADMIN,
        body: {
          couponCode: 'VIKI10',
          discountType: 'Percentage',
          discountValue: 10,
          validFrom: '2026-09-01',
          validUntil: '2026-12-31',
        },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('POST', '/admin/coupons', {
        auth: ADMIN,
        body: {
          couponCode: 'NUEVO',
          discountType: 'Percentage',
          discountValue: 150,
          validFrom: '2026-09-01',
          validUntil: '2026-12-31',
        },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('POST', '/admin/coupons', {
        auth: ADMIN,
        body: { couponCode: 'X', discountType: 'Magic', discountValue: 1 },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })
})

describe('PATCH /admin/coupons/:id', () => {
  it('editar el costo de canje se refleja en el cliente', async () => {
    const before = await call('GET', '/rewards', { auth: ANA })
    expect(before.data.find((item) => item.code === 'ENVIO5').pointsCost).toBe(60)

    const updated = await call('PATCH', '/admin/coupons/2', {
      auth: ADMIN,
      body: { pointsCost: 20 },
    })
    expect(updated.data).toMatchObject({ code: 'ENVIO5', pointsCost: 20 })

    // El cliente ve el nuevo costo (y ahora le alcanzan sus 120 puntos).
    const after = await call('GET', '/rewards', { auth: ANA })
    expect(after.data.find((item) => item.code === 'ENVIO5').pointsCost).toBe(20)

    const redeem = await call('POST', '/rewards/2/redeem', { auth: ANA })
    expect(redeem.data.balance).toBe(100)
  })

  it('puede sacar un cupón de circulación', async () => {
    const updated = await call('PATCH', '/admin/coupons/1', {
      auth: ADMIN,
      body: { active: false },
    })
    expect(updated.data).toMatchObject({ active: false, redeemable: false })

    const rewards = await call('GET', '/rewards', { auth: ANA })
    expect(rewards.data.map((item) => item.code)).not.toContain('VIKI10')
  })

  it('404 si el cupón no existe', async () => {
    await expect(
      call('PATCH', '/admin/coupons/999', { auth: ADMIN, body: { active: false } }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
