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
const ANA = { token: 'vkfit.2.test' }
const NUEVO = { token: 'vkfit.3.test' }

/*
  Endurance talle M no tiene stock en ningún color en la seed, y Ana está suscripta al aviso de
  reposición de la variante navy.
*/
function enduranceMSize() {
  return getDb().sizes.find((item) => item.line === 'Endurance' && item.code === 'M')
}

function navyVariant() {
  return getDb().productVariants.find(
    (variant) => variant.sizeId === enduranceMSize().id && variant.color === 'navy',
  )
}

describe('avisos de reposición', () => {
  it('la lista agrupa por línea × talle y arranca activa', async () => {
    const result = await call('GET', '/me/restock-alerts', { auth: ANA })

    expect(result.status).toBe(200)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      line: 'Endurance',
      size: { id: enduranceMSize().id, code: 'M' },
      variantCount: 1,
      status: 'Active',
    })
  })

  it('el grupo pasa a notificado cuando se repone la variante', async () => {
    await call('POST', '/admin/stock-transactions', {
      auth: ADMIN,
      body: {
        reason: 'GoodsReceipt',
        lines: [{ variantId: navyVariant().id, quantity: 2 }],
      },
    })

    const result = await call('GET', '/me/restock-alerts', { auth: ANA })
    expect(result.data[0].status).toBe('Notified')
  })

  it('repetir la suscripción no duplica avisos', async () => {
    const body = { line: 'Endurance', sizeId: enduranceMSize().id }
    await call('POST', '/restock-alerts', { auth: ANA, body })
    const afterFirst = getDb().alerts.filter((alert) => alert.userId === 2).length

    const again = await call('POST', '/restock-alerts', { auth: ANA, body })

    expect(again.status).toBe(201)
    expect(again.data.created).toBe(0)
    expect(getDb().alerts.filter((alert) => alert.userId === 2)).toHaveLength(afterFirst)
  })

  it('suspender el aviso lo saca de la lista', async () => {
    const before = await call('GET', '/me/restock-alerts', { auth: ANA })

    const removed = await call('DELETE', `/me/restock-alerts/${before.data[0].ids[0]}`, {
      auth: ANA,
    })
    expect(removed.status).toBe(204)

    const after = await call('GET', '/me/restock-alerts', { auth: ANA })
    expect(after.data).toHaveLength(0)
  })

  it('otro cliente no puede suspender un aviso ajeno', async () => {
    const ana = await call('GET', '/me/restock-alerts', { auth: ANA })

    await expect(
      call('DELETE', `/me/restock-alerts/${ana.data[0].ids[0]}`, { auth: NUEVO }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
