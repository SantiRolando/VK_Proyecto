// Controller mock de autenticación con el contrato del backend (`/auth/**`):
// registro, login, refresh, logout, OTP (ingreso y cambio de clave) y `me`.
// Un solo formulario para clientes y admins (el rol del usuario decide el lado).
//
// Migración de invitado: al registrarse o iniciar sesión con un
// `guestSessionId`, las generaciones de ese invitado pasan al usuario y, si no
// tiene perfiles, la última con medidas se guarda como perfil «Mis medidas».

import { ApiError } from '@api/client/api-error.js'
import { decodeAuth, roleCodec } from '@api/wire.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const MOCK_OTP_CODE = '123456'
const ACCESS_TTL_SECONDS = 30 * 60
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60

// `UserResponseDTO` del backend: rol en UPPER_SNAKE, nunca credenciales.
export function serializeUser(user) {
  return {
    id: user.id,
    role: roleCodec.encode(user.type),
    name: user.name,
    email: user.email,
    whatsappPhone: user.whatsappPhone,
    pointsBalance: user.pointsBalance,
    createdAt: user.createdAt,
  }
}

function nonce() {
  return Math.random().toString(36).slice(2, 10)
}

export function issueToken(userId) {
  return `vkfit.${userId}.${nonce()}`
}

// `AuthResponseDTO` del backend.
export function issueSession(user) {
  return {
    accessToken: issueToken(user.id),
    expiresInSeconds: ACCESS_TTL_SECONDS,
    refreshToken: `vkfit-refresh.${user.id}.${nonce()}`,
    refreshExpiresInSeconds: REFRESH_TTL_SECONDS,
    user: serializeUser(user),
  }
}

function findUserByEmail(db, email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase()
  return db.users.find((user) => user.email.toLowerCase() === normalized) ?? null
}

function migrateGuest(db, guestSessionId, userId) {
  if (!guestSessionId) return

  const generations = db.sizeGenerations.filter(
    (generation) => generation.guestSessionId === guestSessionId,
  )
  if (generations.length === 0) return

  for (const generation of generations) {
    generation.guestSessionId = null
    generation.customerId = userId
  }

  if (db.measurementProfiles.some((profile) => profile.userId === userId)) return

  const latest = generations
    .filter((generation) => generation.bust != null || generation.waist != null)
    .reduce(
      (newest, generation) =>
        !newest || new Date(generation.createdAt) > new Date(newest.createdAt)
          ? generation
          : newest,
      null,
    )
  if (!latest) return

  db.measurementProfiles.push({
    id: nextId(db.measurementProfiles),
    userId,
    name: 'Mis medidas',
    height: latest.height ?? null,
    bust: latest.bust ?? null,
    waist: latest.waist ?? null,
    hip: latest.hip ?? null,
    torso: latest.torso ?? null,
    age: latest.age ?? null,
    isDefault: true,
    active: true,
  })
}

register('POST', '/auth/register', (req) => {
  const { name, email, password, whatsappPhone, guestSessionId } = req.body
  requireFields(req.body, ['name', 'email', 'password', 'whatsappPhone'])

  return mutate((db) => {
    if (findUserByEmail(db, email)) {
      throw new ApiError(409, 'EMAIL_TAKEN')
    }
    const user = {
      id: nextId(db.users),
      type: 'Customer',
      name,
      email: String(email).trim().toLowerCase(),
      password,
      whatsappPhone,
      pointsBalance: 0,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    migrateGuest(db, guestSessionId, user.id)
    return { status: 201, data: issueSession(user) }
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
    if (user.type === 'Customer') migrateGuest(db, guestSessionId, user.id)
    return { status: 200, data: issueSession(user) }
  })
})

function userOfRefreshToken(db, refreshToken) {
  const match = /^vkfit-refresh\.(\d+)\./.exec(String(refreshToken ?? ''))
  if (!match) return null
  return db.users.find((user) => user.id === Number(match[1])) ?? null
}

register('POST', '/auth/refresh', (req) => {
  requireFields(req.body, ['refreshToken'])
  const user = userOfRefreshToken(getDb(), req.body.refreshToken)
  if (!user) throw new ApiError(401, 'REFRESH_TOKEN_INVALID')
  return { status: 200, data: issueSession(user) }
})

register('POST', '/auth/logout', () => {
  // Mock: la invalidación real ocurre en el cliente (se descarta la sesión).
  return { status: 204, data: null }
})

register('POST', '/auth/otp/request', (req) => {
  requireFields(req.body, ['email'])
  // Mock: el código siempre es 123456. Responde 202 exista o no la cuenta.
  return { status: 202, data: null }
})

function verifyOtp(db, email, code) {
  const user = findUserByEmail(db, email)
  if (!user || code !== MOCK_OTP_CODE) throw new ApiError(401, 'OTP_INVALID')
  return user
}

register('POST', '/auth/otp/login', (req) => {
  const { email, code, guestSessionId } = req.body
  requireFields(req.body, ['email', 'code'])
  return mutate((db) => {
    const user = verifyOtp(db, email, code)
    if (user.type === 'Customer') migrateGuest(db, guestSessionId, user.id)
    return { status: 200, data: issueSession(user) }
  })
})

register('POST', '/auth/otp/reset-password', (req) => {
  const { email, code, newPassword } = req.body
  requireFields(req.body, ['email', 'code', 'newPassword'])
  return mutate((db) => {
    const user = verifyOtp(db, email, code)
    user.password = newPassword
    return { status: 204, data: null }
  })
})

register(
  'GET',
  '/auth/me',
  (req) => {
    return { status: 200, data: serializeUser(req.auth.user) }
  },
  { auth: 'user' },
)

// Forma que consumen las herramientas de `/dev` y los tests para adoptar una
// sesión sin pasar por el login (la misma que devuelve `authService`).
export function sessionFor(user) {
  return decodeAuth(issueSession(user))
}
