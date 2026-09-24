import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../../api/client/api-error.js'
import { getDb, resetDatabase } from '../db/database.js'
import { configureMockRouter, handle } from '../router/mock-router.js'
import './register-all.js'

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

describe('auth controller', () => {
  it('registra un usuario y devuelve token sin exponer la contraseña', async () => {
    const result = await call('POST', '/auth/register', { body: REGISTER_PAYLOAD })

    expect(result.status).toBe(201)
    expect(result.data.token).toMatch(/^vkfit\.\d+\./)
    expect(result.data.user).toMatchObject({
      type: 'Customer',
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

  it('valida campos obligatorios con 422 VALIDATION_ERROR', async () => {
    await expect(
      call('POST', '/auth/register', { body: { name: 'Sin Teléfono' } }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { fields: expect.arrayContaining(['email', 'password', 'whatsappPhone']) },
    })
  })

  it('migra las generaciones del invitado y crea el perfil por defecto', async () => {
    const result = await call('POST', '/auth/register', {
      body: {
        ...REGISTER_PAYLOAD,
        guestSessionId: 'guest-demo-1',
        migrationProfileName: 'Perfil migrado',
      },
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
      name: 'Perfil migrado',
      isDefault: true,
      bust: 90, // medidas de la última generación del invitado
      waist: 72,
    })
  })

  it('inicia sesión unificado: clientes y admins por el mismo endpoint', async () => {
    const customer = await call('POST', '/auth/login', {
      body: { email: 'ana@example.test', password: 'cliente123' },
    })
    expect(customer.data.user.type).toBe('Customer')

    const admin = await call('POST', '/auth/login', {
      body: { email: 'admin@vikinga.test', password: 'admin123' },
    })
    expect(admin.data.user.type).toBe('Admin')
  })

  it('rechaza credenciales inválidas con 401 INVALID_CREDENTIALS', async () => {
    await expect(
      call('POST', '/auth/login', {
        body: { email: 'ana@example.test', password: 'incorrecta' },
      }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  })

  it('también migra el invitado al iniciar sesión (Q-05)', async () => {
    const guestGenerationIds = getDb()
      .sizeGenerations.filter((generation) => generation.guestSessionId === 'guest-demo-1')
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

  it('verifica OTP con el código fijo 123456 y rechaza códigos inválidos', async () => {
    const ok = await call('POST', '/auth/otp/verify', {
      body: { email: 'ana@example.test', code: '123456' },
    })
    expect(ok.data.user.type).toBe('Customer')
    expect(ok.data.token).toMatch(/^vkfit\./)

    await expect(
      call('POST', '/auth/otp/verify', {
        body: { email: 'ana@example.test', code: '000000' },
      }),
    ).rejects.toMatchObject({ status: 401, code: 'OTP_INVALID' })

    await expect(
      call('POST', '/auth/otp/verify', {
        body: { email: 'nadie@example.com', code: '123456' },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  it('expone /auth/me solo con sesión y sin datos sensibles', async () => {
    await expect(call('GET', '/auth/me')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })

    const result = await call('GET', '/auth/me', { auth: { token: 'vkfit.1.test' } })
    expect(result.data).toMatchObject({ id: 1, type: 'Admin' })
    expect(result.data.password).toBeUndefined()
  })

  it('permite resetear la contraseña y volver a ingresar', async () => {
    await call('POST', '/auth/password/forgot', { body: { email: 'ana@example.test' } })
    await call('POST', '/auth/password/reset', {
      body: { email: 'ana@example.test', token: 'mock-token', password: 'nueva123' },
    })

    const login = await call('POST', '/auth/login', {
      body: { email: 'ana@example.test', password: 'nueva123' },
    })
    expect(login.status).toBe(200)
  })

  it('hace logout sin romper nada', async () => {
    const result = await call('POST', '/auth/logout', { auth: { token: 'vkfit.2.test' } })
    expect(result.status).toBe(204)
    expect(result.data).toBeNull()
  })
})

describe('errores de contrato', () => {
  it('ApiError conserva status, code y details', () => {
    const error = new ApiError(409, 'STOCK_INSUFFICIENT', { variantId: 301, available: 0 })
    expect(error.status).toBe(409)
    expect(error.code).toBe('STOCK_INSUFFICIENT')
    expect(error.details).toEqual({ variantId: 301, available: 0 })
  })
})
