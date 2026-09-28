// Controller de generaciones de talle (US1): crea y calcula la recomendación
// con el motor placeholder, lista el historial y expone el detalle al dueño.
//
// Regla del ER: una generación pertenece a un cliente (`customerId`) o a un
// invitado (`guestSessionId`). En modo asistente (US12) el admin la genera
// (`adminId`) para un tercero, opcionalmente vinculada a un cliente.

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { readMeasures } from '@mocks/domain/measures.js'
import { adjacentSizes, suggestSize } from '@mocks/domain/size-engine.js'
import { hasStockForSize } from '@mocks/domain/stock.js'
import { register } from '@mocks/router/mock-router.js'

const LINES = ['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']
const SOURCES = ['Direct', 'QR', 'Landing']
const FIT_TYPES = ['Training', 'Competition']

export function serializeGeneration(db, generation) {
  const size = db.sizes.find((item) => item.id === generation.suggestedSizeId) ?? null
  return {
    id: generation.id,
    line: generation.line,
    profileId: generation.profileId ?? null,
    createdAt: generation.createdAt,
    suggestedSize: size
      ? { id: size.id, code: size.code, sortOrder: size.sortOrder }
      : null,
    dominantMeasure: generation.dominantMeasure ?? null,
    stockAvailableAtQuery: generation.stockAvailableAtQuery,
    adjacentSizes: size
      ? adjacentSizes(db, size).map((item) => ({ id: item.id, code: item.code }))
      : [],
    rating: generation.rating ?? null,
    comment: generation.comment ?? null,
    ratedAt: generation.ratedAt ?? null,
    source: generation.source ?? null,
    // El FE oculta las tarjetas personales (guardar perfil / feedback) cuando la
    // generación la hizo el personal para un tercero.
    onBehalf: generation.adminId != null,
  }
}

register('POST', '/size-generations', (req) => {
  const {
    line,
    fitType = 'Training',
    source = 'Direct',
    profileId = null,
    onBehalf = false,
    customerId = null,
  } = req.body
  requireFields(req.body, ['line'])

  if (!LINES.includes(line)) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['line'] })
  }

  // Las cinco medidas viajan juntas (mismo criterio que MEASUREMENT_PROFILE).
  const measures = readMeasures(req.body)

  const hasProfile = profileId !== null && profileId !== ''
  const profileIdNumber = hasProfile ? Number(profileId) : null
  if (hasProfile && !Number.isInteger(profileIdNumber)) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['profileId'] })
  }

  // Modo asistente (US12): solo el personal puede generar para terceros.
  const isOnBehalf = Boolean(onBehalf)
  if (isOnBehalf && req.auth?.user?.type !== 'Admin') {
    throw new ApiError(403, 'FORBIDDEN')
  }

  const hasCustomer = customerId !== null && customerId !== ''
  const customerIdNumber = hasCustomer ? Number(customerId) : null
  if (hasCustomer && !Number.isInteger(customerIdNumber)) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['customerId'] })
  }
  // Vincular a un cliente solo tiene sentido en modo asistente.
  if (!isOnBehalf && hasCustomer) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['customerId'] })
  }

  return mutate((db) => {
    // El perfil debe ser del dueño de la generación: el propio cliente, o el
    // cliente vinculado cuando la genera el personal (US5/US12).
    const profileOwnerId = isOnBehalf ? customerIdNumber : (req.auth?.user?.id ?? null)
    if (profileIdNumber) {
      const owns =
        profileOwnerId &&
        db.measurementProfiles.some(
          (profile) =>
            profile.id === profileIdNumber &&
            profile.userId === profileOwnerId &&
            profile.active !== false,
        )
      if (!owns) throw new ApiError(404, 'NOT_FOUND', { profileId: profileIdNumber })
    }

    if (isOnBehalf && customerIdNumber) {
      const customer = db.users.find(
        (user) => user.id === customerIdNumber && user.type === 'Customer',
      )
      if (!customer)
        throw new ApiError(404, 'NOT_FOUND', { customerId: customerIdNumber })
    }

    const { size, dominantMeasure } = suggestSize(db, { line, ...measures })

    const generation = {
      id: nextId(db.sizeGenerations),
      customerId: isOnBehalf ? customerIdNumber : (req.auth?.user?.id ?? null),
      guestSessionId: req.auth?.user ? null : req.guestSessionId,
      profileId: profileIdNumber,
      adminId: isOnBehalf ? req.auth.user.id : null,
      line,
      createdAt: new Date().toISOString(),
      ...measures,
      suggestedSizeId: size.id,
      // Snapshot derivado del cálculo (el ER no lo persiste; en el mock se
      // guarda para que el detalle devuelva el mismo valor de la creación).
      dominantMeasure,
      stockAvailableAtQuery: hasStockForSize(db, size.id),
      rating: null,
      comment: null,
      ratedAt: null,
      fitType: FIT_TYPES.includes(fitType) ? fitType : 'Training',
      source: SOURCES.includes(source) ? source : 'Direct',
    }
    db.sizeGenerations.push(generation)

    return { status: 201, data: serializeGeneration(db, generation) }
  })
})

register(
  'GET',
  '/size-generations',
  (req) => {
    const { profileId } = req.query
    const generations = getDb()
      .sizeGenerations.filter((generation) => generation.customerId === req.auth.user.id)
      .filter(
        (generation) => !profileId || String(generation.profileId) === String(profileId),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return {
      status: 200,
      data: generations.map((generation) => serializeGeneration(getDb(), generation)),
    }
  },
  { auth: 'user' },
)

register('GET', '/size-generations/:id', (req) => {
  const id = Number(req.params.id)
  const db = getDb()
  const generation = db.sizeGenerations.find((item) => item.id === id)

  // Acceso para el dueño (cliente o invitado con el mismo session id) y para el
  // admin que la generó en modo asistente (US12).
  const isOwner =
    generation &&
    ((req.auth?.user && generation.customerId === req.auth.user.id) ||
      (req.auth?.user && generation.adminId === req.auth.user.id) ||
      (!req.auth?.user &&
        req.guestSessionId &&
        generation.guestSessionId === req.guestSessionId))
  if (!isOwner) {
    throw new ApiError(404, 'NOT_FOUND')
  }

  return { status: 200, data: serializeGeneration(db, generation) }
})
