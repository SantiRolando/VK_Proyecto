/*
    Endpoints de la suite (`/__test/*`): solo existen en modo mock. `reset` vuelve
    al seed y `transport` ajusta latencia y tasa de fallos en caliente, para poder
    ver y probar los estados de carga y error sin reiniciar la app.
*/
import { resetDatabase } from '@mocks/db/database.js'
import { configureMockRouter, register } from '@mocks/router/mock-router.js'

register('POST', '/__test/reset', () => {
  resetDatabase()
  return { status: 204, data: null }
})

register('POST', '/__test/transport', (req) => {
  const { latencyMs, failRate } = req.body
  const overrides = {}
  if (latencyMs !== undefined) overrides.latencyMs = String(latencyMs)
  if (failRate !== undefined) overrides.failRate = Number(failRate)
  configureMockRouter(overrides)

  return { status: 200, data: overrides }
})
