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
      product: { audience: expect.any(String) },
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

  it('el alta y la edición de variantes viven en el catálogo admin', async () => {
    await expect(
      call('POST', '/admin/variants', { auth: ADMIN, body: {} }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
