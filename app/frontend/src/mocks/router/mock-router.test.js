import { ApiError } from '@api/client/api-error.js'
import { resetDatabase } from '@mocks/db/database.js'
import {
  configureMockRouter,
  handle,
  register,
  resetMockRouter,
} from '@mocks/router/mock-router.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

afterEach(() => {
  resetMockRouter()
})

function send(request) {
  return handle({ query: {}, body: {}, guestSessionId: null, ...request })
}

describe('mock-router', () => {
  it('matchea rutas con :params y pasa query al handler', async () => {
    register('GET', '/things/:id', (req) => ({
      status: 200,
      data: { id: Number(req.params.id), seen: req.query.q },
    }))

    const result = await send({
      method: 'GET',
      url: '/things/42',
      query: { q: 'demo' },
    })

    expect(result.status).toBe(200)
    expect(result.data).toEqual({ id: 42, seen: 'demo' })
  })

  it('devuelve 404 NOT_FOUND para rutas no registradas', async () => {
    await expect(send({ method: 'GET', url: '/missing' })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })

  it('devuelve 404 si el método no coincide con la ruta', async () => {
    register('GET', '/only-get', () => ({ status: 200, data: null }))
    await expect(send({ method: 'POST', url: '/only-get' })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })

  it('exige sesión cuando la ruta lo requiere (401)', async () => {
    register('GET', '/private', () => ({ status: 200, data: null }), { auth: 'user' })
    await expect(send({ method: 'GET', url: '/private' })).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })

  it('resuelve el usuario a partir de un token válido', async () => {
    register(
      'GET',
      '/private',
      (req) => ({ status: 200, data: { name: req.auth.user.name } }),
      {
        auth: 'user',
      },
    )

    const result = await send({
      method: 'GET',
      url: '/private',
      auth: { token: 'vkfit.2.test' },
    })

    expect(result.data.name).toBe('Ana Rodríguez')
  })

  it('rechaza token desconocido como 401', async () => {
    register('GET', '/private', () => ({ status: 200, data: null }), { auth: 'user' })
    await expect(
      send({ method: 'GET', url: '/private', auth: { token: 'vkfit.999.test' } }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' })
  })

  it('rechaza rol customer en rutas admin (403)', async () => {
    register('GET', '/admin-thing', () => ({ status: 200, data: null }), {
      auth: 'admin',
    })
    await expect(
      send({ method: 'GET', url: '/admin-thing', auth: { token: 'vkfit.2.test' } }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })

  it('acepta rol admin con token de admin', async () => {
    register('GET', '/admin-thing', () => ({ status: 200, data: null }), {
      auth: 'admin',
    })
    const result = await send({
      method: 'GET',
      url: '/admin-thing',
      auth: { token: 'vkfit.1.test' },
    })
    expect(result.status).toBe(200)
  })

  it('propaga ApiError lanzado por el handler', async () => {
    register('GET', '/boom', () => {
      throw new ApiError(422, 'OUT_OF_RANGE', { measure: 'bust' })
    })
    await expect(send({ method: 'GET', url: '/boom' })).rejects.toMatchObject({
      status: 422,
      code: 'OUT_OF_RANGE',
      details: { measure: 'bust' },
    })
  })

  it('convierte respuestas con status >= 400 en ApiError', async () => {
    register('GET', '/conflict', () => ({
      status: 409,
      error: { code: 'ALREADY_RATED' },
    }))
    await expect(send({ method: 'GET', url: '/conflict' })).rejects.toMatchObject({
      status: 409,
      code: 'ALREADY_RATED',
    })
  })

  it('simula fallos con failRate = 1', async () => {
    configureMockRouter({ failRate: 1 })
    register('GET', '/flaky', () => ({ status: 200, data: null }))
    await expect(send({ method: 'GET', url: '/flaky' })).rejects.toMatchObject({
      status: 500,
      code: 'SERVER_ERROR',
    })
  })
})
