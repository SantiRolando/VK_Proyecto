// Helpers compartidos por los controllers mock.

import { ApiError } from '../../api/client/api-error.js'

export function requireFields(body, fields) {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === '',
  )
  if (missing.length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: missing })
  }
}
