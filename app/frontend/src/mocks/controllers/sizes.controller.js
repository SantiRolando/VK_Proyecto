/*
  Talles: `GET /public/sizes?line&audience`, tabla SIZE con sus rangos, con el contrato del
  backend (`SizeResponseDTO`).
*/

import { audienceCodec, lineCodec } from '@api/wire.js'
import { getDb } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

export function serializeSize(size) {
  return {
    id: size.id,
    line: lineCodec.encode(size.line),
    audience: audienceCodec.encode(size.audience),
    code: size.code,
    sortOrder: size.sortOrder,
    bustMin: size.bustMin,
    bustMax: size.bustMax,
    waistMin: size.waistMin,
    waistMax: size.waistMax,
    hipMin: size.hipMin,
    hipMax: size.hipMax,
    ageMin: size.ageMin,
    ageMax: size.ageMax,
  }
}

register('GET', '/public/sizes', (req) => {
  const line = lineCodec.decode(req.query.line ?? null)
  const audience = audienceCodec.decode(req.query.audience ?? null)
  const sizes = getDb()
    .sizes.filter((size) => !line || size.line === line)
    .filter((size) => !audience || size.audience === audience)
  return { status: 200, data: sizes.map(serializeSize) }
})
