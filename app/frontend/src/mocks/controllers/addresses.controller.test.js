import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

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
    expect(result.data[1]).toMatchObject({
      street: 'Rambla de los Argentinos',
      isDefault: false,
    })
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
    expect(result.data).toMatchObject({
      street: 'Rivera',
      reference: 'Apto 4',
      isDefault: true,
    })

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

describe('addresses controller — edición, predeterminada y baja', () => {
  it('edita solo los campos que llegan', async () => {
    const result = await call('PATCH', '/me/addresses/2', {
      auth: ANA,
      body: { city: 'Punta del Este', reference: '' },
    })

    expect(result.data).toMatchObject({
      id: 2,
      street: 'Rambla de los Argentinos',
      city: 'Punta del Este',
      reference: '',
    })
  })

  it('rechaza dejar vacío un campo obligatorio y las direcciones ajenas', async () => {
    await expect(
      call('PATCH', '/me/addresses/2', { auth: ANA, body: { city: '   ' } }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { fields: ['city'] },
    })

    await expect(
      call('PATCH', '/me/addresses/1', {
        auth: OTHER,
        body: { city: 'Robada' },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    expect(getDb().addresses.find((item) => item.id === 1).city).toBe('Montevideo')
  })

  it('cambia la dirección predeterminada', async () => {
    const result = await call('PUT', '/me/addresses/2/default', { auth: ANA })

    expect(result.data).toMatchObject({ id: 2, isDefault: true })
    const list = await call('GET', '/me/addresses', { auth: ANA })
    expect(list.data.filter((address) => address.isDefault)).toHaveLength(1)
    expect(list.data[0].id).toBe(2)
  })

  it('da de baja la predeterminada y promueve la más antigua que queda', async () => {
    const result = await call('DELETE', '/me/addresses/1', { auth: ANA })
    expect(result.status).toBe(204)

    const list = await call('GET', '/me/addresses', { auth: ANA })
    expect(list.data).toHaveLength(1)
    expect(list.data[0]).toMatchObject({ id: 2, isDefault: true })

    // Baja lógica: el registro sigue para las ventas que lo referencian.
    expect(getDb().addresses.find((item) => item.id === 1).active).toBe(false)
  })

  it('rechaza bajas y cambios de predeterminada ajenos', async () => {
    await expect(
      call('DELETE', '/me/addresses/1', { auth: OTHER }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    await expect(
      call('PUT', '/me/addresses/1/default', { auth: OTHER }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
