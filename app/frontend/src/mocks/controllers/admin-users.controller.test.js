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

// Usuarios de la plataforma (panel): padrón, indicadores y rol de administrador.
describe('admin users controller', () => {
  it('lista el padrón con rol, alta y última actividad', async () => {
    const result = await call('GET', '/admin/users', { auth: ADMIN })

    expect(result.status).toBe(200)
    expect(result.data.length).toBeGreaterThan(3)
    expect(result.meta.total).toBe(result.data.length)

    const first = result.data[0]
    expect(first).toMatchObject({
      id: expect.any(Number),
      type: expect.stringMatching(/^(Admin|Customer)$/),
      name: expect.any(String),
      email: expect.any(String),
      createdAt: expect.any(String),
    })
    // Ordenado por alta descendente.
    const dates = result.data.map((user) => new Date(user.createdAt).getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('filtra por rol', async () => {
    const admins = await call('GET', '/admin/users', {
      auth: ADMIN,
      query: { role: 'Admin' },
    })
    const customers = await call('GET', '/admin/users', {
      auth: ADMIN,
      query: { role: 'Customer' },
    })

    expect(admins.data.length).toBeGreaterThan(0)
    expect(admins.data.every((user) => user.type === 'Admin')).toBe(true)
    expect(customers.data.every((user) => user.type === 'Customer')).toBe(true)
    expect(admins.meta.admins).toBe(admins.data.length)
  })

  it('el filtro de actividad solo devuelve quien midió o compró', async () => {
    const active = await call('GET', '/admin/users', {
      auth: ADMIN,
      query: { active: 'true' },
    })

    expect(active.data.length).toBeGreaterThan(0)
    expect(active.data.every((user) => user.lastActivity !== null)).toBe(true)
  })

  it('los indicadores cuadran con el padrón', async () => {
    const result = await call('GET', '/admin/users/analytics', { auth: ADMIN })
    const db = getDb()

    expect(result.data.totalUsers).toBe(db.users.length)
    expect(result.data.admins + result.data.customers).toBe(result.data.totalUsers)
    expect(result.data.admins).toBe(db.users.filter((u) => u.type === 'Admin').length)
    expect(result.data.activeNow).toBeLessThanOrEqual(result.data.totalUsers)
    expect(result.data.activeRate).toBeGreaterThanOrEqual(0)

    // La tendencia cubre 12 meses, incluidos los vacíos.
    expect(result.data.signupsByMonth).toHaveLength(12)
    expect(result.data.signupsByMonth.every((row) => row.month && row.signups >= 0)).toBe(
      true,
    )
    const total = result.data.signupsByMonth.reduce((sum, row) => sum + row.signups, 0)
    expect(total).toBeGreaterThan(0)
  })

  it('otorga y revoca admin', async () => {
    const target = getDb().users.find((user) => user.id === 2)

    const granted = await call('PATCH', `/admin/users/${target.id}/role`, {
      auth: ADMIN,
      body: { type: 'Admin' },
    })
    expect(granted.status).toBe(200)
    expect(granted.data.type).toBe('Admin')
    expect(getDb().users.find((user) => user.id === 2).type).toBe('Admin')

    const revoked = await call('PATCH', `/admin/users/${target.id}/role`, {
      auth: ADMIN,
      body: { type: 'Customer' },
    })
    expect(revoked.data.type).toBe('Customer')
  })

  it('rechaza un rol inválido', async () => {
    await expect(
      call('PATCH', '/admin/users/2/role', { auth: ADMIN, body: { type: 'Root' } }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('no deja el panel sin administradores', async () => {
    // Se dejan dos admins y se degrada a uno; el último debe fallar.
    const db = getDb()
    for (const user of db.users) {
      if (user.type === 'Admin' && user.id !== 1) user.type = 'Customer'
    }

    await expect(
      call('PATCH', '/admin/users/1/role', { auth: ADMIN, body: { type: 'Customer' } }),
    ).rejects.toMatchObject({ status: 409, code: 'LAST_ADMIN' })
  })

  it('un admin no puede quitarse su propio acceso', async () => {
    // Con dos admins, la salvaguarda que aplica es la de auto-degradación.
    getDb().users.find((user) => user.id === 2).type = 'Admin'

    await expect(
      call('PATCH', '/admin/users/1/role', { auth: ADMIN, body: { type: 'Customer' } }),
    ).rejects.toMatchObject({ status: 409, code: 'CANNOT_DEMOTE_SELF' })
  })

  it('un cliente no puede ver el padrón ni cambiarse el rol', async () => {
    await expect(call('GET', '/admin/users', { auth: ANA })).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
    await expect(
      call('PATCH', '/admin/users/2/role', { auth: ANA, body: { type: 'Admin' } }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })
})
