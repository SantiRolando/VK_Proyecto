// Controller de herramientas de demo (/dev) — solo existe en modo mock.
// `reset` re-siembra la base y `login-as` emite un token para un usuario
// sin pasar por el login (plan §7.2).

import { ApiError } from '@api/client/api-error.js'
import { issueToken, sanitizeUser } from '@mocks/controllers/auth.controller.js'
import { getDb, resetDatabase } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

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
