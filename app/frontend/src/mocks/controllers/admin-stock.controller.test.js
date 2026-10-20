import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body, query, auth } = {}) {
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

// Endurance talle M: sin stock en ningún color en la seed.
function emptyVariant() {
  const db = getDb()
  const size = db.sizes.find((item) => item.line === 'Endurance' && item.code === 'M')
  return db.productVariants.find(
    (variant) => variant.sizeId === size.id && variant.color === 'navy',
  )
}

describe('GET /admin/stock/inventory', () => {
  it('devuelve el envelope del backend con el disponible calculado', async () => {
    const result = await call('GET', '/admin/stock/inventory', {
      auth: ADMIN,
      query: { page: '1', size: '5' },
    })

    expect(result.status).toBe(200)
    expect(result.data).toMatchObject({ page: 1, size: 5 })
    expect(result.data.items).toHaveLength(5)
    expect(result.data.totalElements).toBe(getDb().productVariants.length)

    const [row] = result.data.items
    expect(row).toMatchObject({
      id: expect.any(Number),
      sku: expect.any(String),
      quantity: expect.any(Number),
      reserved: expect.any(Number),
      available: row.quantity - row.reserved,
      minStock: expect.any(Number),
      isCritical: row.available < row.minStock,
      product: { line: expect.any(String), model: expect.any(String) },
      size: { code: expect.any(String) },
    })
  })

  it('con onlyBelowMin deja solo las variantes críticas', async () => {
    const result = await call('GET', '/admin/stock/inventory', {
      auth: ADMIN,
      query: { onlyBelowMin: 'true', size: '100' },
    })

    expect(result.data.items.length).toBeGreaterThan(0)
    expect(result.data.items.every((row) => row.available < row.minStock)).toBe(true)
    expect(result.data.items.some((row) => row.id === emptyVariant().id)).toBe(true)
  })

  it('no expone la ruta vieja de variantes', async () => {
    await expect(call('GET', '/admin/variants', { auth: ADMIN })).rejects.toMatchObject({
      status: 404,
    })
  })
})

describe('POST /admin/stock/transactions', () => {
  it('registra la entrada y deja el movimiento con sus líneas', async () => {
    const variant = emptyVariant()
    const created = await call('POST', '/admin/stock/transactions', {
      auth: ADMIN,
      body: {
        direction: 'INBOUND',
        reason: 'GOODS_RECEIPT',
        note: 'Recepción de mercadería',
        lines: [{ variantId: variant.id, quantity: 4 }],
      },
    })

    expect(created.status).toBe(201)
    expect(created.data).toMatchObject({
      userId: 1,
      saleId: null,
      direction: 'INBOUND',
      reason: 'GOODS_RECEIPT',
      note: 'Recepción de mercadería',
      lines: [{ variantId: variant.id, quantity: 4 }],
    })

    const detail = await call('GET', `/admin/stock/transactions/${created.data.id}`, {
      auth: ADMIN,
    })
    expect(detail.data.lines).toHaveLength(1)
  })

  it('exige la dirección', async () => {
    await expect(
      call('POST', '/admin/stock/transactions', {
        auth: ADMIN,
        body: { reason: 'GOODS_RECEIPT', lines: [{ variantId: 1, quantity: 1 }] },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' })
  })

  it('rechaza la venta confirmada y la variante repetida', async () => {
    await expect(
      call('POST', '/admin/stock/transactions', {
        auth: ADMIN,
        body: {
          direction: 'OUTBOUND',
          reason: 'SALE_CONFIRMED',
          lines: [{ variantId: 1, quantity: 1 }],
        },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' })

    await expect(
      call('POST', '/admin/stock/transactions', {
        auth: ADMIN,
        body: {
          direction: 'INBOUND',
          reason: 'MANUAL_ADJUSTMENT',
          lines: [
            { variantId: 1, quantity: 1 },
            { variantId: 1, quantity: 2 },
          ],
        },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' })
  })

  it('la salida se mide contra el disponible', async () => {
    const db = getDb()
    const variant = db.productVariants.find((item) => item.quantity > 3)

    await expect(
      call('POST', '/admin/stock/transactions', {
        auth: ADMIN,
        body: {
          direction: 'OUTBOUND',
          reason: 'LOSS_DEFECTIVE',
          lines: [{ variantId: variant.id, quantity: variant.quantity + 1 }],
        },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('rechaza una nota de más de 300 caracteres', async () => {
    await expect(
      call('POST', '/admin/stock/transactions', {
        auth: ADMIN,
        body: {
          direction: 'INBOUND',
          reason: 'GOODS_RECEIPT',
          note: 'x'.repeat(301),
          lines: [{ variantId: 1, quantity: 1 }],
        },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' })
  })
})

describe('GET /admin/stock/transactions', () => {
  it('lista el resumen sin líneas, del más nuevo al más viejo', async () => {
    const result = await call('GET', '/admin/stock/transactions', {
      auth: ADMIN,
      query: { page: '1', size: '20' },
    })

    expect(result.data.items).toHaveLength(4)
    expect(result.data.items[0]).not.toHaveProperty('lines')
    const dates = result.data.items.map((item) => new Date(item.createdAt).getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('filtra por motivo con los valores del contrato', async () => {
    const result = await call('GET', '/admin/stock/transactions', {
      auth: ADMIN,
      query: { reason: 'SALE_CONFIRMED' },
    })

    expect(result.data.items).toHaveLength(1)
    expect(result.data.items[0].reason).toBe('SALE_CONFIRMED')
  })

  it('devuelve 404 si el movimiento no existe', async () => {
    await expect(
      call('GET', '/admin/stock/transactions/9999', { auth: ADMIN }),
    ).rejects.toMatchObject({ status: 404 })
  })
})
