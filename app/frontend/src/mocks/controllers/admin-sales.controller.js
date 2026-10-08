/*
  Administración de ventas: listado con filtros, detalle y transiciones de estado.
  Confirmar registra el movimiento de stock `SaleConfirmed` y descuenta el físico;
  cancelar solo libera la reserva (derivada) y devuelve el uso del cupón.
*/

import { ApiError } from '@api/client/api-error.js'
import { serializeAddress } from '@mocks/controllers/addresses.controller.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { saleDiscount } from '@mocks/domain/coupons.js'
import { inRange, rangeFromQuery } from '@mocks/domain/date-range.js'
import {
  applyTransition,
  RESERVING_SALE_STATUSES,
  SaleStatus,
  TRANSITIONS,
} from '@mocks/domain/sale-state-machine.js'
import {
  applyConfirmationToStock,
  isStaleSale,
  releaseCouponUsage,
  saleAgeDays,
  saleLinesWithDetails,
  subtotalOf,
} from '@mocks/domain/sales.js'
import { register } from '@mocks/router/mock-router.js'
import { round2 } from '@utils/money.js'

// El PATCH mueve la venta hacia adelante; `PendingCoordination` es el origen.
const TARGET_STATUSES = [SaleStatus.Contacted, SaleStatus.Confirmed, SaleStatus.Cancelled]

const DEFAULT_PAGE_SIZE = 20

// El admin necesita los datos de contacto del cliente para coordinar.
function serializeCustomer(db, userId) {
  const user = db.users.find((item) => item.id === userId) ?? null
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsappPhone: user.whatsappPhone,
  }
}

function serializeAdminSale(db, sale, now = new Date()) {
  const lines = saleLinesWithDetails(db, sale)
  const subtotal = subtotalOf(lines)
  const discount = saleDiscount(db, sale, subtotal)
  const coupon = db.discountCoupons.find((item) => item.id === sale.couponId) ?? null
  const address = db.addresses.find((item) => item.id === sale.addressId) ?? null

  return {
    id: sale.id,
    status: sale.status,
    channel: sale.channel,
    deliveryMethod: sale.deliveryMethod,
    createdAt: sale.createdAt,
    contactedAt: sale.contactedAt ?? null,
    confirmedAt: sale.confirmedAt ?? null,
    cancelledAt: sale.cancelledAt ?? null,
    // Sin TTL de reserva: la antigüedad es solo informativa.
    reservedUntil: null,
    ageDays: saleAgeDays(sale, now),
    isStale: isStaleSale(db, sale, now),
    /*
      Las acciones posibles las decide el backend (la máquina de estados vive acá): el FE
      solo dibuja los botones que recibe.
    */
    allowedTransitions: TRANSITIONS[sale.status] ?? [],
    generationId: sale.generationId ?? null,
    customer: serializeCustomer(db, sale.userId),
    coupon: coupon ? { id: coupon.id, code: coupon.couponCode } : null,
    address: address ? serializeAddress(address) : null,
    lines,
    subtotal,
    discount,
    total: round2(subtotal - discount),
  }
}

register(
  'GET',
  '/admin/sales',
  (req) => {
    const db = getDb()
    const { status, channel } = req.query
    /*
      `open=true` trae las ventas en vuelo (todavía retienen reserva): es lo que consume el
      bloque de ventas en vuelo del dashboard.
    */
    const open = req.query.open === true || req.query.open === 'true'
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE)
    const range = rangeFromQuery(req.query)

    const filtered = db.sales
      .filter((sale) => !status || sale.status === status)
      .filter((sale) => !channel || sale.channel === channel)
      .filter((sale) => !open || RESERVING_SALE_STATUSES.includes(sale.status))
      .filter((sale) => inRange(sale.createdAt, range))
      // Las más antiguas primero: son las que el admin tiene que mover.
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    const start = (page - 1) * pageSize

    return {
      status: 200,
      data: filtered
        .slice(start, start + pageSize)
        .map((sale) => serializeAdminSale(db, sale)),
      meta: { page, pageSize, total: filtered.length },
    }
  },
  { auth: 'admin' },
)

register(
  'GET',
  '/admin/sales/:id',
  (req) => {
    const db = getDb()
    const sale = db.sales.find((item) => item.id === Number(req.params.id))
    if (!sale) throw new ApiError(404, 'NOT_FOUND')

    return { status: 200, data: serializeAdminSale(db, sale) }
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  '/admin/sales/:id/status',
  (req) => {
    const { status } = req.body
    requireFields(req.body, ['status'])

    if (!TARGET_STATUSES.includes(status)) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['status'] })
    }

    return mutate((db) => {
      const index = db.sales.findIndex((item) => item.id === Number(req.params.id))
      if (index === -1) throw new ApiError(404, 'NOT_FOUND')

      // Valida la transición antes de escribir nada (409 si no corresponde).
      const updated = applyTransition(db.sales[index], status)
      db.sales[index] = updated

      if (status === SaleStatus.Confirmed) {
        const lines = applyConfirmationToStock(db, updated)
        const transaction = {
          id: nextId(db.transactions),
          userId: req.auth.user.id,
          saleId: updated.id,
          direction: 'Outbound',
          reason: 'SaleConfirmed',
          createdAt: new Date().toISOString(),
        }
        db.transactions.push(transaction)

        let lineId = nextId(db.transactionLines)
        for (const line of lines) {
          db.transactionLines.push({
            id: lineId++,
            transactionId: transaction.id,
            variantId: line.variantId,
            quantity: line.quantity,
          })
        }
      }

      if (status === SaleStatus.Cancelled) {
        releaseCouponUsage(db, updated)
      }

      return { status: 200, data: serializeAdminSale(db, updated) }
    })
  },
  { auth: 'admin' },
)
