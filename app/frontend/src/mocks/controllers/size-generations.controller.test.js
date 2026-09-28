import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import { beforeEach, describe, expect, it } from 'vitest'
import '@mocks/controllers/register-all.js'

beforeEach(() => {
  resetDatabase()
  configureMockRouter({ latencyMs: '0', failRate: 0 })
})

function call(method, url, { body, auth, guestSessionId, query } = {}) {
  return handle({
    method,
    url,
    query: query ?? {},
    body: body ?? {},
    auth,
    guestSessionId: guestSessionId ?? null,
  })
}

const GUEST_MEASURES = {
  line: 'Endurance',
  height: 168,
  bust: 85,
  waist: 67,
  hip: 94,
  torso: 141,
  source: 'QR',
}

describe('size-generations controller', () => {
  it('crea una generación para invitado con talle, dominante y adyacentes', async () => {
    const result = await call('POST', '/size-generations', {
      body: GUEST_MEASURES,
      guestSessionId: 'guest-us1-1',
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      line: 'Endurance',
      suggestedSize: { code: 'M', sortOrder: 3 },
      dominantMeasure: 'bust',
      rating: null,
    })
    expect(result.data.adjacentSizes.map((size) => size.code)).toEqual(['S', 'L'])
    expect(result.data.stockAvailableAtQuery).toBe(false) // Endurance M sin stock

    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored.guestSessionId).toBe('guest-us1-1')
    expect(stored.customerId).toBeNull()
    expect(stored.source).toBe('QR')
  })

  it('asocia la generación al usuario autenticado', async () => {
    const result = await call('POST', '/size-generations', {
      body: { ...GUEST_MEASURES, line: 'Sunga', waist: 80, hip: 88 },
      auth: { token: 'vkfit.2.test' },
    })

    expect(result.data.suggestedSize.code).toBe('S')
    // Sunga S tiene stock en otros colores (solo la variante roja de 1 unidad
    // está reservada por la venta sembrada).
    expect(result.data.stockAvailableAtQuery).toBe(true)

    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored.customerId).toBe(2)
    expect(stored.guestSessionId).toBeNull()
  })

  it('marca stock disponible cuando hay variantes con unidades', async () => {
    const result = await call('POST', '/size-generations', {
      body: { ...GUEST_MEASURES, line: 'Jammer', waist: 86, hip: 93 },
      guestSessionId: 'guest-us1-2',
    })
    expect(result.data.suggestedSize.code).toBe('M')
    expect(result.data.stockAvailableAtQuery).toBe(true)
  })

  it('devuelve OUT_OF_RANGE con detalles cuando las medidas exceden la tabla', async () => {
    await expect(
      call('POST', '/size-generations', {
        body: { ...GUEST_MEASURES, line: 'Jammer', waist: 110, hip: 115 },
        guestSessionId: 'guest-us1-3',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'OUT_OF_RANGE',
      details: { measure: 'waist', direction: 'above' },
    })
  })

  it('valida campos obligatorios con 422', async () => {
    await expect(
      call('POST', '/size-generations', { body: { line: 'Endurance' } }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('expone el detalle solo al dueño (guest o cliente)', async () => {
    const created = await call('POST', '/size-generations', {
      body: GUEST_MEASURES,
      guestSessionId: 'guest-us1-4',
    })
    const id = created.data.id

    const owner = await call('GET', `/size-generations/${id}`, {
      guestSessionId: 'guest-us1-4',
    })
    expect(owner.data.id).toBe(id)

    // Otro invitado no puede verlo.
    await expect(
      call('GET', `/size-generations/${id}`, { guestSessionId: 'otro-guest' }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  it('lista el historial solo para usuarios autenticados', async () => {
    await expect(call('GET', '/size-generations')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })

    const result = await call('GET', '/size-generations', {
      auth: { token: 'vkfit.2.test' },
    })
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('expone /sizes filtrado por línea', async () => {
    const all = await call('GET', '/sizes')
    // 7 Endurance + 7 Soft + 6 Jammer + 6 Sunga + 7 Kids (3 varones + 4 niñas)
    expect(all.data).toHaveLength(33)

    const endurance = await call('GET', '/sizes', { query: { line: 'Endurance' } })
    expect(endurance.data).toHaveLength(7)
    expect(endurance.data[0]).toMatchObject({ line: 'Endurance', code: 'XS' })
  })

  it('expone el contacto público desde SETTING', async () => {
    const result = await call('GET', '/public/contact')
    expect(result.data).toEqual({
      email: 'ventas@vikinga.com.uy',
      whatsapp: '+59899000000',
    })
  })
})

describe('modo asistente (US12)', () => {
  const ADMIN = { token: 'vkfit.1.test' }
  const ANA = { token: 'vkfit.2.test' }

  it('genera para un tercero sin vincular: queda fuera del historial personal', async () => {
    const result = await call('POST', '/size-generations', {
      body: { ...GUEST_MEASURES, onBehalf: true },
      auth: ADMIN,
    })

    expect(result.data.onBehalf).toBe(true)
    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored).toMatchObject({ adminId: 1, customerId: null, guestSessionId: null })

    // El historial personal del admin no la incluye.
    const adminHistory = await call('GET', '/size-generations', { auth: ADMIN })
    expect(adminHistory.data.some((item) => item.id === result.data.id)).toBe(false)

    // Pero el admin que la generó sí puede ver el detalle.
    const detail = await call('GET', `/size-generations/${result.data.id}`, {
      auth: ADMIN,
    })
    expect(detail.data.id).toBe(result.data.id)
  })

  it('vinculada a un cliente: aparece en su historial y acepta su perfil', async () => {
    const result = await call('POST', '/size-generations', {
      body: { ...GUEST_MEASURES, onBehalf: true, customerId: 2, profileId: 1 },
      auth: ADMIN,
    })

    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored).toMatchObject({ adminId: 1, customerId: 2, profileId: 1 })

    const history = await call('GET', '/size-generations', { auth: ANA })
    expect(history.data.some((item) => item.id === result.data.id)).toBe(true)

    // El perfil debe ser del cliente vinculado, no de otro.
    await expect(
      call('POST', '/size-generations', {
        body: { ...GUEST_MEASURES, onBehalf: true, customerId: 3, profileId: 1 },
        auth: ADMIN,
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  it('solo el personal puede generar para terceros', async () => {
    await expect(
      call('POST', '/size-generations', {
        body: { ...GUEST_MEASURES, onBehalf: true },
        auth: ANA,
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })

    // Vincular un cliente sin `onBehalf` no tiene sentido.
    await expect(
      call('POST', '/size-generations', {
        body: { ...GUEST_MEASURES, customerId: 2 },
        auth: ANA,
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })
})
