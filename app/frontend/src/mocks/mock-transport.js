/*
  Transporte mock: adapta la interfaz del transporte al `mock-router`. La configuración
  sale del entorno y el import de los controllers es un side effect: cada recurso se
  registra al cargarse.
*/

import { env } from '@config/env.js'
import { configureMockRouter, handle } from '@mocks/router/mock-router.js'
import '@mocks/controllers/register-all.js'

configureMockRouter({ latencyMs: env.mockLatencyMs, failRate: env.mockFailRate })

function parseUrl(url) {
  const [path, queryString = ''] = url.split('?')
  const query = {}
  for (const [key, value] of new URLSearchParams(queryString)) {
    query[key] = value
  }
  return { path, query }
}

export const mockTransport = {
  send(config) {
    const { method, url, params, body, auth, guestSessionId } = config
    const { path, query } = parseUrl(url)
    return handle({
      method: method.toUpperCase(),
      url: path,
      query: { ...query, ...(params ?? {}) },
      body,
      auth,
      guestSessionId,
    })
  },
}
