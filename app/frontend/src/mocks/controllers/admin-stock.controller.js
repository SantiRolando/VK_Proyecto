/*
  Stock del panel: inventario por variante y movimientos auditados. Responde el mismo envelope
  que el backend (`items`, `page`, `size`, `totalElements`, `totalPages`) y las mismas reglas:
  la salida se valida contra el disponible, no contra el físico.
*/

import { ApiError } from '@api/client/api-error.js'
import { directionCodec, reasonCodec } from '@api/wire.js'
import { pageEnvelope } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { applyStockTransaction } from '@mocks/domain/inventory.js'
import { inventoryRow } from '@mocks/domain/stock.js'
import { register } from '@mocks/router/mock-router.js'

const NOTE_MAX_LENGTH = 300

function serializeSummary(transaction) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    saleId: transaction.saleId ?? null,
    direction: directionCodec.encode(transaction.direction),
    reason: reasonCodec.encode(transaction.reason),
    note: transaction.note ?? null,
    createdAt: transaction.createdAt,
  }
}

function serializeDetail(db, transaction) {
  return {
    ...serializeSummary(transaction),
    lines: db.transactionLines
      .filter((line) => line.transactionId === transaction.id)
      .map((line) => ({
        id: line.id,
        variantId: line.variantId,
        quantity: line.quantity,
      })),
  }
}

register(
  'GET',
  '/admin/stock/inventory',
  (req) => {
    const db = getDb()
    const onlyBelowMin =
      req.query.onlyBelowMin === true || req.query.onlyBelowMin === 'true'

    const rows = db.productVariants
      .map((variant) => inventoryRow(db, variant))
      .filter((row) => !onlyBelowMin || row.available < row.minStock)
      .sort((a, b) => a.sku.localeCompare(b.sku))

    return { status: 200, data: pageEnvelope(rows, req.query) }
  },
  { auth: 'admin' },
)

register(
  'GET',
  '/admin/stock/transactions',
  (req) => {
    const db = getDb()
    const reason = reasonCodec.decode(req.query.reason ?? null)
    const direction = directionCodec.decode(req.query.direction ?? null)
    const variantId = req.query.variantId ? Number(req.query.variantId) : null

    const matchesVariant = (transaction) =>
      !variantId ||
      db.transactionLines.some(
        (line) => line.transactionId === transaction.id && line.variantId === variantId,
      )

    const rows = db.transactions
      .filter((transaction) => !reason || transaction.reason === reason)
      .filter((transaction) => !direction || transaction.direction === direction)
      .filter(matchesVariant)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(serializeSummary)

    return { status: 200, data: pageEnvelope(rows, req.query) }
  },
  { auth: 'admin' },
)

register(
  'GET',
  '/admin/stock/transactions/:id',
  (req) => {
    const db = getDb()
    const transaction = db.transactions.find((item) => item.id === Number(req.params.id))
    if (!transaction) throw new ApiError(404, 'NOT_FOUND')

    return { status: 200, data: serializeDetail(db, transaction) }
  },
  { auth: 'admin' },
)

register(
  'POST',
  '/admin/stock/transactions',
  (req) => {
    const { direction, reason, note, lines } = req.body
    const reasonValue = reasonCodec.decode(reason)
    const directionValue = directionCodec.decode(direction)
    const noteValue = typeof note === 'string' ? note.trim() : null

    if (noteValue && noteValue.length > NOTE_MAX_LENGTH) {
      throw new ApiError(400, 'VALIDATION_ERROR', { fields: ['note'] })
    }

    return mutate((db) => {
      const applied = applyStockTransaction(db, {
        reason: reasonValue,
        direction: directionValue,
        lines,
      })

      const transaction = {
        id: nextId(db.transactions),
        userId: req.auth.user.id,
        saleId: null,
        direction: applied.direction,
        reason: reasonValue,
        note: noteValue,
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

      return { status: 201, data: serializeDetail(db, transaction) }
    })
  },
  { auth: 'admin' },
)
