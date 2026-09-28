// Cliente de datos único de la app (§4.3 del plan).
//
// Los services conocen solo paths/métodos/DTOs; `api-client` decide el
// transporte según `VITE_API_MODE`. El import del transporte mock es
// dinámico: en el build `http` la rama muerta se elimina y `src/mocks/`
// no entra al bundle (SC-005).

import { ApiError, isApiError } from '@api/client/api-error.js'
import { httpTransport } from '@api/client/http-transport.js'
import { getGuestSessionId, getSession, notifyUnauthorized } from '@api/client/session.js'

const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock'

async function getTransport() {
  if (API_MODE === 'http') return httpTransport
  const module = await import('@mocks/mock-transport.js')
  return module.mockTransport
}

function withSession(config) {
  const session = getSession()
  const headers = { ...(config.headers ?? {}) }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  return {
    ...config,
    headers,
    auth: session?.token ? { token: session.token } : undefined,
    guestSessionId: getGuestSessionId(),
  }
}

// `request` devuelve la respuesta completa `{ status, data, meta }`; los
// métodos de conveniencia devuelven solo `data` (lo que consumen los hooks).
async function send(config) {
  try {
    const transport = await getTransport()
    return await transport.send(withSession(config))
  } catch (error) {
    // 401 por sesión expirada (no credenciales inválidas): dispara logout
    // global. El handler lo registra el AuthProvider.
    if (isApiError(error) && error.code === 'UNAUTHENTICATED') {
      notifyUnauthorized()
    }
    throw error
  }
}

function unwrap(response) {
  return response.data
}

export const apiClient = {
  request: send,
  get: (url, params) => send({ method: 'GET', url, params }).then(unwrap),
  post: (url, body) => send({ method: 'POST', url, body }).then(unwrap),
  patch: (url, body) => send({ method: 'PATCH', url, body }).then(unwrap),
  put: (url, body) => send({ method: 'PUT', url, body }).then(unwrap),
  delete: (url) => send({ method: 'DELETE', url }).then(unwrap),
}

export { ApiError, isApiError }
