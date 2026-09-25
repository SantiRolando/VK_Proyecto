import { beforeEach, describe, expect, it } from 'vitest'
import { getDb, resetDatabase } from '../db/database.js'
import { configureMockRouter, handle } from '../router/mock-router.js'
import './register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body, auth } = {}) {
  return handle({
    method,
    url,
    query: {},
    body: body ?? {},
    auth,
    guestSessionId: null,
  })
}

const ANA = { token: 'vkfit.2.test' }
const OTHER = { token: 'vkfit.3.test' }

const VALID_ADDRESS = {
  street: 'Rivera',
  number: '3000',
  city: 'Montevideo',
  department: 'Montevideo',
  reference: 'Apto 4',
}

describe('addresses controller', () => {
  it('exige sesión', async () => {
    await expect(call('GET', '/me/addresses')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })

  it('lista solo las direcciones propias, con la predeterminada primero', async () => {
    const result = await call('GET', '/me/addresses', { auth: ANA })

    expect(result.status).toBe(200)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toMatchObject({ street: 'Av. Italia', isDefault: true })
    expect(result.data[1]).toMatchObject({ street: 'Rambla de los Argentinos', isDefault: false })
    // No expone internos del ER.
    expect(result.data[0]).not.toHaveProperty('userId')
    expect(result.data[0]).not.toHaveProperty('active')
  })

  it('la primera dirección de un cliente queda como predeterminada', async () => {
    const result = await call('POST', '/me/addresses', {
      auth: OTHER,
      body: VALID_ADDRESS,
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({ street: 'Rivera', reference: 'Apto 4', isDefault: true })

    const list = await call('GET', '/me/addresses', { auth: OTHER })
    expect(list.data).toHaveLength(1)
  })

  it('marcar una nueva como predeterminada mueve la marca', async () => {
    const created = await call('POST', '/me/addresses', {
      auth: ANA,
      body: { ...VALID_ADDRESS, isDefault: true },
    })
    expect(created.data.isDefault).toBe(true)

    const list = await call('GET', '/me/addresses', { auth: ANA })
    const defaults = list.data.filter((address) => address.isDefault)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].id).toBe(created.data.id)
  })

  it('valida los campos obligatorios', async () => {
    await expect(
      call('POST', '/me/addresses', { auth: ANA, body: { street: 'Rivera' } }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { fields: ['number', 'city', 'department'] },
    })

    expect(getDb().addresses).toHaveLength(2)
  })
})
