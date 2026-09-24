// Transporte mock: adapta la interfaz del transporte al `mock-router`.
// Se registra la configuración desde el entorno y se importan los controllers
// (side effect: `register(...)` de cada recurso).

import { configureMockRouter, handle } from './router/mock-router.js'
import { env } from '../config/env.js'
import './controllers/register-all.js'

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
