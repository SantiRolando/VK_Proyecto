/*
  Generaciones de talle con el contrato del backend: `POST /public/fit/recommend`,
  `GET /public/fit/generations/:id` (resultado) y `GET /fit/generations[/:id]` (historial).

  Regla del ER: una generación pertenece a un cliente (`customerId`) o a un invitado
  (`guestSessionId`); en modo asistente la genera un admin (`adminId`) para un tercero.
*/

import { ApiError } from '@api/client/api-error.js'
import {
  audienceCodec,
  fitTypeCodec,
  lineCodec,
  outcomeCodec,
  ratingCodec,
  referralCodec,
  sourceCodec,
  warningCodec,
} from '@api/wire.js'
import { serializeSize } from '@mocks/controllers/sizes.controller.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { adjacentSizes, recommend, tableFor } from '@mocks/domain/size-engine.js'
import { hasStockForSize } from '@mocks/domain/stock.js'
import { register } from '@mocks/router/mock-router.js'

const MEASURES = ['height', 'bust', 'waist', 'hip', 'torso', 'age']
const UUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function createUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = (Math.random() * 16) | 0
    const v = char === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// `FitRecommendationResponseDTO`: lo que ve quien pidió la recomendación.
function serializeRecommendation(db, generation) {
  const size = db.sizes.find((item) => item.id === generation.suggestedSizeId) ?? null
  return {
    id: generation.id,
    guestSessionId: generation.guestSessionId ?? null,
    outcome: outcomeCodec.encode(generation.outcome),
    suggestedSize: size ? serializeSize(size) : null,
    adjacentSizes: size ? adjacentSizes(db, size).map(serializeSize) : [],
    warnings: (generation.warnings ?? []).map(warningCodec.encode),
    referralReason: referralCodec.encode(generation.referralReason ?? null),
    stockAvailable: generation.stockAvailableAtQuery ?? null,
    createdAt: generation.createdAt,
  }
}

// `SizeGenerationResponseDTO`: la fila del historial.
function serializeGeneration(db, generation) {
  const size = db.sizes.find((item) => item.id === generation.suggestedSizeId) ?? null
  return {
    id: generation.id,
    customerId: generation.customerId ?? null,
    profileId: generation.profileId ?? null,
    adminId: generation.adminId ?? null,
    line: lineCodec.encode(generation.line),
    audience: audienceCodec.encode(generation.audience ?? 'Adult'),
    height: generation.height ?? null,
    bust: generation.bust ?? null,
    waist: generation.waist ?? null,
    hip: generation.hip ?? null,
    torso: generation.torso ?? null,
    age: generation.age ?? null,
    suggestedSizeId: size?.id ?? null,
    suggestedSizeCode: size?.code ?? null,
    outcome: outcomeCodec.encode(generation.outcome ?? 'Direct'),
    warnings: (generation.warnings ?? []).map(warningCodec.encode),
    referralReason: referralCodec.encode(generation.referralReason ?? null),
    stockAvailableAtQuery: generation.stockAvailableAtQuery ?? null,
    fitType: fitTypeCodec.encode(generation.fitType ?? null),
    source: sourceCodec.encode(generation.source ?? null),
    rating: ratingCodec.encode(generation.rating ?? null),
    comment: generation.comment ?? null,
    ratedAt: generation.ratedAt ?? null,
    createdAt: generation.createdAt,
  }
}

function readNumber(body, field, fields) {
  const raw = body[field]
  if (raw === undefined || raw === null || raw === '') return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) fields[field] = 'must be a positive number'
  return value
}

register('POST', '/public/fit/recommend', (req) => {
  const body = req.body
  const fields = {}
  const line = lineCodec.decode(body.line)
  const audience = audienceCodec.decode(body.audience)
  if (!lineCodec.values.includes(line)) fields.line = 'must not be null'
  if (!audienceCodec.values.includes(audience)) fields.audience = 'must not be null'
  if (body.guestSessionId && !UUID.test(body.guestSessionId)) {
    fields.guestSessionId = 'must be a UUID'
  }

  const measures = {}
  for (const field of MEASURES) measures[field] = readNumber(body, field, fields)
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', { fields, message: 'Validation failed' })
  }

  const user = req.auth?.user ?? null
  const onBehalf = Boolean(body.onBehalf) || body.customerId != null
  if (!user && (onBehalf || body.profileId != null)) {
    throw new ApiError(400, 'BAD_REQUEST', {
      message: 'profileId, onBehalf and customerId require authentication',
    })
  }
  if (onBehalf && user?.type !== 'Admin') {
    throw new ApiError(403, 'FORBIDDEN')
  }

  return mutate((db) => {
    let profileId = null
    if (body.profileId != null) {
      const profile = db.measurementProfiles.find(
        (item) =>
          item.id === Number(body.profileId) &&
          item.userId === user.id &&
          item.active !== false,
      )
      if (!profile) throw new ApiError(404, 'NOT_FOUND', { message: 'Profile not found' })
      profileId = profile.id
      for (const field of MEASURES) {
        if (measures[field] == null) measures[field] = profile[field] ?? null
      }
    }

    let customerId = onBehalf ? null : (user?.id ?? null)
    if (body.customerId != null) {
      const customer = db.users.find(
        (item) => item.id === Number(body.customerId) && item.type === 'Customer',
      )
      if (!customer)
        throw new ApiError(404, 'NOT_FOUND', { message: 'Customer not found' })
      customerId = customer.id
    }

    const table = tableFor(db, line, audience)
    if (table.length === 0) {
      throw new ApiError(400, 'BAD_REQUEST', {
        message: `No size chart for ${body.line} ${body.audience}`,
      })
    }

    let result
    try {
      result = recommend(table, measures)
    } catch (error) {
      throw new ApiError(400, 'BAD_REQUEST', { message: error.message })
    }

    const generation = {
      id: nextId(db.sizeGenerations),
      customerId,
      guestSessionId: user
        ? null
        : (body.guestSessionId ?? req.guestSessionId ?? createUuid()),
      profileId,
      adminId: onBehalf ? user.id : null,
      line,
      audience,
      createdAt: new Date().toISOString(),
      ...measures,
      suggestedSizeId: result.size?.id ?? null,
      outcome: result.outcome,
      warnings: result.warnings,
      referralReason: result.referralReason,
      stockAvailableAtQuery: result.size ? hasStockForSize(db, result.size.id) : null,
      rating: null,
      comment: null,
      ratedAt: null,
      fitType: fitTypeCodec.decode(body.fitType ?? null),
      source: sourceCodec.decode(body.source ?? null) ?? 'Direct',
    }
    db.sizeGenerations.push(generation)

    return { status: 201, data: serializeRecommendation(db, generation) }
  })
})

// Visible para el dueño (cliente, o invitado con su sesión) y para cualquier admin.
function requireVisible(db, req, id, guestSessionId) {
  const user = req.auth?.user ?? null
  const generation = db.sizeGenerations.find((item) => item.id === id)
  const visible =
    generation &&
    (user?.type === 'Admin' ||
      (user && generation.customerId === user.id) ||
      (!user && guestSessionId && generation.guestSessionId === guestSessionId))
  if (!visible) throw new ApiError(404, 'NOT_FOUND')
  return generation
}

register('GET', '/public/fit/generations/:id', (req) => {
  const db = getDb()
  const guest = req.query.guestSessionId ?? req.guestSessionId ?? null
  const generation = requireVisible(db, req, Number(req.params.id), guest)
  return { status: 200, data: serializeRecommendation(db, generation) }
})

register(
  'GET',
  '/fit/generations',
  (req) => {
    const db = getDb()
    const page = Math.max(Number(req.query.page ?? 1), 1)
    const size = Math.min(Math.max(Number(req.query.size ?? 20), 1), 100)
    const all = db.sizeGenerations
      .filter((generation) => generation.customerId === req.auth.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const items = all.slice((page - 1) * size, page * size)

    return {
      status: 200,
      data: {
        items: items.map((generation) => serializeGeneration(db, generation)),
        page,
        size,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
      },
    }
  },
  { auth: 'user' },
)

register(
  'GET',
  '/fit/generations/:id',
  (req) => {
    const db = getDb()
    const generation = requireVisible(db, req, Number(req.params.id), null)
    return { status: 200, data: serializeGeneration(db, generation) }
  },
  { auth: 'user' },
)
