/*
  Catálogo del panel con el contrato del backend (`/admin/catalog/products`): productos
  paginados y las variantes de cada producto (alta, edición y activar/desactivar).

  `quantity` (físico) no se toca acá: nace en 0 y cambia solo con movimientos de stock,
  para que todo ajuste quede auditado.
*/

import { ApiError } from '@api/client/api-error.js'
import { audienceCodec, lineCodec } from '@api/wire.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const BASE = '/admin/catalog/products'

function serializeProduct(product) {
  return {
    id: product.id,
    line: lineCodec.encode(product.line),
    audience: audienceCodec.encode(product.audience ?? 'Adult'),
    model: product.model,
    description: product.description || null,
    price: product.price,
    active: product.active !== false,
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
  }
}

function serializeVariant(db, variant) {
  const size = db.sizes.find((item) => item.id === variant.sizeId) ?? null
  return {
    id: variant.id,
    productId: variant.productId,
    sizeId: variant.sizeId,
    sizeCode: size?.code ?? null,
    color: variant.color,
    sku: variant.sku,
    quantity: variant.quantity,
    minStock: variant.minStock,
    active: variant.active !== false,
    createdAt: variant.createdAt ?? null,
    updatedAt: variant.updatedAt ?? null,
  }
}

function validationError(fields) {
  return new ApiError(400, 'VALIDATION_ERROR', { fields, message: 'Validation failed' })
}

// `ProductRequestDTO`.
function readProduct(body) {
  const fields = {}
  const line = lineCodec.decode(body.line)
  const audience = audienceCodec.decode(body.audience)
  if (!lineCodec.values.includes(line)) fields.line = 'must not be null'
  if (!audienceCodec.values.includes(audience)) fields.audience = 'must not be null'
  const model = String(body.model ?? '').trim()
  if (!model) fields.model = 'must not be blank'
  const price = Number(body.price)
  if (body.price == null || !Number.isFinite(price) || price < 0) {
    fields.price = 'must be greater than or equal to 0'
  }
  if (Object.keys(fields).length > 0) throw validationError(fields)
  return {
    line,
    audience,
    model,
    description: String(body.description ?? '').trim() || null,
    price,
  }
}

// `ProductVariantRequestDTO`.
function readVariant(body) {
  const fields = {}
  const sizeId = Number(body.sizeId)
  if (body.sizeId == null || !Number.isInteger(sizeId)) fields.sizeId = 'must not be null'
  const color = String(body.color ?? '').trim()
  if (!color) fields.color = 'must not be blank'
  const sku = String(body.sku ?? '').trim()
  if (!sku) fields.sku = 'must not be blank'
  const minStock = Number(body.minStock)
  if (body.minStock == null || !Number.isInteger(minStock) || minStock < 0) {
    fields.minStock = 'must be greater than or equal to 0'
  }
  if (Object.keys(fields).length > 0) throw validationError(fields)
  return { sizeId, color, sku, minStock }
}

function requireProduct(db, id) {
  const product = db.products.find((item) => item.id === Number(id))
  if (!product) throw new ApiError(404, 'NOT_FOUND', { message: 'Product not found' })
  return product
}

function requireVariant(db, product, id) {
  const variant = db.productVariants.find(
    (item) => item.id === Number(id) && item.productId === product.id,
  )
  if (!variant) throw new ApiError(404, 'NOT_FOUND', { message: 'Variant not found' })
  return variant
}

function conflict(message) {
  return new ApiError(409, 'CONFLICT', { message })
}

// SKU único en todo el catálogo y una sola variante por producto + talle + color.
function checkVariantUniqueness(db, product, values, ignoreId = null) {
  const skuTaken = db.productVariants.some(
    (item) => item.id !== ignoreId && item.sku.toUpperCase() === values.sku.toUpperCase(),
  )
  if (skuTaken) throw conflict('Request conflicts with existing data')
  const comboTaken = db.productVariants.some(
    (item) =>
      item.id !== ignoreId &&
      item.productId === product.id &&
      item.sizeId === values.sizeId &&
      item.color.toLowerCase() === values.color.toLowerCase(),
  )
  if (comboTaken) throw conflict('Request conflicts with existing data')
}

register(
  'GET',
  BASE,
  (req) => {
    const db = getDb()
    const line = lineCodec.decode(req.query.line ?? null)
    const audience = audienceCodec.decode(req.query.audience ?? null)
    const active = req.query.active == null ? null : String(req.query.active) === 'true'
    const page = Math.max(Number(req.query.page ?? 1), 1)
    const size = Math.min(Math.max(Number(req.query.size ?? 20), 1), 100)

    const all = db.products
      .filter((product) => !line || product.line === line)
      .filter((product) => !audience || (product.audience ?? 'Adult') === audience)
      .filter((product) => active === null || (product.active !== false) === active)
      .sort((a, b) => a.id - b.id)
    const items = all.slice((page - 1) * size, page * size)

    return {
      status: 200,
      data: {
        items: items.map(serializeProduct),
        page,
        size,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
      },
    }
  },
  { auth: 'admin' },
)

register(
  'GET',
  `${BASE}/:id`,
  (req) => {
    const db = getDb()
    const product = requireProduct(db, req.params.id)
    const variants = db.productVariants
      .filter((variant) => variant.productId === product.id)
      .sort((a, b) => a.id - b.id)
    return {
      status: 200,
      data: {
        product: serializeProduct(product),
        variants: variants.map((variant) => serializeVariant(db, variant)),
      },
    }
  },
  { auth: 'admin' },
)

register(
  'POST',
  BASE,
  (req) => {
    const values = readProduct(req.body)
    return mutate((db) => {
      const now = new Date().toISOString()
      const product = {
        id: nextId(db.products),
        ...values,
        active: true,
        createdAt: now,
        updatedAt: now,
      }
      db.products.push(product)
      return { status: 201, data: serializeProduct(product) }
    })
  },
  { auth: 'admin' },
)

register(
  'PUT',
  `${BASE}/:id`,
  (req) => {
    const values = readProduct(req.body)
    return mutate((db) => {
      const product = requireProduct(db, req.params.id)
      const hasVariants = db.productVariants.some((item) => item.productId === product.id)
      const changesTable =
        values.line !== product.line || values.audience !== (product.audience ?? 'Adult')
      if (hasVariants && changesTable) {
        throw conflict('Line and audience cannot change once the product has variants')
      }
      Object.assign(product, values, { updatedAt: new Date().toISOString() })
      return { status: 200, data: serializeProduct(product) }
    })
  },
  { auth: 'admin' },
)

function readActive(body) {
  if (typeof body.active !== 'boolean') {
    throw validationError({ active: 'must not be null' })
  }
  return body.active
}

register(
  'PATCH',
  `${BASE}/:id/active`,
  (req) => {
    const active = readActive(req.body)
    return mutate((db) => {
      const product = requireProduct(db, req.params.id)
      product.active = active
      product.updatedAt = new Date().toISOString()
      return { status: 200, data: serializeProduct(product) }
    })
  },
  { auth: 'admin' },
)

register(
  'POST',
  `${BASE}/:productId/variants`,
  (req) => {
    const values = readVariant(req.body)
    return mutate((db) => {
      const product = requireProduct(db, req.params.productId)
      const size = db.sizes.find((item) => item.id === values.sizeId)
      if (!size) throw new ApiError(404, 'NOT_FOUND', { message: 'Size not found' })
      if (size.line !== product.line || size.audience !== (product.audience ?? 'Adult')) {
        throw new ApiError(400, 'BAD_REQUEST', {
          message: 'Size does not belong to line/audience of product',
        })
      }
      checkVariantUniqueness(db, product, values)

      const now = new Date().toISOString()
      const variant = {
        id: nextId(db.productVariants),
        productId: product.id,
        ...values,
        quantity: 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      }
      db.productVariants.push(variant)
      return { status: 201, data: serializeVariant(db, variant) }
    })
  },
  { auth: 'admin' },
)

register(
  'PUT',
  `${BASE}/:productId/variants/:variantId`,
  (req) => {
    const values = readVariant(req.body)
    return mutate((db) => {
      const product = requireProduct(db, req.params.productId)
      const variant = requireVariant(db, product, req.params.variantId)
      if (variant.sizeId !== values.sizeId) {
        throw new ApiError(400, 'BAD_REQUEST', {
          message: 'A variant cannot change size; create a new variant instead',
        })
      }
      checkVariantUniqueness(db, product, values, variant.id)
      Object.assign(variant, values, { updatedAt: new Date().toISOString() })
      return { status: 200, data: serializeVariant(db, variant) }
    })
  },
  { auth: 'admin' },
)

register(
  'PATCH',
  `${BASE}/:productId/variants/:variantId/active`,
  (req) => {
    const active = readActive(req.body)
    return mutate((db) => {
      const product = requireProduct(db, req.params.productId)
      const variant = requireVariant(db, product, req.params.variantId)
      variant.active = active
      variant.updatedAt = new Date().toISOString()
      return { status: 200, data: serializeVariant(db, variant) }
    })
  },
  { auth: 'admin' },
)
