// Catálogo del panel (US9/T088, FR-024): CRUD de productos con baja lógica.
// Las variantes se administran por `/admin/variants`.

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const LINES = ['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']

export function serializeProduct(db, product) {
  const variants = db.productVariants.filter(
    (variant) => variant.productId === product.id,
  )

  return {
    id: product.id,
    line: product.line,
    model: product.model,
    description: product.description,
    price: product.price,
    active: product.active !== false,
    variantCount: variants.length,
    activeVariantCount: variants.filter((variant) => variant.active !== false).length,
  }
}

function validateLine(line) {
  if (!LINES.includes(line)) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['line'] })
  }
}

function validatePrice(price) {
  const value = Number(price)
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['price'] })
  }
  return value
}

register(
  'GET',
  '/admin/products',
  () => {
    const db = getDb()
    // El panel ve también los dados de baja (baja lógica).
    const products = [...db.products].sort((a, b) => a.id - b.id)
    return {
      status: 200,
      data: products.map((product) => serializeProduct(db, product)),
      meta: { total: products.length },
    }
  },
  { auth: 'admin' },
)

register(
  'POST',
  '/admin/products',
  (req) => {
    const { line, model, description = '', price } = req.body
    requireFields(req.body, ['line', 'model', 'price'])
    validateLine(line)

    const trimmedModel = String(model).trim()
    if (!trimmedModel) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['model'] })
    }
    const priceValue = validatePrice(price)

    return mutate((db) => {
      if (db.products.some((product) => product.model === trimmedModel)) {
        throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['model'] })
      }

      const product = {
        id: nextId(db.products),
        line,
        model: trimmedModel,
        description: String(description).trim(),
        price: priceValue,
        active: true,
      }
      db.products.push(product)

      return { status: 201, data: serializeProduct(db, product) }
    })
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  '/admin/products/:id',
  (req) => {
    return mutate((db) => {
      const product = db.products.find((item) => item.id === Number(req.params.id))
      if (!product) throw new ApiError(404, 'NOT_FOUND')

      if (req.body.model !== undefined) {
        const model = String(req.body.model).trim()
        if (!model) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['model'] })
        if (db.products.some((item) => item.id !== product.id && item.model === model)) {
          throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['model'] })
        }
        product.model = model
      }
      if (req.body.description !== undefined) {
        product.description = String(req.body.description).trim()
      }
      if (req.body.price !== undefined) {
        product.price = validatePrice(req.body.price)
      }
      if (req.body.active !== undefined) {
        product.active = Boolean(req.body.active)
      }

      return { status: 200, data: serializeProduct(db, product) }
    })
  },
  { auth: 'admin' },
)

register(
  'DELETE',
  '/admin/products/:id',
  (req) => {
    return mutate((db) => {
      const product = db.products.find((item) => item.id === Number(req.params.id))
      if (!product) throw new ApiError(404, 'NOT_FOUND')

      // Baja lógica: el catálogo del cliente filtra `product.active`, así que
      // deja de ofrecerse sin romper las ventas históricas.
      product.active = false
      return { status: 200, data: serializeProduct(db, product) }
    })
  },
  { auth: 'admin' },
)
