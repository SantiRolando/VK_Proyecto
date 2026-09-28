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

describe('GET /admin/products', () => {
  it('lista el catálogo completo con el conteo de variantes', async () => {
    const result = await call('GET', '/admin/products', { auth: ADMIN })

    expect(result.data.length).toBe(getDb().products.length)
    expect(result.data[0]).toMatchObject({
      model: 'endurance-classic',
      variantCount: expect.any(Number),
      active: true,
    })
  })
})

describe('POST /admin/products', () => {
  it('crea un producto', async () => {
    const result = await call('POST', '/admin/products', {
      auth: ADMIN,
      body: {
        line: 'Sunga',
        model: 'sunga-pro',
        description: '  Sunga de competición nueva  ',
        price: 1250,
      },
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      line: 'Sunga',
      model: 'sunga-pro',
      description: 'Sunga de competición nueva',
      price: 1250,
      active: true,
      variantCount: 0,
    })
  })

  it('valida línea, precio y modelo repetido', async () => {
    await expect(
      call('POST', '/admin/products', {
        auth: ADMIN,
        body: { line: 'Bikini', model: 'x', price: 100 },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('POST', '/admin/products', {
        auth: ADMIN,
        body: { line: 'Sunga', model: 'y', price: 0 },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('POST', '/admin/products', {
        auth: ADMIN,
        body: { line: 'Sunga', model: 'sunga-classic', price: 100 },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })
})

describe('PATCH / DELETE /admin/products/:id', () => {
  it('edita precio y descripción', async () => {
    const product = getDb().products[0]

    const result = await call('PATCH', `/admin/products/${product.id}`, {
      auth: ADMIN,
      body: { price: 1999, description: 'Nueva descripción' },
    })

    expect(result.data).toMatchObject({ price: 1999, description: 'Nueva descripción' })
  })

  it('da de baja el producto y el catálogo del cliente deja de ofrecerlo', async () => {
    const product = getDb().products.find((item) => item.model === 'endurance-classic')
    const size = getDb().sizes.find(
      (item) => item.line === 'Endurance' && item.code === 'L',
    )

    const before = await call('GET', '/catalog', { query: { sizeId: size.id } })
    expect(before.data.some((item) => item.id === product.id)).toBe(true)

    const removed = await call('DELETE', `/admin/products/${product.id}`, { auth: ADMIN })
    expect(removed.data.active).toBe(false)

    const after = await call('GET', '/catalog', { query: { sizeId: size.id } })
    expect(after.data.some((item) => item.id === product.id)).toBe(false)

    // Sigue existiendo en el panel (baja lógica).
    const admin = await call('GET', '/admin/products', { auth: ADMIN })
    expect(admin.data.find((item) => item.id === product.id).active).toBe(false)
  })
})
