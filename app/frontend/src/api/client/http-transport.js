// Transporte HTTP real (VITE_API_MODE=http): `fetch` contra la API REST,
// con mapeo de errores al contrato `{ error: { code, details? } }` (§6.1).

import { ApiError } from './api-error.js'
import { env } from '../../config/env.js'

const FALLBACK_CODES = {
  400: 'VALIDATION_ERROR',
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

export const httpTransport = {
  async send({ method, url, params, body, headers = {} }) {
    const requestHeaders = {
      Accept: 'application/json',
      ...headers,
    }
    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json'
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

    const payload = await parseJson(response)

    if (!response.ok) {
      const error = payload?.error ?? {}
      throw new ApiError(
        response.status,
        error.code ?? FALLBACK_CODES[response.status] ?? 'SERVER_ERROR',
        error.details,
      )
    }

    return { status: response.status, data: payload?.data, meta: payload?.meta }
  },
}
