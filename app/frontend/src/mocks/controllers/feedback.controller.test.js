import { getDb, mutate, resetDatabase } from '@mocks/db/database.js'
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

const ANA = { token: 'vkfit.2.test' }

function setSetting(key, value) {
  mutate((db) => {
    const setting = db.settings.find((item) => item.key === key)
    setting.value = String(value)
  })
}

function generationByGuest(sessionId) {
  return getDb().sizeGenerations.find((item) => item.guestSessionId === sessionId)
}

describe('feedback controller', () => {
  it('registra la calificación y otorga puntos cuando el sorteo acierta', async () => {
    setSetting('success_probability', 100)

    const result = await call('PATCH', '/fit/generations/100/feedback', {
      body: { rating: 'Correct', comment: '  Me quedó perfecto  ' },
      auth: ANA,
    })

    expect(result.status).toBe(200)
    expect(result.data.generation).toMatchObject({
      id: 100,
      rating: 'Correct',
      comment: 'Me quedó perfecto',
    })
    expect(result.data.generation.ratedAt).not.toBeNull()
    expect(result.data.reward).toEqual({
      awarded: true,
      points: 10,
      balance: 130,
      dailyLimitReached: false,
    })

    const stored = getDb().sizeGenerations.find((item) => item.id === 100)
    expect(stored.rating).toBe('Correct')
    expect(getDb().pointsMovements.at(-1)).toMatchObject({
      userId: 2,
      generationId: 100,
      points: 10,
      type: 'Feedback',
    })
  })

  it('guarda el feedback sin puntos cuando el sorteo falla', async () => {
    setSetting('success_probability', 0)

    const result = await call('PATCH', '/fit/generations/100/feedback', {
      body: { rating: 'Large' },
      auth: ANA,
    })

    expect(result.data.generation).toMatchObject({ rating: 'Large', comment: null })
    expect(result.data.reward).toEqual({
      awarded: false,
      points: 0,
      balance: 120,
      dailyLimitReached: false,
    })
    expect(getDb().users.find((user) => user.id === 2).pointsBalance).toBe(120)
  })

  it('respeta el tope diario: guarda el feedback pero no otorga puntos', async () => {
    setSetting('success_probability', 100)
    setSetting('max_daily_feedback', 1)
    mutate((db) => {
      db.pointsMovements.push({
        id: 900,
        userId: 2,
        generationId: 999,
        couponId: null,
        points: 10,
        type: 'Feedback',
        createdAt: new Date().toISOString(),
      })
    })

    const result = await call('PATCH', '/fit/generations/100/feedback', {
      body: { rating: 'Small' },
      auth: ANA,
    })

    expect(result.data.generation.rating).toBe('Small')
    expect(result.data.reward).toEqual({
      awarded: false,
      points: 0,
      balance: 120,
      dailyLimitReached: true,
    })
  })

  it('rechaza calificar dos veces la misma generación', async () => {
    // La generación 101 ya está calificada en el seed.
    await expect(
      call('PATCH', '/fit/generations/101/feedback', {
        body: { rating: 'Correct' },
        auth: ANA,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'ALREADY_RATED' })
  })

  it('permite calificar al invitado, sin puntos (Q-15)', async () => {
    const guest = generationByGuest('guest-demo-1')

    const result = await call('PATCH', `/fit/generations/${guest.id}/feedback`, {
      body: { rating: 'Correct' },
      guestSessionId: 'guest-demo-1',
    })

    expect(result.data.generation.rating).toBe('Correct')
    expect(result.data.reward).toEqual({
      awarded: false,
      points: 0,
      balance: 0,
      dailyLimitReached: false,
    })
  })

  it('valida la calificación y el dueño', async () => {
    await expect(
      call('PATCH', '/fit/generations/100/feedback', {
        body: { rating: 'Huge' },
        auth: ANA,
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    // La generación 104 es de otro cliente.
    await expect(
      call('PATCH', '/fit/generations/104/feedback', {
        body: { rating: 'Correct' },
        auth: ANA,
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
