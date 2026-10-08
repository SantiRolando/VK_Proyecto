/*
  Inventario por variante: físico, reservado, disponible y crítico, con granularidad
  Producto + Color + Talle. El alta y la edición viven en `admin-catalog.controller.js`.
*/

import { getDb } from '@mocks/db/database.js'
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
      ? {
          id: product.id,
          line: product.line,
          audience: product.audience ?? 'Adult',
          model: product.model,
        }
      : null,
    size: size ? { id: size.id, code: size.code, sortOrder: size.sortOrder } : null,
  }
}

function lineOf(db, variant) {
  return db.products.find((item) => item.id === variant.productId)?.line ?? null
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
