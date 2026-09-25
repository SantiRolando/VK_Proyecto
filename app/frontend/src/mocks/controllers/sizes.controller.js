// Controller de talles: GET /sizes?line= — tabla SIZE del ER, pública.

import { getDb } from '../db/database.js'
import { register } from '../router/mock-router.js'

function serializeSize(size) {
  return {
    id: size.id,
    line: size.line,
    code: size.code,
    sortOrder: size.sortOrder,
  }
}

register('GET', '/sizes', (req) => {
  const { line } = req.query
  const sizes = getDb().sizes.filter((size) => !line || size.line === line)
  return { status: 200, data: sizes.map(serializeSize) }
})
