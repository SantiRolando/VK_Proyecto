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

describe('GET /admin/variants', () => {
  it('expone físico, reservado, disponible y crítico, con filtros', async () => {
    const all = await call('GET', '/admin/variants', { auth: ADMIN })
    expect(all.data.length).toBe(getDb().productVariants.length)
    expect(all.data[0]).toMatchObject({
      quantity: expect.any(Number),
      reserved: expect.any(Number),
      available: expect.any(Number),
      minStock: expect.any(Number),
    })

    const endurance = await call('GET', '/admin/variants', {
      auth: ADMIN,
      query: { line: 'Endurance' },
    })
    expect(endurance.data.every((item) => item.product.line === 'Endurance')).toBe(true)

    const critical = await call('GET', '/admin/variants', {
      auth: ADMIN,
      query: { lowStock: 'true' },
    })
    expect(critical.data.length).toBeGreaterThan(0)
    expect(critical.data.every((item) => item.isCritical)).toBe(true)
  })
})

describe('POST /admin/variants', () => {
  const product = () => getDb().products.find((item) => item.model === 'soft-classic')

  it('crea una variante nueva con SKU único', async () => {
    const item = product()
    const size = getDb().sizes.find(
      (candidate) => candidate.line === 'Soft' && candidate.code === 'XXL',
    )

    const result = await call('POST', '/admin/variants', {
      auth: ADMIN,
      body: {
        productId: item.id,
        sizeId: size.id,
        color: 'red',
        sku: ' soft-classic-red-xxl ',
        quantity: 6,
        minStock: 2,
      },
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      sku: 'SOFT-CLASSIC-RED-XXL',
      color: 'red',
      quantity: 6,
      available: 6,
      active: true,
    })
  })

  it('rechaza SKU repetido y talle de otra línea', async () => {
    const item = product()
    const existing = getDb().productVariants.find(
      (variant) => variant.productId === item.id,
    )
    const size = getDb().sizes.find(
      (candidate) => candidate.line === 'Soft' && candidate.code === 'XL',
    )

    await expect(
      call('POST', '/admin/variants', {
        auth: ADMIN,
        body: {
          productId: item.id,
          sizeId: size.id,
          color: 'red',
          sku: existing.sku,
        },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    const enduranceSize = getDb().sizes.find(
      (candidate) => candidate.line === 'Endurance' && candidate.code === 'S',
    )
    await expect(
      call('POST', '/admin/variants', {
        auth: ADMIN,
        body: {
          productId: item.id,
          sizeId: enduranceSize.id,
          color: 'red',
          sku: 'NUEVO-1',
        },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })
})

describe('PATCH /admin/variants/:id', () => {
  it('edita el mínimo y la baja lógica, pero no el físico', async () => {
    const variant = getDb().productVariants[0]

    const updated = await call('PATCH', `/admin/variants/${variant.id}`, {
      auth: ADMIN,
      body: { minStock: 9, active: false, quantity: 999 },
    })

    expect(updated.data).toMatchObject({ minStock: 9, active: false })
    // El físico no se toca por PATCH: cambia solo con movimientos de stock.
    expect(updated.data.quantity).toBe(variant.quantity)
  })

  it('rechaza un SKU que ya usa otra variante', async () => {
    const [first, second] = getDb().productVariants

    await expect(
      call('PATCH', `/admin/variants/${second.id}`, {
        auth: ADMIN,
        body: { sku: first.sku },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })
})
