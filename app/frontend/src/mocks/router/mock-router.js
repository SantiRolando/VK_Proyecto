// Router REST simulado (§4.3 del plan).
//
// Los controllers se registran con `register(method, pattern, handler, {auth})`
// y `handle(request)` se comporta como un servidor:
//   - matchea método + path con `:params`,
//   - resuelve auth por rol (401/403 como HTTP),
//   - aplica latencia simulada y tasa de fallos configurable,
//   - propaga `ApiError` tal cual lo haría el backend.
//
// Forma del request:  { method, url, query, body, auth: {token}, guestSessionId }
// Forma del response: { status, data, meta } (o `ApiError` lanzado).

import { ApiError } from '@api/client/api-error.js'
import { getDb } from '@mocks/db/database.js'

const registered = []
const config = { latencyMs: '250-600', failRate: 0 }

export function register(method, pattern, handler, options = {}) {
  const { regex, keys } = patternToRegex(pattern)
  registered.push({
    method: method.toUpperCase(),
    pattern,
    regex,
    keys,
    handler,
    auth: options.auth ?? null, // null | 'user' | 'customer' | 'admin'
  })
}

export function configureMockRouter(overrides) {
  Object.assign(config, overrides)
}

export function resetMockRouter() {
  registered.length = 0
}

function patternToRegex(pattern) {
  const keys = []
  const source = pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    keys.push(key)
    return '([^/]+)'
  })
  return { regex: new RegExp(`^${source}$`), keys }
}

function match(method, url) {
  for (const route of registered) {
    if (route.method !== method) continue
    const found = url.match(route.regex)
    if (found) {
      const params = {}
      route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(found[index + 1])
      })
      return { route, params }
    }
  }
  return null
}

async function applyLatency() {
  const spec = config.latencyMs
  if (!spec || spec === '0') return
  const [min, max] = String(spec).split('-').map(Number)
  const ms = max > min ? min + Math.random() * (max - min) : min
  await new Promise((resolve) => setTimeout(resolve, ms))
}

// Tokens mock (prototipo: sin firma ni expiración): access `vkfit.<userId>.<nonce>`
// y refresh `vkfit-refresh.<userId>.<nonce>`. Un refresh nunca autentica.
//
// En modo híbrido llega el JWT del backend: se lee su payload (sin verificar la
// firma, es un mock) y se usa el usuario mock con el mismo id y rol, o uno
// sintético con los datos del token, para que las rutas que siguen en el mock
// no rechacen una sesión real.
function resolveUser(auth) {
  if (!auth?.token) return null
  const match = /^vkfit\.(\d+)\./.exec(auth.token)
  if (match) return getDb().users.find((user) => user.id === Number(match[1])) ?? null
  return userFromJwt(auth.token)
}

function userFromJwt(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const id = Number(payload.sub)
    const type = payload.role === 'ADMIN' ? 'Admin' : 'Customer'
    const local = getDb().users.find((user) => user.id === id && user.type === type)
    return (
      local ?? {
        id,
        type,
        name: payload.email ?? `user-${id}`,
        email: payload.email ?? '',
        whatsappPhone: '',
        pointsBalance: 0,
        createdAt: new Date().toISOString(),
      }
    )
  } catch {
    return null
  }
}

function checkAuth(user, required) {
  if (!required) return
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED')
  if (required === 'admin' && user.type !== 'Admin') {
    throw new ApiError(403, 'FORBIDDEN')
  }
  if (required === 'customer' && user.type !== 'Customer') {
    throw new ApiError(403, 'FORBIDDEN')
  }
}

function toApiError(result) {
  const code = result.error?.code ?? 'SERVER_ERROR'
  return new ApiError(result.status, code, result.error?.details)
}

export async function handle(request) {
  await applyLatency()

  // Las herramientas de `/dev` no simulan fallos: si lo hicieran, no habría
  // forma de apagar la simulación desde la app (ni de testearlo).
  const isDevTool = request.url.startsWith('/dev/')
  if (!isDevTool && config.failRate > 0 && Math.random() < config.failRate) {
    throw new ApiError(500, 'SERVER_ERROR')
  }

  const found = match(request.method.toUpperCase(), request.url)
  if (!found) {
    throw new ApiError(404, 'NOT_FOUND')
  }

  const user = resolveUser(request.auth)
  checkAuth(user, found.route.auth)

  const req = {
    params: found.params,
    query: request.query ?? {},
    body: request.body ?? {},
    auth: user ? { token: request.auth.token, user } : null,
    guestSessionId: request.guestSessionId ?? null,
  }

  const result = await found.route.handler(req)
  if (result.status >= 400) {
    throw toApiError(result)
  }
  return result
}
