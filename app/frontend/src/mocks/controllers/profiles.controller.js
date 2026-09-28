// Controller de perfiles de medidas (US5/T071): listado, alta, edición, baja
// lógica y marca de predeterminado. Un solo perfil predeterminado por usuario
// (§5.2).
//
// La baja es lógica (`active`) para no romper el historial, que referencia
// `profileId`; `active` es una extensión del mock, igual que en ADDRESS.

import { ApiError } from '@api/client/api-error.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { hasMeasures, readMeasures } from '@mocks/domain/measures.js'
import { register } from '@mocks/router/mock-router.js'

export function serializeProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    height: profile.height,
    bust: profile.bust,
    waist: profile.waist,
    hip: profile.hip,
    torso: profile.torso,
    isDefault: Boolean(profile.isDefault),
  }
}

function mineProfiles(db, userId) {
  return db.measurementProfiles.filter(
    (profile) => profile.userId === userId && profile.active !== false,
  )
}

function findMine(db, userId, profileId) {
  return mineProfiles(db, userId).find((profile) => profile.id === profileId) ?? null
}

// Si no quedó ningún predeterminado (p. ej. borraron el que lo era), el más
// antiguo que queda pasa a serlo.
function ensureDefault(profiles) {
  if (profiles.length === 0) return
  if (profiles.some((profile) => profile.isDefault)) return

  const oldest = profiles.reduce((best, profile) =>
    profile.id < best.id ? profile : best,
  )
  oldest.isDefault = true
}

register(
  'GET',
  '/me/profiles',
  (req) => {
    const profiles = mineProfiles(getDb(), req.auth.user.id).sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id,
    )

    return { status: 200, data: profiles.map(serializeProfile) }
  },
  { auth: 'user' },
)

register(
  'POST',
  '/me/profiles',
  (req) => {
    const { isDefault = false } = req.body
    const name = String(req.body.name ?? '').trim()
    if (!name) throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['name'] })
    const measures = readMeasures(req.body)

    return mutate((db) => {
      const userId = req.auth.user.id
      const mine = mineProfiles(db, userId)
      // El primer perfil (o el que se pide) es el predeterminado.
      const makeDefault = Boolean(isDefault) || mine.length === 0
      if (makeDefault) {
        for (const other of mine) other.isDefault = false
      }

      const profile = {
        id: nextId(db.measurementProfiles),
        userId,
        name,
        ...measures,
        isDefault: makeDefault,
        active: true,
      }
      db.measurementProfiles.push(profile)

      return { status: 201, data: serializeProfile(profile) }
    })
  },
  { auth: 'user' },
)

register(
  'PATCH',
  '/me/profiles/:id',
  (req) => {
    const withName = req.body.name !== undefined
    const name = withName ? String(req.body.name).trim() : null
    if (withName && !name) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['name'] })
    }

    // Las medidas viajan completas cuando se editan (el formulario manda las 5).
    const measures = hasMeasures(req.body) ? readMeasures(req.body) : null

    return mutate((db) => {
      const userId = req.auth.user.id
      const profile = findMine(db, userId, Number(req.params.id))
      if (!profile) throw new ApiError(404, 'NOT_FOUND')

      if (withName) profile.name = name
      if (measures) Object.assign(profile, measures)

      return { status: 200, data: serializeProfile(profile) }
    })
  },
  { auth: 'user' },
)

register(
  'DELETE',
  '/me/profiles/:id',
  (req) => {
    return mutate((db) => {
      const userId = req.auth.user.id
      const profile = findMine(db, userId, Number(req.params.id))
      if (!profile) throw new ApiError(404, 'NOT_FOUND')

      profile.active = false
      profile.isDefault = false
      ensureDefault(mineProfiles(db, userId))

      return { status: 204, data: null }
    })
  },
  { auth: 'user' },
)

register(
  'PUT',
  '/me/profiles/:id/default',
  (req) => {
    return mutate((db) => {
      const userId = req.auth.user.id
      const profile = findMine(db, userId, Number(req.params.id))
      if (!profile) throw new ApiError(404, 'NOT_FOUND')

      for (const other of mineProfiles(db, userId)) other.isDefault = false
      profile.isDefault = true

      return { status: 200, data: serializeProfile(profile) }
    })
  },
  { auth: 'user' },
)
