import { getDb, resetDatabase } from '@mocks/db/database.js'
import { findVariant } from '@mocks/db/seed/catalog.js'
import { availableQuantity, reservedQuantity } from '@mocks/domain/stock.js'
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

const ANA = { token: 'vkfit.2.test' } // cliente con perfiles, direcciones y puntos
const OTHER = { token: 'vkfit.3.test' } // cliente vacío

function variant(model, sizeCode, color) {
  const db = getDb()
  return findVariant(db.sizes, db.products, db.productVariants, model, sizeCode, color)
}

function createSale(body, auth = ANA) {
  return call('POST', '/sales', { body, auth })
}

describe('sales controller — crear venta', () => {
  it('exige sesión', async () => {
    await expect(
      call('POST', '/sales', {
        body: {
          items: [{ variantId: 1, quantity: 1 }],
          channel: 'Email',
          deliveryMethod: 'StorePickup',
        },
      }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' })
  })

  it('valida items, canal y método de entrega', async () => {
    const base = {
      items: [{ variantId: variant('endurance-classic', 'L', 'black').id, quantity: 1 }],
    }

    await expect(
      createSale({ ...base, channel: 'Sms', deliveryMethod: 'StorePickup' }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      createSale({ ...base, channel: 'Email', deliveryMethod: 'Drone' }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      createSale({ ...base, channel: 'Email', deliveryMethod: 'StorePickup' }),
    ).resolves.toMatchObject({ status: 201 })

    await expect(
      createSale({ items: [], channel: 'Email', deliveryMethod: 'StorePickup' }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      createSale({
        items: [{ variantId: 0, quantity: 0 }],
        channel: 'Email',
        deliveryMethod: 'StorePickup',
      }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('crea la venta en PendingCoordination y reserva el stock', async () => {
    const target = variant('endurance-classic', 'L', 'black')
    const availableBefore = availableQuantity(getDb(), target.id)
    const physicalBefore = getDb().productVariants.find(
      (item) => item.id === target.id,
    ).quantity

    const result = await createSale({
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'StorePickup',
    })

    expect(result.status).toBe(201)
    expect(result.data).toMatchObject({
      status: 'PendingCoordination',
      channel: 'Email',
      deliveryMethod: 'StorePickup',
      reservedUntil: null,
      address: null,
      discount: 0,
    })
    expect(result.data.lines).toHaveLength(1)
    expect(result.data.lines[0]).toMatchObject({
      variantId: target.id,
      quantity: 1,
      unitPrice: 1290,
      lineTotal: 1290,
      color: 'black',
      size: { code: 'L' },
    })
    expect(result.data.total).toBe(1290)

    // Reserva derivada: el físico no cambia, el disponible baja.
    expect(getDb().productVariants.find((item) => item.id === target.id).quantity).toBe(
      physicalBefore,
    )
    expect(reservedQuantity(getDb(), target.id)).toBe(1)
    expect(availableQuantity(getDb(), target.id)).toBe(availableBefore - 1)
  })

  it('devuelve el mensaje de coordinación del canal elegido', async () => {
    const target = variant('endurance-classic', 'L', 'black')

    const email = await createSale({
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'StorePickup',
    })
    expect(email.data.contact.channel).toBe('Email')
    expect(email.data.contact.to).toBe('ventas@vikinga.com.uy')
    expect(email.data.contact.url.startsWith('mailto:')).toBe(true)

    const whatsapp = await createSale({
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Whatsapp',
      deliveryMethod: 'StorePickup',
      locale: 'en',
    })
    expect(whatsapp.data.contact.channel).toBe('Whatsapp')
    expect(whatsapp.data.contact.to).toBe('+59899000000')
    expect(whatsapp.data.contact.url.startsWith('https://wa.me/59899000000?text=')).toBe(
      true,
    )
    expect(whatsapp.data.contact.subject).toBeNull()
    expect(whatsapp.data.contact.body).toContain('Store pickup')
  })

  it('no pierde nada si el stock se agotó (409 con detalle)', async () => {
    // La venta sembrada 5 (de otro cliente) reserva la única unidad.
    const soldOut = variant('sunga-classic', 'S', 'red')
    const salesBefore = getDb().sales.length
    const saleLinesBefore = getDb().saleLines.length
    const coupon = getDb().discountCoupons.find((item) => item.couponCode === 'VIKI10')
    const usageBefore = coupon.usageCount

    await expect(
      createSale({
        items: [{ variantId: soldOut.id, quantity: 1 }],
        channel: 'Email',
        deliveryMethod: 'StorePickup',
        couponCode: 'VIKI10',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'STOCK_INSUFFICIENT',
      details: { variantId: soldOut.id, available: 0, requested: 1 },
    })

    // Nada se escribió: ni venta, ni líneas, ni consumo del cupón.
    expect(getDb().sales).toHaveLength(salesBefore)
    expect(getDb().saleLines).toHaveLength(saleLinesBefore)
    expect(
      getDb().discountCoupons.find((item) => item.couponCode === 'VIKI10').usageCount,
    ).toBe(usageBefore)
  })

  it('agrupa ítems repetidos antes de validar el stock', async () => {
    const target = variant('soft-classic', 'M', 'green')
    getDb().productVariants.find((item) => item.id === target.id).quantity = 1

    await expect(
      createSale({
        items: [
          { variantId: target.id, quantity: 1 },
          { variantId: target.id, quantity: 1 },
        ],
        channel: 'Email',
        deliveryMethod: 'StorePickup',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'STOCK_INSUFFICIENT',
      details: { variantId: target.id, available: 1, requested: 2 },
    })
  })

  it('ignora la dirección con retiro en local y la resuelve con envío', async () => {
    const first = variant('endurance-classic', 'L', 'black')
    const second = variant('soft-classic', 'M', 'green')

    const pickup = await createSale({
      items: [{ variantId: first.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'StorePickup',
      addressId: 1,
    })
    expect(pickup.data.address).toBeNull()

    const delivery = await createSale({
      items: [{ variantId: second.id, quantity: 2 }],
      channel: 'Whatsapp',
      deliveryMethod: 'HomeDelivery',
      addressId: 1,
    })
    expect(delivery.data.address).toMatchObject({
      street: 'Av. Italia',
      city: 'Montevideo',
    })
    expect(delivery.data.contact.body).toContain('Av. Italia')
    expect(delivery.data.contact.body).toContain('Envío a domicilio')
  })

  it('exige una dirección propia para el envío a domicilio', async () => {
    const target = variant('endurance-classic', 'L', 'black')
    const body = {
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'HomeDelivery',
    }

    await expect(createSale(body)).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { fields: ['addressId'] },
    })

    // La dirección 1 es de Ana, no de este cliente.
    await expect(createSale({ ...body, addressId: 1 }, OTHER)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })

  it('aplica el cupón vigente y consume su uso', async () => {
    const target = variant('endurance-classic', 'L', 'black')
    const coupon = getDb().discountCoupons.find((item) => item.couponCode === 'VIKI10')
    const usageBefore = coupon.usageCount

    const result = await createSale({
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'StorePickup',
      couponCode: 'viki10',
    })

    expect(result.data.coupon).toMatchObject({ code: 'VIKI10' })
    expect(result.data.subtotal).toBe(1290)
    expect(result.data.discount).toBe(129)
    expect(result.data.total).toBe(1161)
    expect(result.data.contact.body).toContain('Descuento (VIKI10)')
    expect(
      getDb().discountCoupons.find((item) => item.couponCode === 'VIKI10').usageCount,
    ).toBe(usageBefore + 1)
  })

  it('rechaza cupón inexistente, vencido o de otro dueño', async () => {
    const target = variant('endurance-classic', 'L', 'black')
    const body = {
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'StorePickup',
    }

    await expect(createSale({ ...body, couponCode: 'NOEXISTE' })).rejects.toMatchObject({
      status: 422,
      code: 'COUPON_INVALID',
    })
    await expect(createSale({ ...body, couponCode: 'VERANO15' })).rejects.toMatchObject({
      status: 422,
      code: 'COUPON_INVALID',
      details: { reason: 'expired' },
    })
    // ANA15 es de Ana (usuario 2).
    await expect(
      createSale({ ...body, couponCode: 'ANA15' }, OTHER),
    ).rejects.toMatchObject({
      status: 422,
      code: 'COUPON_INVALID',
      details: { reason: 'notOwner' },
    })
  })

  it('vincula la venta a la generación de talle del propio cliente', async () => {
    const target = variant('endurance-classic', 'L', 'black')
    const body = {
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'StorePickup',
    }

    const linked = await createSale({ ...body, generationId: 100 })
    expect(linked.data.generationId).toBe(100)

    // La generación 104 es del otro cliente.
    await expect(createSale({ ...body, generationId: 104 })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})

describe('sales controller — mis compras', () => {
  it('lista solo las compras propias, de la más nueva a la más vieja', async () => {
    const target = variant('endurance-classic', 'L', 'black')
    const created = await createSale({
      items: [{ variantId: target.id, quantity: 1 }],
      channel: 'Email',
      deliveryMethod: 'StorePickup',
    })

    const list = await call('GET', '/me/sales', { auth: ANA })

    expect(list.status).toBe(200)
    expect(list.data[0].id).toBe(created.data.id)
    expect(new Set(list.data.map((sale) => sale.status)).size).toBeGreaterThan(0)
    for (const sale of list.data) {
      expect(sale.lines.length).toBeGreaterThan(0)
    }
  })

  it('devuelve el detalle al dueño y 404 para una venta ajena', async () => {
    const own = await call('GET', '/me/sales/1', { auth: ANA })
    expect(own.status).toBe(200)
    expect(own.data.lines[0].product.model).toBe('endurance-classic')

    await expect(call('GET', '/me/sales/5', { auth: ANA })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
    await expect(call('GET', '/me/sales/5', { auth: OTHER })).resolves.toMatchObject({
      status: 200,
    })
  })

  it('no arma mensaje de coordinación para ventas cerradas', async () => {
    const confirmed = await call('GET', '/me/sales/3', { auth: ANA })
    expect(confirmed.data.status).toBe('Confirmed')
    expect(confirmed.data.contact).toBeNull()

    const pending = await call('GET', '/me/sales/1', { auth: ANA })
    expect(pending.data.status).toBe('PendingCoordination')
    expect(pending.data.contact.url).toContain('mailto:')
  })

  it('deriva el descuento de las ventas sembradas con cupón', async () => {
    // Venta 2: soft-classic S blue (1390) con el cupón ANA15 (15%, tope 600).
    const sale = await call('GET', '/me/sales/2', { auth: ANA })

    expect(sale.data.subtotal).toBe(1390)
    expect(sale.data.discount).toBe(208.5)
    expect(sale.data.total).toBe(1181.5)
  })
})

describe('coupons controller', () => {
  it('valida el cupón contra las líneas elegidas', async () => {
    const target = variant('endurance-classic', 'L', 'black')

    const result = await call('POST', '/coupons/validate', {
      auth: ANA,
      body: { code: 'VIKI10', items: [{ variantId: target.id, quantity: 1 }] },
    })

    expect(result.status).toBe(200)
    expect(result.data).toMatchObject({
      valid: true,
      discount: 129,
      subtotal: 1290,
      total: 1161,
    })
  })

  it('sin líneas el descuento es 0 (todavía no hay subtotal)', async () => {
    const result = await call('POST', '/coupons/validate', {
      auth: ANA,
      body: { code: 'VIKI10' },
    })
    expect(result.data.discount).toBe(0)
  })

  it('exige sesión y código, y rechaza cupones inválidos', async () => {
    await expect(
      call('POST', '/coupons/validate', { body: { code: 'VIKI10' } }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' })

    await expect(
      call('POST', '/coupons/validate', { auth: ANA, body: {} }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })

    await expect(
      call('POST', '/coupons/validate', { auth: ANA, body: { code: 'NOEXISTE' } }),
    ).rejects.toMatchObject({ status: 422, code: 'COUPON_INVALID' })
  })
})
