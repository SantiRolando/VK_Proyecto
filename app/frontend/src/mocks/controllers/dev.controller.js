// Controller de herramientas de demo (/dev) — solo existe en modo mock.
// `reset` re-siembra la base y `login-as` emite un token para un usuario
// sin pasar por el login (plan §7.2).

import { ApiError } from '../../api/client/api-error.js'
import { getDb, resetDatabase } from '../db/database.js'
import { register } from '../router/mock-router.js'
import { issueToken, sanitizeUser } from './auth.controller.js'

register('POST', '/dev/reset', () => {
  resetDatabase()
  return { status: 204, data: null }
})

register('POST', '/dev/login-as', (req) => {
  const { userId } = req.body
  const user = getDb().users.find((item) => item.id === Number(userId))
  if (!user) throw new ApiError(404, 'NOT_FOUND')
  return { status: 200, data: { user: sanitizeUser(user), token: issueToken(user.id) } }
})
