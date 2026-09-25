// Controller mock de autenticación (§6.2 del plan): register, login, OTP,
// recuperación de contraseña, me y logout. Un solo formulario para clientes
// y admins (el `type` del usuario decide el lado).
//
// Migración de invitado (US2/Q-05): al registrarse o iniciar sesión con un
// `guestSessionId`, las generaciones de ese invitado pasan al usuario y se
// crea el perfil por defecto con las medidas de la última generación.

import { ApiError } from '../../api/client/api-error.js'
import { getDb, mutate, nextId } from '../db/database.js'
import { register } from '../router/mock-router.js'
import { requireFields } from './controller-utils.js'

const MOCK_OTP_CODE = '123456'

// Nunca se serializan credenciales ni códigos OTP (§5.2).
export function sanitizeUser(user) {
  const SENSITIVE_FIELDS = ['password', 'otpCode', 'otpExpiresAt']
  return Object.fromEntries(
    Object.entries(user).filter(([key]) => !SENSITIVE_FIELDS.includes(key)),
  )
}

export function issueToken(userId) {
  const nonce = Math.random().toString(36).slice(2, 10)
  return `vkfit.${userId}.${nonce}`
}

function findUserByEmail(db, email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  return db.users.find((user) => user.email.toLowerCase() === normalized) ?? null
}

function migrateGuest(db, guestSessionId, userId, profileName) {
  if (!guestSessionId) return

  const generations = db.sizeGenerations.filter(
    (generation) => generation.guestSessionId === guestSessionId,
  )
  if (generations.length === 0) return

  for (const generation of generations) {
    generation.guestSessionId = null
    generation.customerId = userId
  }

  // Perfil por defecto con las medidas de la última generación del invitado.
  const latest = generations.reduce(
    (newest, generation) =>
      new Date(generation.createdAt) > new Date(newest.createdAt) ? generation : newest,
    generations[0],
  )
  db.measurementProfiles.push({
    id: nextId(db.measurementProfiles),
    userId,
    name: profileName || 'Default',
    height: latest.height,
    bust: latest.bust,
    waist: latest.waist,
    hip: latest.hip,
    torso: latest.torso,
    isDefault: !db.measurementProfiles.some((profile) => profile.userId === userId),
  })
}

register('POST', '/auth/register', (req) => {
  const { name, email, password, whatsappPhone, guestSessionId, migrationProfileName } =
    req.body
  requireFields(req.body, ['name', 'email', 'password', 'whatsappPhone'])

  return mutate((db) => {
    if (findUserByEmail(db, email)) {
      throw new ApiError(409, 'EMAIL_TAKEN')
    }
    const user = {
      id: nextId(db.users),
      type: 'Customer',
      name,
      email: String(email).trim(),
      password,
      whatsappPhone,
      pointsBalance: 0,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    migrateGuest(db, guestSessionId, user.id, migrationProfileName)
    return { status: 201, data: { user: sanitizeUser(user), token: issueToken(user.id) } }
  })
})

register('POST', '/auth/login', (req) => {
  const { email, password, guestSessionId } = req.body
  requireFields(req.body, ['email', 'password'])

  return mutate((db) => {
    const user = findUserByEmail(db, email)
    if (!user || user.password !== password) {
      throw new ApiError(401, 'INVALID_CREDENTIALS')
    }
    if (guestSessionId) {
      migrateGuest(db, guestSessionId, user.id, null)
    }
    return { status: 200, data: { user: sanitizeUser(user), token: issueToken(user.id) } }
  })
})

register('POST', '/auth/otp/request', (req) => {
  const { email } = req.body
  requireFields(req.body, ['email'])
  const user = findUserByEmail(getDb(), email)
  if (!user) throw new ApiError(404, 'NOT_FOUND')
  // Mock: el código siempre es 123456 (plan §7.2).
  return { status: 204, data: null }
})

register('POST', '/auth/otp/verify', (req) => {
  const { email, code } = req.body
  requireFields(req.body, ['email', 'code'])
  const user = findUserByEmail(getDb(), email)
  if (!user) throw new ApiError(404, 'NOT_FOUND')
  if (code !== MOCK_OTP_CODE) throw new ApiError(401, 'OTP_INVALID')
  return { status: 200, data: { user: sanitizeUser(user), token: issueToken(user.id) } }
})

register('POST', '/auth/password/forgot', (req) => {
  requireFields(req.body, ['email'])
  return { status: 204, data: null }
})

register('POST', '/auth/password/reset', (req) => {
  const { email, password } = req.body
  requireFields(req.body, ['email', 'token', 'password'])
  return mutate((db) => {
    const user = findUserByEmail(db, email)
    if (!user) throw new ApiError(404, 'NOT_FOUND')
    user.password = password
    return { status: 204, data: null }
  })
})

register('GET', '/auth/me', (req) => {
  return { status: 200, data: sanitizeUser(req.auth.user) }
}, { auth: 'user' })

register('POST', '/auth/logout', () => {
  // Mock: la invalidación real ocurre en el cliente (se descarta el token).
  return { status: 204, data: null }
}, { auth: 'user' })
