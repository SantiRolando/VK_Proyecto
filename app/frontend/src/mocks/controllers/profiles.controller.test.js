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
    await expect(call('GET', '/me/profiles')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })

  it('lista solo los perfiles propios, con el predeterminado primero', async () => {
    const result = await call('GET', '/me/profiles', { auth: ANA })

    expect(result.status).toBe(200)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toMatchObject({ name: 'Training', isDefault: true })
    expect(result.data[1]).toMatchObject({ name: 'Son', isDefault: false })
    // No expone internos del ER.
    expect(result.data[0]).not.toHaveProperty('userId')
    expect(result.data[0]).not.toHaveProperty('active')
  })

  it('el primer perfil de un cliente queda como predeterminado', async () => {
    const result = await call('POST', '/me/profiles', {
      auth: OTHER,
      body: VALID_PROFILE,
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({ name: 'Verano', isDefault: true })

    const list = await call('GET', '/me/profiles', { auth: OTHER })
    expect(list.data).toHaveLength(1)
  })

  it('marcar un perfil nuevo como predeterminado mueve la marca', async () => {
    const created = await call('POST', '/me/profiles', {
      auth: ANA,
      body: { ...VALID_PROFILE, isDefault: true },
    })

    const list = await call('GET', '/me/profiles', { auth: ANA })
    const defaults = list.data.filter((profile) => profile.isDefault)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].id).toBe(created.data.id)
  })

  it('valida nombre y medidas', async () => {
    await expect(
      call('POST', '/me/profiles', { auth: ANA, body: { name: 'Solo nombre' } }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { fields: ['height', 'bust', 'waist', 'hip', 'torso'] },
    })

    await expect(
      call('POST', '/me/profiles', {
        auth: ANA,
        body: { ...VALID_PROFILE, name: '   ' },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    // Las medidas deben ser números positivos.
    await expect(
      call('POST', '/me/profiles', {
        auth: ANA,
        body: { ...VALID_PROFILE, waist: 0 },
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { fields: ['waist'] },
    })
  })
})

describe('profiles controller — edición, predeterminado y baja', () => {
  it('edita el nombre sin tocar las medidas', async () => {
    const result = await call('PATCH', '/me/profiles/2', {
      auth: ANA,
      body: { name: 'Hijo' },
    })

    expect(result.data).toMatchObject({ id: 2, name: 'Hijo', height: 145 })
  })

  it('edita las medidas completas', async () => {
    const result = await call('PATCH', '/me/profiles/2', {
      auth: ANA,
      body: { ...VALID_PROFILE, name: 'Hijo' },
    })

    expect(result.data).toMatchObject({ name: 'Hijo', waist: 74, hip: 100 })
  })

  it('rechaza medidas incompletas y perfiles ajenos', async () => {
    await expect(
      call('PATCH', '/me/profiles/2', { auth: ANA, body: { waist: 74 } }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { fields: ['height', 'bust', 'hip', 'torso'] },
    })

    await expect(
      call('PATCH', '/me/profiles/1', { auth: OTHER, body: { name: 'Ajeno' } }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    expect(getDb().measurementProfiles.find((item) => item.id === 1).name).toBe(
      'Training',
    )
  })

  it('cambia el perfil predeterminado', async () => {
    const result = await call('PUT', '/me/profiles/2/default', { auth: ANA })

    expect(result.data).toMatchObject({ id: 2, isDefault: true })
    const list = await call('GET', '/me/profiles', { auth: ANA })
    expect(list.data.filter((profile) => profile.isDefault)).toHaveLength(1)
    expect(list.data[0].id).toBe(2)
  })

  it('da de baja el predeterminado y promueve el más antiguo que queda', async () => {
    await call('DELETE', '/me/profiles/1', { auth: ANA })

    const list = await call('GET', '/me/profiles', { auth: ANA })
    expect(list.data).toHaveLength(1)
    expect(list.data[0]).toMatchObject({ id: 2, name: 'Son', isDefault: true })

    // La baja es lógica: el historial que apunta al perfil sigue intacto.
    const profile = getDb().measurementProfiles.find((item) => item.id === 1)
    expect(profile.active).toBe(false)
    expect(getDb().sizeGenerations.find((item) => item.id === 100).profileId).toBe(1)
  })

  it('permite quedarse sin perfiles y rechaza bajas ajenas', async () => {
    await call('DELETE', '/me/profiles/1', { auth: ANA })
    await call('DELETE', '/me/profiles/2', { auth: ANA })

    const list = await call('GET', '/me/profiles', { auth: ANA })
    expect(list.data).toHaveLength(0)

    await expect(call('DELETE', '/me/profiles/1', { auth: OTHER })).rejects.toMatchObject(
      { status: 404, code: 'NOT_FOUND' },
    )
  })
})
