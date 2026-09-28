import { getDb, resetDatabase } from '@mocks/db/database.js'
import { findVariant } from '@mocks/db/seed/catalog.js'
import { availableQuantity } from '@mocks/domain/stock.js'
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

function variant(model, sizeCode, color) {
  const db = getDb()
  return findVariant(db.sizes, db.products, db.productVariants, model, sizeCode, color)
}

function saleById(id) {
  return getDb().sales.find((sale) => sale.id === id)
}

describe('admin sales — acceso', () => {
  it('exige sesión de administrador', async () => {
    await expect(call('GET', '/admin/sales')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })

    // Un cliente no puede entrar al panel.
    await expect(call('GET', '/admin/sales', { auth: ANA })).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })

    await expect(call('GET', '/admin/sales', { auth: ADMIN })).resolves.toMatchObject({
      status: 200,
    })
  })
})

describe('admin sales — listado', () => {
  it('devuelve todas las ventas, de la más antigua a la más nueva, con total', async () => {
    const result = await call('GET', '/admin/sales', { auth: ADMIN })

    expect(result.status).toBe(200)
    expect(result.meta).toMatchObject({ page: 1, total: 5 })
    expect(result.data).toHaveLength(5)
    expect(result.data[0].id).toBe(4) // díasAgo(9)
    expect(result.data.at(-1).id).toBe(5) // hoy

    // Cada venta trae lo que necesita el admin para coordinar (T069).
    expect(result.data[0]).toMatchObject({
      status: 'Cancelled',
      channel: 'Whatsapp',
      deliveryMethod: 'HomeDelivery',
      customer: { name: 'Ana Rodríguez', whatsappPhone: '+59899000002' },
    })
    expect(result.data[0].lines[0].product.model).toBe('endurance-classic')
  })

  it('informa qué acciones admite cada estado', async () => {
    const result = await call('GET', '/admin/sales', { auth: ADMIN })
    const byId = Object.fromEntries(result.data.map((sale) => [sale.id, sale]))

    // Pendiente: contactar o cancelar. Contactada: confirmar o cancelar.
    expect(byId[1].allowedTransitions).toEqual(['Contacted', 'Cancelled'])
    expect(byId[2].allowedTransitions).toEqual(['Confirmed', 'Cancelled'])
    // Cerradas: ninguna.
    expect(byId[3].allowedTransitions).toEqual([])
    expect(byId[4].allowedTransitions).toEqual([])
  })

  it('filtra por estado y por canal', async () => {
    const pending = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { status: 'PendingCoordination' },
    })
    expect(pending.data).toHaveLength(2)
    for (const sale of pending.data) expect(sale.status).toBe('PendingCoordination')

    const whatsapp = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { channel: 'Whatsapp' },
    })
    expect(whatsapp.data).toHaveLength(3)
    for (const sale of whatsapp.data) expect(sale.channel).toBe('Whatsapp')

    const combined = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { status: 'Contacted', channel: 'Email' },
    })
    expect(combined.data).toHaveLength(0)
  })

  it('filtra por rango de fechas (el día «hasta» entra completo)', async () => {
    const sale5 = saleById(5)

    // Un rango con los límites exactos incluye esa venta (bordes inclusivos).
    const exact = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { from: sale5.createdAt, to: sale5.createdAt },
    })
    expect(exact.data.map((sale) => sale.id)).toEqual([5])

    // Una fecha sin hora cubre el día completo: si `to` se tomara como
    // medianoche, la venta de ese día quedaría afuera.
    const day = sale5.createdAt.slice(0, 10)
    const thatDay = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { from: day, to: day },
    })
    expect(thatDay.data.map((sale) => sale.id)).toContain(5)

    const lastTwoDays = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { from: new Date(Date.now() - 2 * 86_400_000).toISOString() },
    })
    expect(lastTwoDays.data.map((sale) => sale.id)).toEqual([1, 5])
  })

  it('pagina el listado', async () => {
    const first = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { pageSize: 2 },
    })
    expect(first.data).toHaveLength(2)
    expect(first.meta).toMatchObject({ page: 1, pageSize: 2, total: 5 })

    const third = await call('GET', '/admin/sales', {
      auth: ADMIN,
      query: { pageSize: 2, page: 3 },
    })
    expect(third.data).toHaveLength(1)
    expect(third.meta).toMatchObject({ page: 3, total: 5 })
  })

  it('marca como antigua la venta abierta que pasó el umbral', async () => {
    const result = await call('GET', '/admin/sales', { auth: ADMIN })
    const byId = Object.fromEntries(result.data.map((sale) => [sale.id, sale]))

    // La venta 2 (Contacted, 4 días) supera los 3 días por defecto.
    expect(byId[2].isStale).toBe(true)
    expect(byId[2].ageDays).toBe(4)
    expect(byId[1].isStale).toBe(false)
    // Confirmadas y canceladas ya no retienen stock: nunca son «antiguas».
    expect(byId[3].isStale).toBe(false)
    expect(byId[4].isStale).toBe(false)

    // El umbral es configurable (SETTING).
    getDb().settings.find((item) => item.key === 'stale_sale_days').value = '30'
    const relaxed = await call('GET', '/admin/sales', { auth: ADMIN })
    expect(relaxed.data.every((sale) => sale.isStale === false)).toBe(true)
  })
})

describe('admin sales — detalle', () => {
  it('devuelve la venta pedida y 404 si no existe', async () => {
    const result = await call('GET', '/admin/sales/1', { auth: ADMIN })
    expect(result.status).toBe(200)
    expect(result.data).toMatchObject({
      id: 1,
      status: 'PendingCoordination',
      channel: 'Email',
      total: 1290,
    })
    expect(result.data.address).toBeNull()

    await expect(call('GET', '/admin/sales/999', { auth: ADMIN })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})

describe('admin sales — transiciones', () => {
  it('valida el estado destino', async () => {
    await expect(
      call('PATCH', '/admin/sales/1/status', { auth: ADMIN, body: {} }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('PATCH', '/admin/sales/1/status', {
        auth: ADMIN,
        body: { status: 'PendingCoordination' },
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('PATCH', '/admin/sales/999/status', {
        auth: ADMIN,
        body: { status: 'Contacted' },
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  it('pasa de pendiente a contactada sellando la fecha', async () => {
    const result = await call('PATCH', '/admin/sales/1/status', {
      auth: ADMIN,
      body: { status: 'Contacted' },
    })

    expect(result.data).toMatchObject({ id: 1, status: 'Contacted' })
    expect(result.data.contactedAt).toBeTruthy()
    expect(saleById(1).status).toBe('Contacted')
    // Contactar no toca el stock: la reserva sigue igual.
    expect(getDb().transactions).toHaveLength(4)
  })

  it('confirmar descuenta el físico y registra el movimiento SaleConfirmed', async () => {
    const target = variant('soft-classic', 'S', 'blue')
    const physicalBefore = getDb().productVariants.find(
      (item) => item.id === target.id,
    ).quantity
    const availableBefore = availableQuantity(getDb(), target.id)
    // La venta 2 (Contacted) reserva esa variante.
    expect(target.id).toBe(getDb().saleLines.find((line) => line.saleId === 2).variantId)

    const result = await call('PATCH', '/admin/sales/2/status', {
      auth: ADMIN,
      body: { status: 'Confirmed' },
    })

    expect(result.data).toMatchObject({ id: 2, status: 'Confirmed' })
    expect(result.data.confirmedAt).toBeTruthy()

    const variantAfter = getDb().productVariants.find((item) => item.id === target.id)
    expect(variantAfter.quantity).toBe(physicalBefore - 1)

    // El disponible no cambia: la reserva se convierte en descuento físico.
    expect(availableQuantity(getDb(), target.id)).toBe(availableBefore)

    const transaction = getDb().transactions.at(-1)
    expect(transaction).toMatchObject({
      userId: 1,
      saleId: 2,
      direction: 'Outbound',
      reason: 'SaleConfirmed',
    })
    expect(
      getDb().transactionLines.filter((line) => line.transactionId === transaction.id),
    ).toEqual([expect.objectContaining({ variantId: target.id, quantity: 1 })])
  })

  it('cancelar libera la reserva al instante y devuelve el uso del cupón', async () => {
    const target = variant('soft-classic', 'S', 'blue')
    const physicalBefore = getDb().productVariants.find(
      (item) => item.id === target.id,
    ).quantity
    const availableBefore = availableQuantity(getDb(), target.id)
    expect(saleById(2).couponId).toBe(3)
    expect(getDb().discountCoupons.find((item) => item.id === 3).usageCount).toBe(1)

    const result = await call('PATCH', '/admin/sales/2/status', {
      auth: ADMIN,
      body: { status: 'Cancelled' },
    })

    expect(result.data.status).toBe('Cancelled')
    expect(result.data.cancelledAt).toBeTruthy()

    // La reserva era derivada: el físico no se toca y el disponible vuelve solo.
    expect(getDb().productVariants.find((item) => item.id === target.id).quantity).toBe(
      physicalBefore,
    )
    expect(availableQuantity(getDb(), target.id)).toBe(availableBefore + 1)
    expect(getDb().discountCoupons.find((item) => item.id === 3).usageCount).toBe(0)
    // Cancelar no genera movimiento de stock.
    expect(getDb().transactions).toHaveLength(4)
  })

  it('rechaza transiciones inválidas sin escribir nada', async () => {
    // Pendiente → Confirmada no está permitido (Q-04: solo desde Contactado).
    await expect(
      call('PATCH', '/admin/sales/1/status', {
        auth: ADMIN,
        body: { status: 'Confirmed' },
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'INVALID_TRANSITION',
      details: { from: 'PendingCoordination', to: 'Confirmed' },
    })
    expect(saleById(1).status).toBe('PendingCoordination')

    // Confirmada → Cancelada tampoco.
    await expect(
      call('PATCH', '/admin/sales/3/status', {
        auth: ADMIN,
        body: { status: 'Cancelled' },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'INVALID_TRANSITION' })
    expect(saleById(3).status).toBe('Confirmed')

    // Contactada → Contactada tampoco.
    await expect(
      call('PATCH', '/admin/sales/2/status', {
        auth: ADMIN,
        body: { status: 'Contacted' },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'INVALID_TRANSITION' })
  })

  it('cancela una venta recién creada y da de baja el uso del cupón', async () => {
    // Recorrido cruzado: la compra de US4 y su cancelación en US7.
    const target = variant('endurance-classic', 'L', 'black')
    const coupon = getDb().discountCoupons.find((item) => item.couponCode === 'VIKI10')
    const usageBefore = coupon.usageCount

    const created = await call('POST', '/sales', {
      auth: ANA,
      body: {
        items: [{ variantId: target.id, quantity: 1 }],
        channel: 'Email',
        deliveryMethod: 'StorePickup',
        couponCode: 'VIKI10',
      },
    })
    expect(coupon.usageCount).toBe(usageBefore + 1)

    const cancelled = await call('PATCH', `/admin/sales/${created.data.id}/status`, {
      auth: ADMIN,
      body: { status: 'Cancelled' },
    })

    expect(cancelled.data.status).toBe('Cancelled')
    expect(coupon.usageCount).toBe(usageBefore)
  })
})
