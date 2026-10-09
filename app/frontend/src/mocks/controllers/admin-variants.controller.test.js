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
  it('expone físico, reservado, disponible y crítico, con filtros y paginación', async () => {
    const all = await call('GET', '/admin/variants', { auth: ADMIN })
    expect(all.meta).toMatchObject({ page: 1, pageSize: 20 })
    expect(all.meta.total).toBe(getDb().productVariants.length)
    expect(all.data.length).toBe(20)
    expect(all.data[0]).toMatchObject({
      quantity: expect.any(Number),
      reserved: expect.any(Number),
      available: expect.any(Number),
      minStock: expect.any(Number),
      product: { audience: expect.any(String) },
    })

    // La segunda página sigue el orden, sin repetir la primera.
    const second = await call('GET', '/admin/variants', {
      auth: ADMIN,
      query: { page: 2 },
    })
    expect(second.data[0].id).not.toBe(all.data[0].id)
    expect(second.meta.page).toBe(2)

    const endurance = await call('GET', '/admin/variants', {
      auth: ADMIN,
      query: { line: 'Endurance', pageSize: 100 },
    })
    expect(endurance.data.every((item) => item.product.line === 'Endurance')).toBe(true)

    const critical = await call('GET', '/admin/variants', {
      auth: ADMIN,
      query: { lowStock: 'true', pageSize: 100 },
    })
    expect(critical.data.length).toBeGreaterThan(0)
    expect(critical.data.every((item) => item.isCritical)).toBe(true)

    // La búsqueda cruza SKU y modelo.
    const bySku = await call('GET', '/admin/variants', {
      auth: ADMIN,
      query: { q: 'ENDURANCE-CLASSIC-NAVY-M' },
    })
    expect(bySku.data.map((item) => item.sku)).toEqual(['ENDURANCE-CLASSIC-NAVY-M'])
    expect(bySku.meta.total).toBe(1)

    const byModel = await call('GET', '/admin/variants', {
      auth: ADMIN,
      query: { q: 'endurance', pageSize: 100 },
    })
    expect(byModel.data.length).toBeGreaterThan(0)
    expect(
      byModel.data.every((item) =>
        item.product.model.toLowerCase().includes('endurance'),
      ),
    ).toBe(true)
  })

  it('el alta y la edición de variantes viven en el catálogo admin', async () => {
    await expect(
      call('POST', '/admin/variants', { auth: ADMIN, body: {} }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
