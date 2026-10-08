/*
  Cliente de datos único de la app: los services conocen solo paths, métodos y DTOs, y acá se
  decide el transporte según `VITE_API_MODE` (`mock` | `http` | `hybrid`). El transporte mock
  se importa dinámico.

  Sesión: el access token se renueva con el refresh token antes de un pedido si ya venció, o
  tras un 401 `UNAUTHENTICATED`; hay una sola renovación en vuelo y un solo reintento.
*/

import { isApiError } from '@api/client/api-error.js'
import { isBackendRoute } from '@api/client/backend-coverage.js'
import { httpTransport } from '@api/client/http-transport.js'
import {
  clearSession,
  getGuestSessionId,
  getSession,
  isAccessTokenExpired,
  notifyUnauthorized,
  setSession,
} from '@api/client/session.js'
import { decodeAuth, decodePage } from '@api/wire.js'

const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock'
const REFRESH = { method: 'POST', url: '/auth/refresh' }

async function getTransport(config) {
  if (API_MODE === 'http') return httpTransport
  if (API_MODE === 'hybrid' && isBackendRoute(config.method, config.url)) {
    return httpTransport
  }
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

let refreshing = null

/*
  Un solo refresh en vuelo: el backend invalida el refresh token usado y toma un segundo uso
  como robo, así que va por el transporte dueño de `/auth/refresh`. Devuelve true si hay sesión
  nueva; un corte de red no la cierra.
*/
function refreshSession() {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = getSession()?.refreshToken
      if (!refreshToken) return false
      try {
        const transport = await getTransport(REFRESH)
        const response = await transport.send({
          ...REFRESH,
          body: { refreshToken },
          headers: {},
        })
        const auth = decodeAuth(response.data)
        setSession(auth.token, auth.user, auth.refreshToken, auth.expiresInSeconds)
        return true
      } catch (error) {
        if (isApiError(error) && (error.status === 401 || error.status === 400)) {
          clearSession()
        }
        return false
      }
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

function isUnauthenticated(error) {
  return isApiError(error) && error.code === 'UNAUTHENTICATED'
}

/*
  `send` devuelve la respuesta completa `{ status, data, meta }`; los métodos de conveniencia
  devuelven solo `data` (lo que consumen los hooks).
*/
async function send(config) {
  const transport = await getTransport(config)
  if (config.url === REFRESH.url) return transport.send(withSession(config))

  /*
    Las rutas públicas aceptan un token vencido como si fuera un invitado, así que hay que
    renovar antes de mandar, no después.
  */
  if (getSession()?.refreshToken && isAccessTokenExpired(getSession())) {
    await refreshSession()
  }

  const sent = withSession(config)
  try {
    return await transport.send(sent)
  } catch (error) {
    if (!isUnauthenticated(error) || !sent.auth) throw error

    // Otra pestaña (o un refresh anterior) ya cambió el token: alcanza con reintentar.
    if (getSession()?.token && getSession().token !== sent.auth.token) {
      return transport.send(withSession(config))
    }
    if (await refreshSession()) {
      return transport.send(withSession(config))
    }
    if (!getSession()) notifyUnauthorized()
    throw error
  }
}

function unwrap(response) {
  return response.data
}

/*
  Listado paginado, siempre con la misma forma. El mock manda los items en `data` y la
  paginación en `meta`; el backend real manda el envelope (`items`, `totalElements`, …)
  dentro del cuerpo, y de eso se encarga `decodePage`.
*/
async function getList(url, params) {
  const response = await send({ method: 'GET', url, params })
  if (response.meta !== undefined) {
    return { items: response.data ?? [], meta: response.meta }
  }
  return decodePage(response.data)
}

export const apiClient = {
  get: (url, params) => send({ method: 'GET', url, params }).then(unwrap),
  getList,
  post: (url, body) => send({ method: 'POST', url, body }).then(unwrap),
  patch: (url, body) => send({ method: 'PATCH', url, body }).then(unwrap),
  put: (url, body) => send({ method: 'PUT', url, body }).then(unwrap),
  delete: (url) => send({ method: 'DELETE', url }).then(unwrap),
}
