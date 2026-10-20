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

function criticalAlert() {
  return getDb().alerts.find(
    (alert) => alert.alertType === 'CriticalStock' && alert.status === 'Active',
  )
}

describe('GET /admin/stock/alerts', () => {
  it('devuelve las alertas con el tipo en `alerType`', async () => {
    const result = await call('GET', '/admin/stock/alerts', {
      auth: ADMIN,
      query: { size: '100' },
    })

    expect(result.status).toBe(200)
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(result.data.items[0]).toMatchObject({
      variantId: expect.any(Number),
      alerType: expect.any(String),
      status: expect.any(String),
      notifiedAt: null,
    })
  })

  it('trae los dos tipos, incluidos los avisos de reposición del cliente', async () => {
    const result = await call('GET', '/admin/stock/alerts', {
      auth: ADMIN,
      query: { size: '100' },
    })

    const types = new Set(result.data.items.map((alert) => alert.alerType))
    expect(types.has('CRITICAL_STOCK')).toBe(true)
    expect(types.has('RESTOCK_NOTICE')).toBe(true)
  })

  it('filtra por estado', async () => {
    const result = await call('GET', '/admin/stock/alerts', {
      auth: ADMIN,
      query: { status: 'ACTIVE', size: '100' },
    })

    expect(result.data.items.every((alert) => alert.status === 'ACTIVE')).toBe(true)
  })
})

describe('PATCH /admin/stock/alerts/:id/notify', () => {
  it('pasa la alerta a NOTIFIED y registra la fecha', async () => {
    const alert = criticalAlert()

    const result = await call('PATCH', `/admin/stock/alerts/${alert.id}/notify`, {
      auth: ADMIN,
    })

    expect(result.status).toBe(200)
    expect(result.data).toMatchObject({ id: alert.id, status: 'NOTIFIED' })
    expect(result.data.notifiedAt).toEqual(expect.any(String))
  })

  it('no repite la transición', async () => {
    const alert = criticalAlert()
    await call('PATCH', `/admin/stock/alerts/${alert.id}/notify`, { auth: ADMIN })

    await expect(
      call('PATCH', `/admin/stock/alerts/${alert.id}/notify`, { auth: ADMIN }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('devuelve 404 si la alerta no existe', async () => {
    await expect(
      call('PATCH', '/admin/stock/alerts/9999/notify', { auth: ADMIN }),
    ).rejects.toMatchObject({ status: 404 })
  })
})
