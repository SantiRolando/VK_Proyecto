// Inventario por variante (US9/T088, FR-023). La granularidad es
// Producto + Color + Talle (variante con SKU único).
//
// `quantity` (físico) NO se edita por PATCH: cambia solo con movimientos de
// stock, para que todo ajuste quede auditado. Acá se administran color, SKU,
// mínimo y baja lógica.

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { availableQuantity, reservedQuantity } from '@mocks/domain/stock.js'
import { register } from '@mocks/router/mock-router.js'

export function serializeInventoryVariant(db, variant) {
  const product = db.products.find((item) => item.id === variant.productId) ?? null
  const size = db.sizes.find((item) => item.id === variant.sizeId) ?? null
  const reserved = reservedQuantity(db, variant.id)
  const available = availableQuantity(db, variant.id)
  const active = variant.active !== false

  return {
    id: variant.id,
    sku: variant.sku,
    color: variant.color,
    active,
    quantity: variant.quantity,
    reserved,
    available,
    minStock: variant.minStock,
    deficit: Math.max(0, variant.minStock - available),
    isCritical: active && available < variant.minStock,
    product: product
      ? { id: product.id, line: product.line, model: product.model }
      : null,
    size: size ? { id: size.id, code: size.code, sortOrder: size.sortOrder } : null,
  }
}

function lineOf(db, variant) {
  return db.products.find((item) => item.id === variant.productId)?.line ?? null
}

function normalizeSku(db, sku, ignoreId = null) {
  const value = String(sku ?? '')
    .trim()
    .toUpperCase()
  if (!value) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['sku'] })

  const taken = db.productVariants.some(
    (variant) => variant.id !== ignoreId && variant.sku.toUpperCase() === value,
  )
  if (taken) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['sku'] })
  return value
}

register(
  'GET',
  '/admin/variants',
  (req) => {
    const db = getDb()
    const { productId, line, sizeId, color } = req.query
    const lowStock = req.query.lowStock === true || req.query.lowStock === 'true'

    const items = db.productVariants
      .filter((variant) => !productId || variant.productId === Number(productId))
      .filter((variant) => !sizeId || variant.sizeId === Number(sizeId))
      .filter((variant) => !color || variant.color === color)
      .filter((variant) => !line || lineOf(db, variant) === line)
      .map((variant) => serializeInventoryVariant(db, variant))
      .filter((item) => !lowStock || item.isCritical)
      .sort((a, b) => Number(b.isCritical) - Number(a.isCritical) || a.id - b.id)

    return { status: 200, data: items, meta: { total: items.length } }
  },
  { auth: 'admin' },
)

register(
  'POST',
  '/admin/variants',
  (req) => {
    const { productId, sizeId, color, sku, quantity = 0, minStock = 0 } = req.body
    requireFields(req.body, ['productId', 'sizeId', 'color', 'sku'])

    const quantityNumber = Number(quantity)
    const minStockNumber = Number(minStock)
    if (!Number.isInteger(quantityNumber) || quantityNumber < 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['quantity'] })
    }
    if (!Number.isInteger(minStockNumber) || minStockNumber < 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['minStock'] })
    }

    return mutate((db) => {
      const product = db.products.find((item) => item.id === Number(productId))
      if (!product) throw new ApiError(404, 'NOT_FOUND', { productId })

      const size = db.sizes.find(
        (item) => item.id === Number(sizeId) && item.line === product.line,
      )
      if (!size) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['sizeId'] })

      const variant = {
        id: nextId(db.productVariants),
        productId: product.id,
        sizeId: size.id,
        color: String(color).trim(),
        sku: normalizeSku(db, sku),
        quantity: quantityNumber,
        minStock: minStockNumber,
        active: true,
      }
      db.productVariants.push(variant)

      return { status: 201, data: serializeInventoryVariant(db, variant) }
    })
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  '/admin/variants/:id',
  (req) => {
    return mutate((db) => {
      const variant = db.productVariants.find((item) => item.id === Number(req.params.id))
      if (!variant) throw new ApiError(404, 'NOT_FOUND')

      if (req.body.sku !== undefined) {
        variant.sku = normalizeSku(db, req.body.sku, variant.id)
      }
      if (req.body.color !== undefined) {
        variant.color = String(req.body.color).trim()
      }
      if (req.body.minStock !== undefined) {
        const minStock = Number(req.body.minStock)
        if (!Number.isInteger(minStock) || minStock < 0) {
          throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['minStock'] })
        }
        variant.minStock = minStock
      }
      if (req.body.active !== undefined) {
        variant.active = Boolean(req.body.active)
      }

      return { status: 200, data: serializeInventoryVariant(db, variant) }
    })
  },
  { auth: 'admin' },
)
