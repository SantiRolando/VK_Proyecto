import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body, auth } = {}) {
  return handle({ method, url, query: {}, body: body ?? {}, auth, guestSessionId: null })
}

const ADMIN = { token: 'vkfit.1.test' }

describe('GET /admin/settings', () => {
  it('devuelve las reglas como DTO en camelCase', async () => {
    const result = await call('GET', '/admin/settings', { auth: ADMIN })

    expect(result.data).toEqual({
      successProbability: 30,
      pointsPerFeedback: 10,
      maxDailyFeedback: 5,
      coordinationEmail: 'ventas@vikinga.com.uy',
      coordinationWhatsapp: '+59899000000',
      staleSaleDays: 3,
    })
  })
})

describe('PATCH /admin/settings', () => {
  it('edita en bloque y persiste sobre SETTING', async () => {
    const result = await call('PATCH', '/admin/settings', {
      auth: ADMIN,
      body: {
        successProbability: 100,
        pointsPerFeedback: 25,
        coordinationEmail: ' hola@vk.test ',
      },
    })

    expect(result.data).toMatchObject({
      successProbability: 100,
      pointsPerFeedback: 25,
      coordinationEmail: 'hola@vk.test',
    })

    const stored = getDb().settings.find((item) => item.key === 'success_probability')
    expect(stored.value).toBe('100')
  })

  it('cambiar la probabilidad a 100 hace que todo feedback otorgue puntos', async () => {
    await call('PATCH', '/admin/settings', {
      auth: ADMIN,
      body: { successProbability: 100 },
    })

    // Generación 100 de Ana, sin calificar.
    const feedback = await call('PATCH', '/size-generations/100/feedback', {
      auth: { token: 'vkfit.2.test' },
      body: { rating: 'Correct' },
    })

    expect(feedback.data.reward).toMatchObject({ awarded: true, points: 10 })
  })

  it('valida rangos, claves desconocidas y cuerpo vacío', async () => {
    await expect(
      call('PATCH', '/admin/settings', {
        auth: ADMIN,
        body: { successProbability: 101 },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('PATCH', '/admin/settings', { auth: ADMIN, body: { nope: 1 } }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('PATCH', '/admin/settings', { auth: ADMIN, body: {} }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('requiere rol de administrador', async () => {
    await expect(
      call('GET', '/admin/settings', { auth: { token: 'vkfit.2.test' } }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })
})
