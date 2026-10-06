import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body } = {}) {
  return handle({
    method,
    url,
    query: {},
    body: body ?? {},
    auth: undefined,
    guestSessionId: null,
  })
}

describe('test tools controller', () => {
  it('reset re-siembra la base de datos', async () => {
    /*
      El directorio sembrado es amplio a propósito (la pantalla de usuarios necesita
      volumen para sus indicadores y su gráfico), así que se afirma la identidad de
      la semilla y no un número fijo de filas.
    */
    const seeded = getDb().users.length
    expect(seeded).toBeGreaterThan(3)

    // Se ensucia la base y se comprueba que el reset la devuelve al estado inicial.
    getDb().users.push({ id: 9999, type: 'Customer', name: 'Temporal' })
    expect(getDb().users.length).toBe(seeded + 1)

    await call('POST', '/__test/reset')

    expect(getDb().users.length).toBe(seeded)
    expect(getDb().users).toEqual(
      expect.arrayContaining([expect.objectContaining({ email: 'admin@vikinga.test' })]),
    )
  })

  it('transport ajusta los fallos y sigue disponible con failRate = 1', async () => {
    await call('POST', '/__test/transport', { body: { failRate: 1 } })

    // Una ruta cualquiera falla…
    await expect(call('GET', '/public/sizes')).rejects.toMatchObject({
      status: 500,
      code: 'SERVER_ERROR',
    })

    // …y las herramientas de la suite siguen disponibles para apagarla.
    const off = await call('POST', '/__test/transport', { body: { failRate: 0 } })
    expect(off.data).toMatchObject({ failRate: 0 })
    await expect(call('GET', '/public/sizes')).resolves.toBeTruthy()
  })
})
