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

// Clientes registrados: el insumo del modo asistente para vincular una generación.
describe('admin customers controller', () => {
  it('lista solo clientes, ordenados por nombre y con la forma del asistente', async () => {
    const result = await call('GET', '/admin/customers', { auth: ADMIN })
    const customerCount = getDb().users.filter((user) => user.type === 'Customer').length

    expect(result.status).toBe(200)
    expect(result.data).toHaveLength(customerCount)
    expect(result.meta.total).toBe(result.data.length)
    // La forma mínima que espera el asistente: id, nombre y correo.
    expect(
      result.data.every((user) => Object.keys(user).join(',') === 'id,name,email'),
    ).toBe(true)
    expect(result.data.some((user) => user.type === 'Admin')).toBe(false)

    const names = result.data.map((user) => user.name)
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names)
  })

  it('un cliente no puede pedir la lista', async () => {
    await expect(call('GET', '/admin/customers', { auth: ANA })).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
  })
})
