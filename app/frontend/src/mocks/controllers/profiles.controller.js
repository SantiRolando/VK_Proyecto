// Controller de perfiles de medidas (US5/T071) con el contrato del backend
// (`/profiles`): listado, alta, edición completa (PUT), baja y default.
// Un solo perfil predeterminado por usuario; borrar el default deja al usuario
// sin default (igual que el backend).
//
// La baja es lógica (`active`) para no romper el historial, que referencia
// `profileId`; el backend en cambio pone `profileId` en null.

import { ApiError } from '@api/client/api-error.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const MEASURES = ['height', 'bust', 'waist', 'hip', 'torso', 'age']
const RANGES = {
  height: [50, 250],
  bust: [30, 200],
  waist: [30, 200],
  hip: [30, 200],
  torso: [50, 300],
  age: [1, 120],
}

export function serializeProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    height: profile.height ?? null,
    bust: profile.bust ?? null,
    waist: profile.waist ?? null,
    hip: profile.hip ?? null,
    torso: profile.torso ?? null,
    age: profile.age ?? null,
    isDefault: Boolean(profile.isDefault),
    createdAt: profile.createdAt ?? null,
    updatedAt: profile.updatedAt ?? null,
  }
}

// `MeasurementProfileRequestDTO`: nombre obligatorio, medidas opcionales en rango.
function readProfile(body) {
  const fields = {}
  const name = String(body.name ?? '').trim()
  if (!name) fields.name = 'must not be blank'
  if (name.length > 60) fields.name = 'size must be between 0 and 60'

  const measures = {}
  for (const field of MEASURES) {
    const raw = body[field]
    if (raw === undefined || raw === null || raw === '') {
      measures[field] = null
      continue
    }
    const value = Number(raw)
    const [min, max] = RANGES[field]
    if (!Number.isFinite(value) || value < min || value > max) {
      fields[field] = `must be between ${min} and ${max}`
    }
    measures[field] = value
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', { fields, message: 'Validation failed' })
  }
  return { name, ...measures }
}

function mineProfiles(db, userId) {
  return db.measurementProfiles.filter(
    (profile) => profile.userId === userId && profile.active !== false,
  )
}

function findMine(db, userId, profileId) {
  return mineProfiles(db, userId).find((profile) => profile.id === profileId) ?? null
}

function requireMine(db, userId, profileId) {
  const profile = findMine(db, userId, profileId)
  if (!profile) throw new ApiError(404, 'NOT_FOUND')
  return profile
}

register(
  'GET',
  '/profiles',
  (req) => {
    const profiles = mineProfiles(getDb(), req.auth.user.id).sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id,
    )
    return { status: 200, data: profiles.map(serializeProfile) }
  },
  { auth: 'user' },
)

register(
  'GET',
  '/profiles/:id',
  (req) => {
    const profile = requireMine(getDb(), req.auth.user.id, Number(req.params.id))
    return { status: 200, data: serializeProfile(profile) }
  },
  { auth: 'user' },
)

register(
  'POST',
  '/profiles',
  (req) => {
    const values = readProfile(req.body)
    return mutate((db) => {
      const userId = req.auth.user.id
      const now = new Date().toISOString()
      const profile = {
        id: nextId(db.measurementProfiles),
        userId,
        ...values,
        // El primer perfil del usuario queda como default.
        isDefault: mineProfiles(db, userId).length === 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      }
      db.measurementProfiles.push(profile)
      return { status: 201, data: serializeProfile(profile) }
    })
  },
  { auth: 'user' },
)

register(
  'PUT',
  '/profiles/:id',
  (req) => {
    const values = readProfile(req.body)
    return mutate((db) => {
      const profile = requireMine(db, req.auth.user.id, Number(req.params.id))
      Object.assign(profile, values, { updatedAt: new Date().toISOString() })
      return { status: 200, data: serializeProfile(profile) }
    })
  },
  { auth: 'user' },
)

register(
  'DELETE',
  '/profiles/:id',
  (req) => {
    return mutate((db) => {
      const profile = requireMine(db, req.auth.user.id, Number(req.params.id))
      profile.active = false
      profile.isDefault = false
      return { status: 204, data: null }
    })
  },
  { auth: 'user' },
)

register(
  'PUT',
  '/profiles/:id/default',
  (req) => {
    return mutate((db) => {
      const userId = req.auth.user.id
      const profile = requireMine(db, userId, Number(req.params.id))
      for (const other of mineProfiles(db, userId)) other.isDefault = false
      profile.isDefault = true
      return { status: 200, data: serializeProfile(profile) }
    })
  },
  { auth: 'user' },
)
