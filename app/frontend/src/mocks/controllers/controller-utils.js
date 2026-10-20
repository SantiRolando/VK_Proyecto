// Helpers compartidos por los controllers mock.

import { ApiError } from '@api/client/api-error.js'

export function requireFields(body, fields) {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === '',
  )
  if (missing.length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: missing })
  }
}

const MAX_PAGE_SIZE = 100

/*
  Envelope de las listas del backend: `items`, `page`, `size`, `totalElements` y `totalPages`.
  Página desde 1 y tope de 100, como el contrato.
*/
export function pageEnvelope(items, query) {
  const page = Math.max(1, Number(query.page) || 1)
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.size) || 20))
  const start = (page - 1) * size

  return {
    items: items.slice(start, start + size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  }
}
