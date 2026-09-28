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

function sizeId(line, code) {
  const size = getDb().sizes.find((item) => item.line === line && item.code === code)
  return size.id
}

describe('catalog controller', () => {
  it('lista solo productos con unidades disponibles en el talle', async () => {
    const result = await call('GET', '/catalog', {
      query: { line: 'Jammer', sizeId: sizeId('Jammer', 'M') },
    })

    expect(result.status).toBe(200)
    expect(result.data.length).toBeGreaterThan(0)
    for (const product of result.data) {
      expect(product.line).toBe('Jammer')
      expect(product.variants.length).toBeGreaterThan(0)
      for (const variant of product.variants) {
        expect(variant.available).toBeGreaterThan(0)
      }
    }
    expect(result.meta).toMatchObject({
      line: 'Jammer',
      hasStock: true,
      size: { code: 'M' },
    })
    expect(result.meta.adjacentSizes.map((size) => size.code)).toEqual(['S', 'L'])
  })

  it('marca hasStock false y devuelve adyacentes para un talle sin stock', async () => {
    const result = await call('GET', '/catalog', {
      query: { line: 'Endurance', sizeId: sizeId('Endurance', 'M') },
    })

    expect(result.data).toEqual([])
    expect(result.meta.hasStock).toBe(false)
    expect(result.meta.adjacentSizes.map((size) => size.code)).toEqual(['S', 'L'])
  })

  it('no lista productos con stock pero sin unidades en el talle pedido', async () => {
    // Endurance M no tiene stock en ningún color: no debe aparecer ningún producto.
    const endurance = await call('GET', '/catalog', {
      query: { line: 'Endurance', sizeId: sizeId('Endurance', 'M') },
    })
    expect(endurance.data).toHaveLength(0)

    // En L sí hay productos.
    const enduranceL = await call('GET', '/catalog', {
      query: { line: 'Endurance', sizeId: sizeId('Endurance', 'L') },
    })
    expect(enduranceL.data.length).toBeGreaterThan(0)
  })

  it('exige sizeId', async () => {
    await expect(call('GET', '/catalog')).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    })
  })

  it('deriva la línea del talle cuando no se pasa line', async () => {
    const result = await call('GET', '/catalog', {
      query: { sizeId: sizeId('Sunga', 'XL') },
    })
    expect(result.meta.line).toBe('Sunga')
  })

  it('devuelve el detalle con colores y disponibilidad (agotados incluidos)', async () => {
    const product = getDb().products.find((item) => item.model === 'sunga-classic')
    const result = await call('GET', `/catalog/${product.id}`, {
      query: { sizeId: sizeId('Sunga', 'S') },
    })

    expect(result.data.model).toBe('sunga-classic')
    expect(result.data.selectedSize.code).toBe('S')

    const red = result.data.colors.find((color) => color.color === 'red')
    expect(red.available).toBe(0) // reservada por la venta sembrada
    const black = result.data.colors.find((color) => color.color === 'black')
    expect(black.available).toBeGreaterThan(0)
  })

  it('404 para un producto inexistente', async () => {
    await expect(call('GET', '/catalog/9999')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})

describe('alerts controller', () => {
  it('exige sesión para suscribirse', async () => {
    await expect(
      call('POST', '/restock-alerts', {
        body: { line: 'Endurance', sizeId: sizeId('Endurance', 'M') },
      }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' })
  })

  it('crea una alerta por variante y es idempotente', async () => {
    const line = 'Endurance'
    const id = sizeId('Endurance', 'M')
    const auth = { token: 'vkfit.3.test' } // cliente vacío

    const first = await call('POST', '/restock-alerts', {
      body: { line, sizeId: id },
      auth,
    })
    expect(first.status).toBe(201)
    expect(first.data.created).toBeGreaterThan(0)

    const variantCount = getDb().productVariants.filter(
      (variant) => variant.sizeId === id,
    ).length
    expect(first.data.created).toBe(variantCount)

    const second = await call('POST', '/restock-alerts', {
      body: { line, sizeId: id },
      auth,
    })
    expect(second.data.created).toBe(0)
  })

  it('agrupa las suscripciones por línea × talle y permite cancelarlas', async () => {
    const auth = { token: 'vkfit.2.test' } // Ana tiene la alerta sembrada de Endurance M
    const list = await call('GET', '/me/restock-alerts', { auth })

    expect(list.data).toHaveLength(1)
    const group = list.data[0]
    expect(group).toMatchObject({
      line: 'Endurance',
      size: { code: 'M' },
      status: 'Active',
    })
    expect(group.ids.length).toBe(group.variantCount)

    for (const id of group.ids) {
      await call('DELETE', `/me/restock-alerts/${id}`, { auth })
    }

    const after = await call('GET', '/me/restock-alerts', { auth })
    expect(after.data).toHaveLength(0)
  })

  it('no permite cancelar una alerta ajena', async () => {
    const ana = { token: 'vkfit.2.test' }
    const list = await call('GET', '/me/restock-alerts', { auth: ana })
    const alertId = list.data[0].ids[0]

    await expect(
      call('DELETE', `/me/restock-alerts/${alertId}`, {
        auth: { token: 'vkfit.3.test' },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
