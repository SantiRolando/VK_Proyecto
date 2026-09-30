// Controller de herramientas de demo (/dev) — solo existe en modo mock.
// `reset` re-siembra la base y `login-as` emite un token para un usuario
// sin pasar por el login (plan §7.2).

import { ApiError } from '@api/client/api-error.js'
import { sessionFor } from '@mocks/controllers/auth.controller.js'
import { getDb, resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, register } from '@mocks/router/mock-router.js'

register('POST', '/dev/reset', () => {
  resetDatabase()
  return { status: 204, data: null }
})

// Latencia y tasa de fallos en caliente (T034/T107): así se pueden ver y probar
// los estados de carga y error sin reiniciar la app.
register('POST', '/dev/router', (req) => {
  const { latencyMs, failRate } = req.body
  const overrides = {}
  if (latencyMs !== undefined) overrides.latencyMs = String(latencyMs)
  if (failRate !== undefined) overrides.failRate = Number(failRate)
  configureMockRouter(overrides)

  return { status: 200, data: overrides }
})

register('POST', '/dev/login-as', (req) => {
  const { userId } = req.body
  const user = getDb().users.find((item) => item.id === Number(userId))
  if (!user) throw new ApiError(404, 'NOT_FOUND')
  return { status: 200, data: sessionFor(user) }
})
