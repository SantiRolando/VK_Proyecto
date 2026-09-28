import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body } = {}) {
  return handle({
    method,
    url,
    query: {},
    body: body ?? {},
    auth: undefined,
    guestSessionId: null,
  })
}

describe('dev controller', () => {
  it('reset re-siembra la base de datos', async () => {
    const before = getDb().users.length
    expect(before).toBe(3)

    await call('POST', '/dev/reset')
    expect(getDb().users.length).toBe(3)
    expect(getDb().users).toEqual(
      expect.arrayContaining([expect.objectContaining({ email: 'admin@vikinga.test' })]),
    )
  })

  it('login-as devuelve token y usuario sanitizado para un usuario sembrado', async () => {
    const result = await call('POST', '/dev/login-as', { body: { userId: 1 } })

    expect(result.status).toBe(200)
    expect(result.data.token).toMatch(/^vkfit\.1\./)
    expect(result.data.user).toMatchObject({ id: 1, type: 'Admin' })
    expect(result.data.user.password).toBeUndefined()
  })

  it('login-as con usuario inexistente devuelve 404', async () => {
    await expect(
      call('POST', '/dev/login-as', { body: { userId: 999 } }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
