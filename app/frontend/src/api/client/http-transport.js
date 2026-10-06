/*
  Transporte HTTP real (`http` / `hybrid`): `fetch` contra la API REST. El backend responde el
  cuerpo pelado (sin envelope) y los errores con `{ status, error, code, message, fields? }`
  (`error` es el nombre del código HTTP y `code` el estable); acá se adaptan a la forma que
  consume el resto del FE: `{ status, data, meta }` y `ApiError(status, code, details)`.
*/

import { ApiError } from '@api/client/api-error.js'
import { env } from '@config/env.js'

const FALLBACK_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
}

async function parseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function buildUrl(url, params) {
  const target = new URL(`${env.apiBaseUrl}${url}`, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        target.searchParams.set(key, String(value))
      }
    }
  }
  return target
}

export function toApiError(status, payload) {
  const body = payload && typeof payload === 'object' ? payload : {}
  const error = typeof body.code === 'string' ? body : (body.error ?? {})
  return new ApiError(status, error.code ?? FALLBACK_CODES[status] ?? 'SERVER_ERROR', {
    fields: error.fields,
    message: error.message,
  })
}

export const httpTransport = {
  async send({ method, url, params, body, headers = {}, guestSessionId }) {
    const requestHeaders = {
      Accept: 'application/json',
      ...headers,
    }
    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json'
    }
    /*
      Identifica al invitado (lo lee `/public/fit/generations/{id}`); con sesión el backend lo
      ignora.
    */
    if (guestSessionId) {
      requestHeaders['X-Guest-Session-Id'] = guestSessionId
    }

    let response
    try {
      response = await fetch(buildUrl(url, params), {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR')
    }

    const payload = response.status === 204 ? null : await parseJson(response)

    if (!response.ok) {
      throw toApiError(response.status, payload)
    }

    return { status: response.status, data: payload, meta: undefined }
  },
}
