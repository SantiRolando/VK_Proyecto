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

const GUEST_ID = '5f0c1a2e-8f7b-4c1d-9e3a-2b6d8c4f1a90'
const OTHER_GUEST_ID = '5f0c1a2e-8f7b-4c1d-9e3a-2b6d8c4f1a91'

const GUEST_MEASURES = {
  line: 'ENDURANCE',
  audience: 'ADULT',
  height: 168,
  bust: 85,
  waist: 67,
  hip: 94,
  torso: 141,
  source: 'QR',
}

describe('POST /public/fit/recommend', () => {
  it('crea una generación de invitado con talle, adyacentes y stock', async () => {
    const result = await call('POST', '/public/fit/recommend', {
      body: GUEST_MEASURES,
      guestSessionId: GUEST_ID,
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      guestSessionId: GUEST_ID,
      outcome: 'DIRECT',
      suggestedSize: { code: 'M', sortOrder: 3, line: 'ENDURANCE', audience: 'ADULT' },
      warnings: [],
      stockAvailable: false, // Endurance M sin stock
    })
    expect(result.data.adjacentSizes.map((size) => size.code)).toEqual(['S', 'L'])

    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored).toMatchObject({
      guestSessionId: GUEST_ID,
      customerId: null,
      source: 'QR',
    })
  })

  it('genera un guestSessionId cuando el invitado no manda ninguno', async () => {
    const result = await call('POST', '/public/fit/recommend', { body: GUEST_MEASURES })
    expect(result.data.guestSessionId).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('asocia la generación al usuario autenticado y marca stock disponible', async () => {
    const result = await call('POST', '/public/fit/recommend', {
      body: { ...GUEST_MEASURES, line: 'SUNGA', waist: 80, hip: 88 },
      auth: { token: 'vkfit.2.test' },
    })

    expect(result.data.suggestedSize.code).toBe('S')
    expect(result.data.stockAvailable).toBe(true)
    expect(result.data.guestSessionId).toBeNull()

    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored.customerId).toBe(2)
  })

  it('deriva (REFERRED, sin talle) cuando las medidas exceden la tabla', async () => {
    const result = await call('POST', '/public/fit/recommend', {
      body: { ...GUEST_MEASURES, line: 'JAMMER', waist: 110, hip: 115 },
      guestSessionId: GUEST_ID,
    })
    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      outcome: 'REFERRED',
      referralReason: 'MEASURE_ABOVE_TABLE',
      adjacentSizes: [],
    })
    expect(result.data.suggestedSize ?? null).toBeNull()
  })

  it('niñas Endurance: solo edad; varones con edad orientativa', async () => {
    const girl = await call('POST', '/public/fit/recommend', {
      body: { line: 'ENDURANCE', audience: 'KIDS', age: 7 },
      guestSessionId: GUEST_ID,
    })
    expect(girl.data.suggestedSize.code).toBe('M')

    const boy = await call('POST', '/public/fit/recommend', {
      body: { line: 'JAMMER', audience: 'KIDS', waist: 67, hip: 80, age: 10 },
      guestSessionId: GUEST_ID,
    })
    expect(boy.data).toMatchObject({
      outcome: 'WITH_WARNING',
      suggestedSize: { code: '12' },
      warnings: ['AGE_OUTSIDE_SIZE_RANGE'],
    })
  })

  it('responde 400 sin tabla (SOFT KIDS), sin medida activa o con campos inválidos', async () => {
    await expect(
      call('POST', '/public/fit/recommend', {
        body: { line: 'SOFT', audience: 'KIDS', bust: 80, waist: 65 },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' })

    await expect(
      call('POST', '/public/fit/recommend', {
        body: { line: 'ENDURANCE', audience: 'ADULT', bust: 85 },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
      details: { message: 'waist is required' },
    })

    await expect(
      call('POST', '/public/fit/recommend', { body: { line: 'BIKINI' } }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' })
  })

  it('toma las medidas del perfil propio y rechaza uno ajeno', async () => {
    const result = await call('POST', '/public/fit/recommend', {
      body: { line: 'ENDURANCE', audience: 'ADULT', profileId: 1 },
      auth: { token: 'vkfit.2.test' },
    })
    expect(result.data.suggestedSize.code).toBe('L') // Training: busto 90, cintura 72

    await expect(
      call('POST', '/public/fit/recommend', {
        body: { line: 'ENDURANCE', audience: 'ADULT', profileId: 1 },
        auth: { token: 'vkfit.3.test' },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})

describe('GET /public/fit/generations/:id y /fit/generations', () => {
  it('expone el resultado al dueño (invitado por sesión o cliente) y a un admin', async () => {
    const created = await call('POST', '/public/fit/recommend', {
      body: GUEST_MEASURES,
      guestSessionId: GUEST_ID,
    })
    const id = created.data.id

    const owner = await call('GET', `/public/fit/generations/${id}`, {
      guestSessionId: GUEST_ID,
    })
    expect(owner.data.id).toBe(id)

    const viaQuery = await call('GET', `/public/fit/generations/${id}`, {
      query: { guestSessionId: GUEST_ID },
    })
    expect(viaQuery.data.id).toBe(id)

    await expect(
      call('GET', `/public/fit/generations/${id}`, { guestSessionId: OTHER_GUEST_ID }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    const admin = await call('GET', `/public/fit/generations/${id}`, {
      auth: { token: 'vkfit.1.test' },
    })
    expect(admin.data.id).toBe(id)
  })

  it('pagina el historial del usuario, de la más reciente a la más antigua', async () => {
    await expect(call('GET', '/fit/generations')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })

    const result = await call('GET', '/fit/generations', {
      auth: { token: 'vkfit.2.test' },
      query: { page: 1, size: 5 },
    })
    expect(result.data).toMatchObject({ page: 1, size: 5 })
    expect(result.data.items).toHaveLength(5)
    expect(result.data.totalElements).toBeGreaterThan(5)
    expect(result.data.items[0]).toMatchObject({
      customerId: 2,
      line: 'ENDURANCE',
      audience: 'ADULT',
      outcome: 'DIRECT',
      suggestedSizeCode: 'L',
    })
    const dates = result.data.items.map((item) => new Date(item.createdAt).getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)

    const detail = await call('GET', `/fit/generations/${result.data.items[0].id}`, {
      auth: { token: 'vkfit.2.test' },
    })
    expect(detail.data.id).toBe(result.data.items[0].id)
  })

  it('expone /public/sizes con rangos, filtrado por línea y público', async () => {
    const all = await call('GET', '/public/sizes')
    // 7 Endurance + 7 Soft + 6 Jammer + 6 Sunga adultos, 3 + 3 varones, 4 niñas
    expect(all.data).toHaveLength(36)

    const endurance = await call('GET', '/public/sizes', {
      query: { line: 'ENDURANCE', audience: 'ADULT' },
    })
    expect(endurance.data).toHaveLength(7)
    expect(endurance.data[0]).toMatchObject({
      line: 'ENDURANCE',
      audience: 'ADULT',
      code: 'XS',
      bustMin: 74.9,
      waistMax: 64.77,
      hipMin: null,
    })

    const girls = await call('GET', '/public/sizes', {
      query: { line: 'ENDURANCE', audience: 'KIDS' },
    })
    expect(girls.data.map((size) => size.code)).toEqual(['S', 'M', 'L', 'XL'])
    expect(girls.data[0]).toMatchObject({ ageMin: 5, ageMax: 6, bustMin: null })
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
    const result = await call('POST', '/public/fit/recommend', {
      body: { ...GUEST_MEASURES, onBehalf: true },
      auth: ADMIN,
    })

    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored).toMatchObject({ adminId: 1, customerId: null, guestSessionId: null })

    const adminHistory = await call('GET', '/fit/generations', { auth: ADMIN })
    expect(adminHistory.data.items.some((item) => item.id === result.data.id)).toBe(false)

    const detail = await call('GET', `/fit/generations/${result.data.id}`, {
      auth: ADMIN,
    })
    expect(detail.data.adminId).toBe(1)
  })

  it('vinculada a un cliente: aparece en su historial; el perfil siempre es propio', async () => {
    const result = await call('POST', '/public/fit/recommend', {
      body: { ...GUEST_MEASURES, onBehalf: true, customerId: 2 },
      auth: ADMIN,
    })

    const stored = getDb().sizeGenerations.find((item) => item.id === result.data.id)
    expect(stored).toMatchObject({ adminId: 1, customerId: 2, profileId: null })

    // `profileId` es un perfil del usuario autenticado, no del cliente vinculado.
    await expect(
      call('POST', '/public/fit/recommend', {
        body: { ...GUEST_MEASURES, onBehalf: true, customerId: 2, profileId: 1 },
        auth: ADMIN,
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    const history = await call('GET', '/fit/generations', { auth: ANA })
    expect(history.data.items.some((item) => item.id === result.data.id)).toBe(true)
  })

  it('solo el personal puede generar para terceros', async () => {
    await expect(
      call('POST', '/public/fit/recommend', {
        body: { ...GUEST_MEASURES, onBehalf: true },
        auth: ANA,
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })

    await expect(
      call('POST', '/public/fit/recommend', {
        body: { ...GUEST_MEASURES, customerId: 2 },
        auth: ANA,
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })

    // Sin sesión no hay perfil ni modo asistente.
    await expect(
      call('POST', '/public/fit/recommend', {
        body: { ...GUEST_MEASURES, profileId: 1 },
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' })
  })
})
