/*
  Stock del panel contra `/admin/stock`: inventario por variante, movimientos auditados y el
  alta de un movimiento. `quantity` no se edita acá: nace en 0 y solo cambia por movimientos.
*/

import { apiClient } from '@api/client/api-client.js'
import {
  audienceCodec,
  decodePage,
  directionCodec,
  lineCodec,
  reasonCodec,
} from '@api/wire.js'

const BASE = '/admin/stock'

function decodeInventoryRow(row) {
  return {
    ...row,
    product: row.product
      ? {
          ...row.product,
          line: lineCodec.decode(row.product.line),
          audience: audienceCodec.decode(row.product.audience),
        }
      : null,
  }
}

function decodeTransaction(transaction) {
  return {
    ...transaction,
    direction: directionCodec.decode(transaction.direction),
    reason: reasonCodec.decode(transaction.reason),
  }
}

// El endpoint pagina con `size`; los listados del FE llaman `pageSize` a ese valor.
function pageParams({ page = 1, pageSize = 20 } = {}) {
  return { page, size: pageSize }
}

export const adminInventoryService = {
  listInventory: (params = {}) =>
    apiClient
      .get(`${BASE}/inventory`, {
        ...pageParams(params),
        onlyBelowMin: params.onlyBelowMin ?? null,
      })
      .then((page) => decodePage(page, decodeInventoryRow)),

  listTransactions: (params = {}) =>
    apiClient
      .get(`${BASE}/transactions`, {
        ...pageParams(params),
        reason: reasonCodec.encode(params.reason ?? null),
        variantId: params.variantId ?? null,
      })
      .then((page) => decodePage(page, decodeTransaction)),

  getTransaction: (transactionId) =>
    apiClient.get(`${BASE}/transactions/${transactionId}`).then(decodeTransaction),

  createTransaction: ({ direction, reason, note, lines }) =>
    apiClient
      .post(`${BASE}/transactions`, {
        direction: directionCodec.encode(direction),
        reason: reasonCodec.encode(reason),
        note: note?.trim() ? note.trim() : null,
        lines: lines.map((line) => ({
          variantId: Number(line.variantId),
          quantity: Number(line.quantity),
        })),
      })
      .then(decodeTransaction),
}
