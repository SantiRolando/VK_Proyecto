import { ApiError } from '@api/client/api-error.js'
import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body, auth, guestSessionId } = {}) {
  return handle({
    method,
    url,
    query: {},
    body: body ?? {},
    auth,
    guestSessionId: guestSessionId ?? null,
  })
}

const REGISTER_PAYLOAD = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'secreto123',
  whatsappPhone: '+59899123456',
}

describe('auth controller (contrato del backend)', () => {
  it('registra un usuario y devuelve access + refresh token sin exponer la contraseña', async () => {
    const result = await call('POST', '/auth/register', { body: REGISTER_PAYLOAD })

    expect(result.status).toBe(201)
    expect(result.data.accessToken).toMatch(/^vkfit\.\d+\./)
    expect(result.data.refreshToken).toMatch(/^vkfit-refresh\.\d+\./)
    expect(result.data.expiresInSeconds).toBe(1800)
    expect(result.data.user).toMatchObject({
      role: 'CUSTOMER',
      email: 'test@example.com',
      pointsBalance: 0,
    })
    expect(result.data.user.password).toBeUndefined()
    expect(JSON.stringify(result.data)).not.toContain('secreto123')
  })

  it('rechaza email duplicado con 409 EMAIL_TAKEN', async () => {
    await expect(
      call('POST', '/auth/register', {
        body: { ...REGISTER_PAYLOAD, email: 'ana@example.test' },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' })
  })

  it('valida campos obligatorios con VALIDATION_ERROR', async () => {
    await expect(
      call('POST', '/auth/register', { body: { name: 'Sin Teléfono' } }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fields: expect.arrayContaining(['email', 'password', 'whatsappPhone']) },
    })
  })

  it('migra las generaciones del invitado y crea el perfil «Mis medidas»', async () => {
    const result = await call('POST', '/auth/register', {
      body: { ...REGISTER_PAYLOAD, guestSessionId: 'guest-demo-1' },
    })
    const db = getDb()
    const userId = result.data.user.id

    const migrated = db.sizeGenerations.filter(
      (generation) => generation.guestSessionId === 'guest-demo-1',
    )
    expect(migrated).toHaveLength(0)

    const linked = db.sizeGenerations.filter(
      (generation) => generation.customerId === userId,
    )
    expect(linked).toHaveLength(2)

    const profile = db.measurementProfiles.find((item) => item.userId === userId)
    expect(profile).toMatchObject({
      name: 'Mis medidas',
      isDefault: true,
      bust: 90, // medidas de la última generación del invitado
      waist: 72,
    })
  })

  it('inicia sesión unificado: clientes y admins por el mismo endpoint', async () => {
    const customer = await call('POST', '/auth/login', {
      body: { email: 'ana@example.test', password: 'cliente123' },
    })
    expect(customer.data.user.role).toBe('CUSTOMER')

    const admin = await call('POST', '/auth/login', {
      body: { email: 'admin@vikinga.test', password: 'admin123' },
    })
    expect(admin.data.user.role).toBe('ADMIN')
  })

  it('rechaza credenciales inválidas con 401 INVALID_CREDENTIALS', async () => {
    await expect(
      call('POST', '/auth/login', {
        body: { email: 'ana@example.test', password: 'incorrecta' },
      }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  })

  it('también migra el invitado al iniciar sesión', async () => {
    const guestGenerationIds = getDb()
      .sizeGenerations.filter(
        (generation) => generation.guestSessionId === 'guest-demo-1',
      )
      .map((generation) => generation.id)
    expect(guestGenerationIds).toHaveLength(2)

    const result = await call('POST', '/auth/login', {
      body: {
        email: 'nuevo@example.test',
        password: 'cliente123',
        guestSessionId: 'guest-demo-1',
      },
    })

    const db = getDb()
    const userId = result.data.user.id
    for (const id of guestGenerationIds) {
      const generation = db.sizeGenerations.find((item) => item.id === id)
      expect(generation.guestSessionId).toBeNull()
      expect(generation.customerId).toBe(userId)
    }
  })

  it('renueva la sesión con el refresh token y rechaza uno inválido', async () => {
    const login = await call('POST', '/auth/login', {
      body: { email: 'ana@example.test', password: 'cliente123' },
    })

    const renewed = await call('POST', '/auth/refresh', {
      body: { refreshToken: login.data.refreshToken },
    })
    expect(renewed.status).toBe(200)
    expect(renewed.data.user.id).toBe(login.data.user.id)
    expect(renewed.data.accessToken).not.toBe(login.data.accessToken)

    await expect(
      call('POST', '/auth/refresh', { body: { refreshToken: 'nope' } }),
    ).rejects.toMatchObject({ status: 401, code: 'REFRESH_TOKEN_INVALID' })

    // Un refresh token nunca sirve como Bearer.
    await expect(
      call('GET', '/auth/me', { auth: { token: login.data.refreshToken } }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' })
  })

  it('ingresa con el código OTP fijo 123456 y rechaza códigos inválidos', async () => {
    const requested = await call('POST', '/auth/otp/request', {
      body: { email: 'nadie@example.com' },
    })
    expect(requested.status).toBe(202)

    const ok = await call('POST', '/auth/otp/login', {
      body: { email: 'ana@example.test', code: '123456' },
    })
    expect(ok.data.user.role).toBe('CUSTOMER')
    expect(ok.data.accessToken).toMatch(/^vkfit\./)

    await expect(
      call('POST', '/auth/otp/login', {
        body: { email: 'ana@example.test', code: '000000' },
      }),
    ).rejects.toMatchObject({ status: 401, code: 'OTP_INVALID' })

    await expect(
      call('POST', '/auth/otp/login', {
        body: { email: 'nadie@example.com', code: '123456' },
      }),
    ).rejects.toMatchObject({ status: 401, code: 'OTP_INVALID' })
  })

  it('expone /auth/me solo con sesión y sin datos sensibles', async () => {
    await expect(call('GET', '/auth/me')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })

    const result = await call('GET', '/auth/me', { auth: { token: 'vkfit.1.test' } })
    expect(result.data).toMatchObject({ id: 1, role: 'ADMIN' })
    expect(result.data.password).toBeUndefined()
  })

  it('cambia la contraseña con el código OTP y permite volver a ingresar', async () => {
    await call('POST', '/auth/otp/request', { body: { email: 'ana@example.test' } })
    const reset = await call('POST', '/auth/otp/reset-password', {
      body: { email: 'ana@example.test', code: '123456', newPassword: 'nueva1234' },
    })
    expect(reset.status).toBe(204)

    const login = await call('POST', '/auth/login', {
      body: { email: 'ana@example.test', password: 'nueva1234' },
    })
    expect(login.status).toBe(200)
  })

  it('hace logout con el refresh token, sin sesión, y responde 204', async () => {
    const result = await call('POST', '/auth/logout', { body: { refreshToken: 'x' } })
    expect(result.status).toBe(204)
    expect(result.data).toBeNull()
  })
})

describe('errores de contrato', () => {
  it('ApiError conserva status, code y details', () => {
    const error = new ApiError(409, 'STOCK_INSUFFICIENT', {
      variantId: 301,
      available: 0,
    })
    expect(error.status).toBe(409)
    expect(error.code).toBe('STOCK_INSUFFICIENT')
    expect(error.details).toEqual({ variantId: 301, available: 0 })
  })
})
