import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { auth, query } = {}) {
  return handle({ method, url, query: query ?? {}, body: {}, auth, guestSessionId: null })
}

const ADMIN = { token: 'vkfit.1.test' }

describe('GET /admin/analytics/conversion', () => {
  it('cuenta generaciones y compras del rango y calcula el ratio', async () => {
    const all = await call('GET', '/admin/analytics/conversion', { auth: ADMIN })

    expect(all.data.generations).toBe(getDb().sizeGenerations.length)
    expect(all.data.sales).toBe(getDb().sales.length)
    expect(all.data.ratio).toBeCloseTo(all.data.sales / all.data.generations)

    // Un rango sin datos deja todo en 0.
    const empty = await call('GET', '/admin/analytics/conversion', {
      auth: ADMIN,
      query: { from: '2000-01-01', to: '2000-01-02' },
    })
    expect(empty.data).toEqual({ generations: 0, sales: 0, ratio: 0 })
  })
})

describe('GET /admin/analytics/precision', () => {
  it('separa compró de solo consultó y cuenta los feedback "Correcto"', async () => {
    const result = await call('GET', '/admin/analytics/precision', { auth: ADMIN })

    // Las generaciones 101 y 102 tienen venta asociada y feedback Correcto.
    expect(result.data.purchased).toEqual({ correct: 2, total: 2 })
    // El resto de las generaciones calificadas solo consultó.
    expect(result.data.consultedOnly.total).toBeGreaterThan(0)
    expect(result.data.consultedOnly.correct).toBeGreaterThanOrEqual(1)
  })
})

describe('GET /admin/analytics/critical-stock', () => {
  it('lista las variantes activas por debajo del mínimo, ordenadas por faltante', async () => {
    const result = await call('GET', '/admin/analytics/critical-stock', { auth: ADMIN })

    expect(result.data.length).toBeGreaterThan(0)
    for (const item of result.data) {
      expect(item.available).toBeLessThan(item.minStock)
      expect(item.deficit).toBe(item.minStock - item.available)
      expect(item.sku).toBeTruthy()
    }

    const deficits = result.data.map((item) => item.deficit)
    expect([...deficits].sort((a, b) => b - a)).toEqual(deficits)
  })

  it('requiere rol de administrador', async () => {
    await expect(
      call('GET', '/admin/analytics/conversion', { auth: { token: 'vkfit.2.test' } }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })
})
