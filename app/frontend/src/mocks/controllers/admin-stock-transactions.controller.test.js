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

// Endurance talle M no tiene stock en ningún color en la seed, y Ana está
// suscripta al aviso de reposición de la variante navy.
function enduranceMSize() {
  return getDb().sizes.find((item) => item.line === 'Endurance' && item.code === 'M')
}

function navyVariant() {
  const size = enduranceMSize()
  return getDb().productVariants.find(
    (variant) => variant.sizeId === size.id && variant.color === 'navy',
  )
}

describe('POST /admin/stock-transactions', () => {
  it('un ingreso sube el físico, deja el movimiento auditable y el catálogo lo refleja', async () => {
    const variant = navyVariant()
    expect(variant.quantity).toBe(0)

    const result = await call('POST', '/admin/stock-transactions', {
      auth: ADMIN,
      body: { reason: 'GoodsReceipt', lines: [{ variantId: variant.id, quantity: 4 }] },
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({ direction: 'Inbound', reason: 'GoodsReceipt' })
    expect(result.data.user.name).toBe('Vikinga Admin')
    expect(result.data.lines[0]).toMatchObject({ variantId: variant.id, quantity: 4 })
    expect(getDb().productVariants.find((item) => item.id === variant.id).quantity).toBe(
      4,
    )

    // El catálogo del cliente ya ofrece el talle M de Endurance.
    const catalog = await call('GET', '/catalog', {
      query: { sizeId: enduranceMSize().id },
    })
    expect(catalog.meta.hasStock).toBe(true)
    const product = catalog.data.find((item) => item.model === 'endurance-classic')
    expect(product.variants.find((item) => item.color === 'navy').available).toBe(4)

    // El aviso de reposición de Ana pasó a notificado.
    const alert = getDb().alerts.find(
      (item) =>
        item.variantId === variant.id &&
        item.alertType === 'RestockNotice' &&
        item.userId === 2,
    )
    expect(alert.status).toBe('Notified')
  })

  it('una pérdida descuenta el físico y no permite pasar de 0', async () => {
    const variant = getDb().productVariants.find((item) => item.quantity >= 3)
    const before = variant.quantity

    await call('POST', '/admin/stock-transactions', {
      auth: ADMIN,
      body: { reason: 'LossDefective', lines: [{ variantId: variant.id, quantity: 2 }] },
    })
    expect(getDb().productVariants.find((item) => item.id === variant.id).quantity).toBe(
      before - 2,
    )

    await expect(
      call('POST', '/admin/stock-transactions', {
        auth: ADMIN,
        body: {
          reason: 'LossDefective',
          lines: [{ variantId: variant.id, quantity: 999 }],
        },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('exige un motivo manual válido y una dirección para los motivos libres', async () => {
    const variant = getDb().productVariants[0]

    await expect(
      call('POST', '/admin/stock-transactions', {
        auth: ADMIN,
        body: {
          reason: 'SaleConfirmed',
          lines: [{ variantId: variant.id, quantity: 1 }],
        },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    // `ManualAdjustment` no tiene dirección fija: hay que enviarla.
    await expect(
      call('POST', '/admin/stock-transactions', {
        auth: ADMIN,
        body: {
          reason: 'ManualAdjustment',
          lines: [{ variantId: variant.id, quantity: 1 }],
        },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })
})

describe('GET /admin/stock-transactions', () => {
  it('devuelve la auditoría con filtros por motivo y variante', async () => {
    const variant = getDb().productVariants[0]
    await call('POST', '/admin/stock-transactions', {
      auth: ADMIN,
      body: { reason: 'GoodsReceipt', lines: [{ variantId: variant.id, quantity: 2 }] },
    })

    const all = await call('GET', '/admin/stock-transactions', { auth: ADMIN })
    // 4 movimientos sembrados + el recién creado.
    expect(all.meta.total).toBe(5)

    const receipts = await call('GET', '/admin/stock-transactions', {
      auth: ADMIN,
      query: { reason: 'GoodsReceipt' },
    })
    expect(receipts.data.every((item) => item.reason === 'GoodsReceipt')).toBe(true)

    const byVariant = await call('GET', '/admin/stock-transactions', {
      auth: ADMIN,
      query: { variantId: variant.id },
    })
    expect(byVariant.data).toHaveLength(1)
    expect(byVariant.data[0].lines[0].variantId).toBe(variant.id)
  })
})
