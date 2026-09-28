// Controller de generaciones de talle (US1): crea y calcula la recomendación
// con el motor placeholder, lista el historial y expone el detalle al dueño.
//
// Regla del ER: una generación pertenece a un cliente (`customerId`) o a un
// invitado (`guestSessionId`). El modo asistente (adminId) llega en US12.

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
  }
}

register('POST', '/size-generations', (req) => {
  const { line, fitType = 'Training', source = 'Direct', profileId = null } = req.body
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

  return mutate((db) => {
    // El perfil debe ser del propio cliente: así el historial se separa por
    // perfil (US5). Un invitado no puede atribuir la generación a un perfil.
    if (profileIdNumber) {
      const owns =
        req.auth?.user &&
        db.measurementProfiles.some(
          (profile) =>
            profile.id === profileIdNumber &&
            profile.userId === req.auth.user.id &&
            profile.active !== false,
        )
      if (!owns) throw new ApiError(404, 'NOT_FOUND', { profileId: profileIdNumber })
    }

    const { size, dominantMeasure } = suggestSize(db, { line, ...measures })

    const generation = {
      id: nextId(db.sizeGenerations),
      customerId: req.auth?.user?.id ?? null,
      guestSessionId: req.auth?.user ? null : req.guestSessionId,
      profileId: profileIdNumber,
      adminId: null,
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

  // Acceso solo para el dueño (cliente o invitado con el mismo session id).
  const isOwner =
    generation &&
    ((req.auth?.user && generation.customerId === req.auth.user.id) ||
      (!req.auth?.user &&
        req.guestSessionId &&
        generation.guestSessionId === req.guestSessionId))
  if (!isOwner) {
    throw new ApiError(404, 'NOT_FOUND')
  }

  return { status: 200, data: serializeGeneration(db, generation) }
})
