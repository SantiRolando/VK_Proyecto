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

const ANA = { token: 'vkfit.2.test' } // tiene los perfiles "Training" (default) y "Son"
const OTHER = { token: 'vkfit.3.test' } // sin perfiles

const VALID_PROFILE = {
  name: 'Verano',
  height: 170,
  bust: 92,
  waist: 74,
  hip: 100,
  torso: 143,
}

describe('profiles controller — listado y alta', () => {
  it('exige sesión', async () => {
    await expect(call('GET', '/profiles')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })

  it('lista solo los perfiles propios, con el predeterminado primero', async () => {
    const result = await call('GET', '/profiles', { auth: ANA })

    expect(result.status).toBe(200)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toMatchObject({ name: 'Training', isDefault: true, age: null })
    expect(result.data[1]).toMatchObject({ name: 'Son', isDefault: false })
    // No expone internos del ER.
    expect(result.data[0]).not.toHaveProperty('userId')
    expect(result.data[0]).not.toHaveProperty('active')
  })

  it('el primer perfil de un cliente queda como predeterminado', async () => {
    const result = await call('POST', '/profiles', {
      auth: OTHER,
      body: VALID_PROFILE,
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({ name: 'Verano', isDefault: true })

    const list = await call('GET', '/profiles', { auth: OTHER })
    expect(list.data).toHaveLength(1)
  })

  it('las medidas son opcionales pero deben estar en rango', async () => {
    const onlyName = await call('POST', '/profiles', {
      auth: ANA,
      body: { name: 'Solo nombre' },
    })
    expect(onlyName.data).toMatchObject({ name: 'Solo nombre', bust: null, age: null })

    await expect(
      call('POST', '/profiles', { auth: ANA, body: { ...VALID_PROFILE, name: '   ' } }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { fields: { name: expect.any(String) } },
    })

    await expect(
      call('POST', '/profiles', { auth: ANA, body: { ...VALID_PROFILE, waist: 0 } }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { fields: { waist: expect.any(String) } },
    })
  })
})

describe('profiles controller — edición, predeterminado y baja', () => {
  it('reemplaza nombre y medidas con PUT; una medida omitida queda en null', async () => {
    const result = await call('PUT', '/profiles/2', {
      auth: ANA,
      body: { name: 'Hijo', waist: 74, hip: 100, age: 9 },
    })

    expect(result.data).toMatchObject({
      id: 2,
      name: 'Hijo',
      waist: 74,
      hip: 100,
      age: 9,
      height: null,
      bust: null,
    })
  })

  it('rechaza perfiles ajenos', async () => {
    await expect(
      call('PUT', '/profiles/1', { auth: OTHER, body: { name: 'Ajeno' } }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    expect(getDb().measurementProfiles.find((item) => item.id === 1).name).toBe(
      'Training',
    )
  })

  it('cambia el perfil predeterminado', async () => {
    const result = await call('PUT', '/profiles/2/default', { auth: ANA })

    expect(result.data).toMatchObject({ id: 2, isDefault: true })
    const list = await call('GET', '/profiles', { auth: ANA })
    expect(list.data.filter((profile) => profile.isDefault)).toHaveLength(1)
    expect(list.data[0].id).toBe(2)
  })

  it('borrar el predeterminado deja al usuario sin default', async () => {
    const removed = await call('DELETE', '/profiles/1', { auth: ANA })
    expect(removed.status).toBe(204)

    const list = await call('GET', '/profiles', { auth: ANA })
    expect(list.data).toHaveLength(1)
    expect(list.data[0]).toMatchObject({ id: 2, name: 'Son', isDefault: false })

    // La baja es lógica: el historial que apunta al perfil sigue intacto.
    const profile = getDb().measurementProfiles.find((item) => item.id === 1)
    expect(profile.active).toBe(false)
    expect(getDb().sizeGenerations.find((item) => item.id === 100).profileId).toBe(1)
  })

  it('permite quedarse sin perfiles y rechaza bajas ajenas', async () => {
    await call('DELETE', '/profiles/1', { auth: ANA })
    await call('DELETE', '/profiles/2', { auth: ANA })

    const list = await call('GET', '/profiles', { auth: ANA })
    expect(list.data).toHaveLength(0)

    await expect(call('DELETE', '/profiles/1', { auth: OTHER })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})
