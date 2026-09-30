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
    await expect(call('GET', '/addresses')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })

  it('lista solo las direcciones propias, con la predeterminada primero', async () => {
    const result = await call('GET', '/addresses', { auth: ANA })

    expect(result.status).toBe(200)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toMatchObject({ street: 'Av. Italia', isDefault: true })
    expect(result.data[1]).toMatchObject({
      street: 'Rambla de los Argentinos',
      reference: null,
      isDefault: false,
    })
    // No expone internos del ER.
    expect(result.data[0]).not.toHaveProperty('userId')
    expect(result.data[0]).not.toHaveProperty('active')
  })

  it('la primera dirección de un cliente queda como predeterminada', async () => {
    const result = await call('POST', '/addresses', {
      auth: OTHER,
      body: VALID_ADDRESS,
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      street: 'Rivera',
      reference: 'Apto 4',
      isDefault: true,
    })

    const list = await call('GET', '/addresses', { auth: OTHER })
    expect(list.data).toHaveLength(1)
  })

  it('valida calle, ciudad y departamento', async () => {
    await expect(
      call('POST', '/addresses', { auth: ANA, body: { street: 'Rivera' } }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { fields: { city: expect.any(String), department: expect.any(String) } },
    })

    expect(getDb().addresses).toHaveLength(2)
  })
})

describe('addresses controller — edición, predeterminada y baja', () => {
  it('reemplaza la dirección completa con PUT', async () => {
    const result = await call('PUT', '/addresses/2', {
      auth: ANA,
      body: { ...VALID_ADDRESS, city: 'Punta del Este', reference: '' },
    })

    expect(result.data).toMatchObject({
      id: 2,
      street: 'Rivera',
      city: 'Punta del Este',
      reference: null,
    })
  })

  it('rechaza dejar vacío un campo obligatorio y las direcciones ajenas', async () => {
    await expect(
      call('PUT', '/addresses/2', { auth: ANA, body: { ...VALID_ADDRESS, city: '   ' } }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { fields: { city: expect.any(String) } },
    })

    await expect(
      call('PUT', '/addresses/1', {
        auth: OTHER,
        body: { ...VALID_ADDRESS, city: 'Robada' },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    expect(getDb().addresses.find((item) => item.id === 1).city).toBe('Montevideo')
  })

  it('cambia la dirección predeterminada', async () => {
    const result = await call('PUT', '/addresses/2/default', { auth: ANA })

    expect(result.data).toMatchObject({ id: 2, isDefault: true })
    const list = await call('GET', '/addresses', { auth: ANA })
    expect(list.data.filter((address) => address.isDefault)).toHaveLength(1)
    expect(list.data[0].id).toBe(2)
  })

  it('borrar la predeterminada deja al usuario sin default (baja lógica)', async () => {
    const result = await call('DELETE', '/addresses/1', { auth: ANA })
    expect(result.status).toBe(204)

    const list = await call('GET', '/addresses', { auth: ANA })
    expect(list.data).toHaveLength(1)
    expect(list.data[0]).toMatchObject({ id: 2, isDefault: false })

    // Baja lógica: el registro sigue para las ventas que lo referencian.
    expect(getDb().addresses.find((item) => item.id === 1).active).toBe(false)
  })

  it('rechaza bajas y cambios de predeterminada ajenos', async () => {
    await expect(call('DELETE', '/addresses/1', { auth: OTHER })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })

    await expect(
      call('PUT', '/addresses/1/default', { auth: OTHER }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
