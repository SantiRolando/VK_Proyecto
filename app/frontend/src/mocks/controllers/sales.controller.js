// Controller de ventas (T058): crea la venta con reserva atómica y expone las
// compras del usuario con el mensaje de coordinación ya armado (Q-09).
//
// La reserva es derivada de las ventas abiertas (domain/stock.js): crear la
// venta no descuenta `quantity`. El movimiento de stock se crea recién al
// confirmar (US7), según Q-03.

import { ApiError } from '@api/client/api-error.js'
import { serializeAddress } from '@mocks/controllers/addresses.controller.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { buildCoordinationMessage } from '@mocks/domain/coordination-message.js'
import {
  assertCouponUsable,
  computeDiscount,
  findCouponByCode,
  saleDiscount,
} from '@mocks/domain/coupons.js'
import { round2 } from '@mocks/domain/money.js'
import {
  checkAvailability,
  DELIVERY_METHODS,
  resolveSaleLines,
  SALE_CHANNELS,
  saleLinesWithDetails,
  subtotalOf,
} from '@mocks/domain/sales.js'
import { register } from '@mocks/router/mock-router.js'

const LOCALES = ['es', 'en']

// El mensaje de coordinación solo tiene sentido mientras la venta está abierta
// (después de confirmar o cancelar ya no hay nada que coordinar).
const COORDINABLE_STATUSES = ['PendingCoordination', 'Contacted']

function positiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

export function serializeSale(db, sale, { locale = 'es' } = {}) {
  const lines = saleLinesWithDetails(db, sale)
  const subtotal = subtotalOf(lines)
  const discount = saleDiscount(db, sale, subtotal)
  const coupon = db.discountCoupons.find((item) => item.id === sale.couponId) ?? null
  const address = db.addresses.find((item) => item.id === sale.addressId) ?? null

  const data = {
    id: sale.id,
    status: sale.status,
    channel: sale.channel,
    deliveryMethod: sale.deliveryMethod,
    createdAt: sale.createdAt,
    contactedAt: sale.contactedAt ?? null,
    confirmedAt: sale.confirmedAt ?? null,
    cancelledAt: sale.cancelledAt ?? null,
    // La reserva no vence todavía (Q-11 abierto).
    reservedUntil: null,
    generationId: sale.generationId ?? null,
    coupon: coupon ? { id: coupon.id, code: coupon.couponCode } : null,
    address: address ? serializeAddress(address) : null,
    lines,
    subtotal,
    discount,
    total: round2(subtotal - discount),
    contact: null,
  }

  if (COORDINABLE_STATUSES.includes(sale.status)) {
    data.contact = buildCoordinationMessage({
      sale,
      lines,
      address,
      coupon,
      customer: db.users.find((item) => item.id === sale.userId) ?? null,
      totals: { subtotal, discount, total: data.total },
      settings: db.settings,
      locale,
    })
  }

  return data
}

register(
  'POST',
  '/sales',
  (req) => {
    const {
      items,
      channel,
      deliveryMethod,
      addressId = null,
      generationId = null,
      couponCode = null,
      locale = 'es',
    } = req.body
    requireFields(req.body, ['items', 'channel', 'deliveryMethod'])

    if (!SALE_CHANNELS.includes(channel)) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['channel'] })
    }
    if (!DELIVERY_METHODS.includes(deliveryMethod)) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['deliveryMethod'] })
    }

    const addressIdNumber =
      deliveryMethod === 'HomeDelivery' ? positiveInteger(addressId) : null
    if (deliveryMethod === 'HomeDelivery' && !addressIdNumber) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['addressId'] })
    }

    const generationIdNumber =
      generationId == null || generationId === '' ? null : positiveInteger(generationId)
    if (generationId != null && generationId !== '' && !generationIdNumber) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['generationId'] })
    }

    return mutate((db) => {
      const userId = req.auth.user.id

      // 1) Validar todo antes de escribir: la venta es atómica (§5.3), y un
      // error a mitad de camino no debe dejar la venta a medio crear.
      const lines = resolveSaleLines(db, items)
      checkAvailability(db, lines)

      const address = addressIdNumber
        ? (db.addresses.find(
            (item) =>
              item.id === addressIdNumber &&
              item.userId === userId &&
              item.active !== false,
          ) ?? null)
        : null
      if (deliveryMethod === 'HomeDelivery' && !address) {
        throw new ApiError(404, 'NOT_FOUND', { addressId: addressIdNumber })
      }

      const generation = generationIdNumber
        ? (db.sizeGenerations.find(
            (item) => item.id === generationIdNumber && item.customerId === userId,
          ) ?? null)
        : null
      if (generationIdNumber && !generation) {
        throw new ApiError(404, 'NOT_FOUND', { generationId: generationIdNumber })
      }

      let coupon = null
      if (couponCode) {
        coupon = findCouponByCode(db, couponCode)
        if (!coupon) {
          throw new ApiError(422, 'COUPON_INVALID', { reason: 'notFound' })
        }
        assertCouponUsable(coupon, { userId })
      }

      const subtotal = subtotalOf(lines)
      const discount = computeDiscount(coupon, subtotal)

      // 2) Escribir: venta + líneas + uso del cupón.
      const sale = {
        id: nextId(db.sales),
        userId,
        couponId: coupon?.id ?? null,
        addressId: address?.id ?? null,
        generationId: generation?.id ?? null,
        createdAt: new Date().toISOString(),
        status: 'PendingCoordination',
        channel,
        deliveryMethod,
        contactedAt: null,
        confirmedAt: null,
        cancelledAt: null,
        // Snapshot del descuento, con el mismo criterio que `dominantMeasure` en
        // SIZE_GENERATION: el ER no lo guarda y así el historial no cambia si el
        // cupón cambia después.
        discountAmount: discount,
      }
      db.sales.push(sale)

      let lineId = nextId(db.saleLines)
      for (const line of lines) {
        db.saleLines.push({
          id: lineId++,
          saleId: sale.id,
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })
      }
      if (coupon) coupon.usageCount += 1

      return {
        status: 201,
        data: serializeSale(db, sale, {
          locale: LOCALES.includes(locale) ? locale : 'es',
        }),
      }
    })
  },
  { auth: 'user' },
)

register(
  'GET',
  '/me/sales',
  (req) => {
    const db = getDb()
    const sales = db.sales
      .filter((sale) => sale.userId === req.auth.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return { status: 200, data: sales.map((sale) => serializeSale(db, sale)) }
  },
  { auth: 'user' },
)

register(
  'GET',
  '/me/sales/:id',
  (req) => {
    const db = getDb()
    const sale = db.sales.find(
      (item) => item.id === Number(req.params.id) && item.userId === req.auth.user.id,
    )
    if (!sale) throw new ApiError(404, 'NOT_FOUND')

    return { status: 200, data: serializeSale(db, sale) }
  },
  { auth: 'user' },
)
