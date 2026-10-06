/*
  Movimientos de stock del panel: ajuste con motivo obligatorio y auditoría.
  `SaleConfirmed` solo aparece por la confirmación de venta, no se registra a mano.
*/

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { inRange, rangeFromQuery } from '@mocks/domain/date-range.js'
import {
  applyStockTransaction,
  fixedDirection,
  MANUAL_REASONS,
} from '@mocks/domain/inventory.js'
import { register } from '@mocks/router/mock-router.js'

const DEFAULT_PAGE_SIZE = 50

/*
  Catálogo de motivos del formulario de ajuste: el FE lo consume para saber qué dirección
  elegir sin conocer las reglas.
*/
register(
  'GET',
  '/admin/stock-transactions/reasons',
  () => ({
    status: 200,
    data: MANUAL_REASONS.map((reason) => ({
      value: reason,
      direction: fixedDirection(reason),
    })),
  }),
  { auth: 'admin' },
)

function serializeTransaction(db, transaction) {
  const user = db.users.find((item) => item.id === transaction.userId) ?? null
  const lines = db.transactionLines
    .filter((line) => line.transactionId === transaction.id)
    .map((line) => {
      const variant =
        db.productVariants.find((item) => item.id === line.variantId) ?? null
      const product = variant
        ? (db.products.find((item) => item.id === variant.productId) ?? null)
        : null
      const size = variant
        ? (db.sizes.find((item) => item.id === variant.sizeId) ?? null)
        : null

      return {
        id: line.id,
        variantId: line.variantId,
        quantity: line.quantity,
        sku: variant?.sku ?? null,
        color: variant?.color ?? null,
        product: product ? { id: product.id, model: product.model } : null,
        size: size ? { id: size.id, code: size.code } : null,
      }
    })

  return {
    id: transaction.id,
    direction: transaction.direction,
    reason: transaction.reason,
    saleId: transaction.saleId ?? null,
    createdAt: transaction.createdAt,
    user: user ? { id: user.id, name: user.name } : null,
    lines,
  }
}

register(
  'POST',
  '/admin/stock-transactions',
  (req) => {
    const { reason, direction, lines } = req.body
    requireFields(req.body, ['reason', 'lines'])
    if (!MANUAL_REASONS.includes(reason)) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['reason'] })
    }

    return mutate((db) => {
      // Valida y ajusta el físico (y dispara el aviso de reposición).
      const applied = applyStockTransaction(db, { reason, direction, lines })

      const transaction = {
        id: nextId(db.transactions),
        userId: req.auth.user.id,
        saleId: null,
        direction: applied.direction,
        reason,
        createdAt: new Date().toISOString(),
      }
      db.transactions.push(transaction)

      let lineId = nextId(db.transactionLines)
      for (const line of applied.lines) {
        db.transactionLines.push({
          id: lineId++,
          transactionId: transaction.id,
          variantId: line.variantId,
          quantity: line.quantity,
        })
      }

      return {
        status: 201,
        data: {
          ...serializeTransaction(db, transaction),
          alertsNotified: applied.alertsNotified,
        },
      }
    })
  },
  { auth: 'admin' },
)

register(
  'GET',
  '/admin/stock-transactions',
  (req) => {
    const db = getDb()
    const { variantId, reason } = req.query
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE)
    const range = rangeFromQuery(req.query)

    const matchesVariant = (transaction) => {
      if (!variantId) return true
      return db.transactionLines.some(
        (line) =>
          line.transactionId === transaction.id && line.variantId === Number(variantId),
      )
    }

    const filtered = db.transactions
      .filter((transaction) => !reason || transaction.reason === reason)
      .filter((transaction) => inRange(transaction.createdAt, range))
      .filter(matchesVariant)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const start = (page - 1) * pageSize

    return {
      status: 200,
      data: filtered
        .slice(start, start + pageSize)
        .map((transaction) => serializeTransaction(db, transaction)),
      meta: { page, pageSize, total: filtered.length },
    }
  },
  { auth: 'admin' },
)
