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
const BASE = '/admin/catalog/products'

const sizeOf = (line, audience, code) =>
  getDb().sizes.find(
    (item) => item.line === line && item.audience === audience && item.code === code,
  )

describe('GET /admin/catalog/products', () => {
  it('exige admin y pagina el catálogo completo, activos e inactivos', async () => {
    await expect(
      call('GET', BASE, { auth: { token: 'vkfit.2.test' } }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })

    const result = await call('GET', BASE, { auth: ADMIN, query: { size: 5 } })
    expect(result.data).toMatchObject({
      page: 1,
      size: 5,
      totalElements: 12,
      totalPages: 3,
    })
    expect(result.data.items).toHaveLength(5)
    expect(result.data.items[0]).toMatchObject({
      model: 'endurance-classic',
      line: 'ENDURANCE',
      audience: 'ADULT',
      active: true,
    })

    const kids = await call('GET', BASE, { auth: ADMIN, query: { audience: 'KIDS' } })
    expect(kids.data.items.map((item) => item.model)).toEqual([
      'kids-jammer',
      'kids-sunga',
      'kids-girls-endurance',
    ])
  })

  it('expone el detalle con sus variantes', async () => {
    const result = await call('GET', `${BASE}/1`, { auth: ADMIN })
    expect(result.data.product).toMatchObject({ id: 1, model: 'endurance-classic' })
    expect(result.data.variants.length).toBeGreaterThan(0)
    expect(result.data.variants[0]).toMatchObject({
      productId: 1,
      sizeCode: expect.any(String),
      quantity: expect.any(Number),
      minStock: expect.any(Number),
      active: true,
    })
  })
})

describe('POST / PUT / PATCH /admin/catalog/products', () => {
  it('crea un producto activo y sin variantes', async () => {
    const result = await call('POST', BASE, {
      auth: ADMIN,
      body: {
        line: 'SUNGA',
        audience: 'ADULT',
        model: 'sunga-pro',
        description: '  Sunga de competición nueva  ',
        price: 1250,
      },
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      line: 'SUNGA',
      audience: 'ADULT',
      model: 'sunga-pro',
      description: 'Sunga de competición nueva',
      price: 1250,
      active: true,
    })

    const detail = await call('GET', `${BASE}/${result.data.id}`, { auth: ADMIN })
    expect(detail.data.variants).toEqual([])
  })

  it('valida línea, público, modelo y precio', async () => {
    await expect(
      call('POST', BASE, {
        auth: ADMIN,
        body: { line: 'BIKINI', audience: 'ADULT', model: 'x', price: 100 },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' })

    await expect(
      call('POST', BASE, {
        auth: ADMIN,
        body: { line: 'SUNGA', audience: 'ADULT', model: 'y', price: -1 },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { fields: { price: expect.any(String) } },
    })
  })

  it('edita con PUT, pero no cambia línea ni público si ya tiene variantes', async () => {
    const result = await call('PUT', `${BASE}/1`, {
      auth: ADMIN,
      body: {
        line: 'ENDURANCE',
        audience: 'ADULT',
        model: 'endurance-classic',
        description: 'Nueva descripción',
        price: 1999,
      },
    })
    expect(result.data).toMatchObject({ price: 1999, description: 'Nueva descripción' })

    await expect(
      call('PUT', `${BASE}/1`, {
        auth: ADMIN,
        body: {
          line: 'SOFT',
          audience: 'ADULT',
          model: 'endurance-classic',
          price: 1999,
        },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('desactiva el producto y el catálogo del cliente deja de ofrecerlo', async () => {
    const size = sizeOf('Endurance', 'Adult', 'L')

    const before = await call('GET', '/catalog', { query: { sizeId: size.id } })
    expect(before.data.some((item) => item.id === 1)).toBe(true)

    const removed = await call('PATCH', `${BASE}/1/active`, {
      auth: ADMIN,
      body: { active: false },
    })
    expect(removed.data.active).toBe(false)

    const after = await call('GET', '/catalog', { query: { sizeId: size.id } })
    expect(after.data.some((item) => item.id === 1)).toBe(false)

    // Sigue existiendo en el panel (baja lógica).
    const admin = await call('GET', BASE, { auth: ADMIN, query: { active: 'false' } })
    expect(admin.data.items.map((item) => item.id)).toEqual([1])
  })
})

describe('variantes de un producto', () => {
  const product = () => getDb().products.find((item) => item.model === 'soft-classic')

  it('crea una variante con stock 0 y SKU único', async () => {
    const size = sizeOf('Soft', 'Adult', 'XXL')

    const result = await call('POST', `${BASE}/${product().id}/variants`, {
      auth: ADMIN,
      body: { sizeId: size.id, color: 'red', sku: 'SOFT-CLASSIC-RED-XXL', minStock: 2 },
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      productId: product().id,
      sizeId: size.id,
      sizeCode: 'XXL',
      sku: 'SOFT-CLASSIC-RED-XXL',
      color: 'red',
      quantity: 0,
      minStock: 2,
      active: true,
    })
  })

  it('rechaza SKU repetido (409), talle de otra tabla (400) y producto inexistente (404)', async () => {
    const item = product()
    const existing = getDb().productVariants.find(
      (variant) => variant.productId === item.id,
    )
    const size = sizeOf('Soft', 'Adult', 'XL')

    await expect(
      call('POST', `${BASE}/${item.id}/variants`, {
        auth: ADMIN,
        body: { sizeId: size.id, color: 'red', sku: existing.sku, minStock: 0 },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })

    const enduranceSize = sizeOf('Endurance', 'Adult', 'S')
    await expect(
      call('POST', `${BASE}/${item.id}/variants`, {
        auth: ADMIN,
        body: { sizeId: enduranceSize.id, color: 'red', sku: 'NUEVO-1', minStock: 0 },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' })

    await expect(
      call('POST', `${BASE}/999/variants`, {
        auth: ADMIN,
        body: { sizeId: size.id, color: 'red', sku: 'NUEVO-2', minStock: 0 },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  it('edita color, SKU y mínimo con PUT; el talle y el físico no cambian', async () => {
    const variant = getDb().productVariants[0]

    const updated = await call(
      'PUT',
      `${BASE}/${variant.productId}/variants/${variant.id}`,
      {
        auth: ADMIN,
        body: { sizeId: variant.sizeId, color: 'red', sku: 'NUEVO-SKU', minStock: 9 },
      },
    )
    expect(updated.data).toMatchObject({ color: 'red', sku: 'NUEVO-SKU', minStock: 9 })
    expect(updated.data.quantity).toBe(variant.quantity)

    const otherSize = getDb().sizes.find(
      (size) =>
        size.line === 'Endurance' &&
        size.audience === 'Adult' &&
        size.id !== variant.sizeId,
    )
    await expect(
      call('PUT', `${BASE}/${variant.productId}/variants/${variant.id}`, {
        auth: ADMIN,
        body: { sizeId: otherSize.id, color: 'red', sku: 'NUEVO-SKU', minStock: 9 },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' })

    const [, second] = getDb().productVariants
    await expect(
      call('PUT', `${BASE}/${second.productId}/variants/${second.id}`, {
        auth: ADMIN,
        body: {
          sizeId: second.sizeId,
          color: second.color,
          sku: 'NUEVO-SKU',
          minStock: 0,
        },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('activa y desactiva una variante', async () => {
    const variant = getDb().productVariants[0]
    const off = await call(
      'PATCH',
      `${BASE}/${variant.productId}/variants/${variant.id}/active`,
      {
        auth: ADMIN,
        body: { active: false },
      },
    )
    expect(off.data.active).toBe(false)
    expect(getDb().productVariants[0].active).toBe(false)
  })
})
