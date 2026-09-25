// Controller de catálogo (US3): lista solo lo que hay disponible en el talle
// consultado y expone el detalle de un producto con la disponibilidad por
// color.
//
// La demanda no satisfecha no se registra acá: el ER la deriva de
// `SIZE_GENERATION.stock_available_at_query = false` (§4.7).

import { ApiError } from '../../api/client/api-error.js'
import { getDb } from '../db/database.js'
import { adjacentSizes } from '../domain/size-engine.js'
import { availableQuantity } from '../domain/stock.js'
import { register } from '../router/mock-router.js'

function serializeSize(size) {
  return { id: size.id, code: size.code, sortOrder: size.sortOrder }
}

function variantsOfSize(db, productId, sizeId) {
  return db.productVariants
    .filter(
      (variant) =>
        variant.active && variant.productId === productId && variant.sizeId === sizeId,
    )
    .map((variant) => ({
      id: variant.id,
      color: variant.color,
      sku: variant.sku,
      available: availableQuantity(db, variant.id),
    }))
}

register('GET', '/catalog', (req) => {
  const { sizeId, line } = req.query
  if (!sizeId) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['sizeId'] })
  }

  const db = getDb()
  const size = db.sizes.find((item) => item.id === Number(sizeId))
  if (!size) throw new ApiError(404, 'NOT_FOUND')

  const lineValue = line || size.line

  const items = db.products
    .filter((product) => product.active && product.line === lineValue)
    .map((product) => ({
      id: product.id,
      line: product.line,
      model: product.model,
      description: product.description,
      price: product.price,
      variants: variantsOfSize(db, product.id, size.id).filter(
        (variant) => variant.available > 0,
      ),
    }))
    .filter((product) => product.variants.length > 0)

  return {
    status: 200,
    data: items,
    meta: {
      line: lineValue,
      size: serializeSize(size),
      hasStock: items.length > 0,
      adjacentSizes: adjacentSizes(db, size).map(serializeSize),
    },
  }
})

register('GET', '/catalog/:productId', (req) => {
  const db = getDb()
  const product = db.products.find(
    (item) => item.id === Number(req.params.productId) && item.active,
  )
  if (!product) throw new ApiError(404, 'NOT_FOUND')

  const sizeIds = [
    ...new Set(
      db.productVariants
        .filter((variant) => variant.active && variant.productId === product.id)
        .map((variant) => variant.sizeId),
    ),
  ]
  const sizes = db.sizes
    .filter((size) => sizeIds.includes(size.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const requestedSizeId = req.query.sizeId ? Number(req.query.sizeId) : null
  const selectedSize =
    sizes.find((size) => size.id === requestedSizeId) ?? sizes[0] ?? null

  return {
    status: 200,
    data: {
      id: product.id,
      line: product.line,
      model: product.model,
      description: product.description,
      price: product.price,
      sizes: sizes.map(serializeSize),
      selectedSize: selectedSize ? serializeSize(selectedSize) : null,
      colors: selectedSize ? variantsOfSize(db, product.id, selectedSize.id) : [],
    },
  }
})
