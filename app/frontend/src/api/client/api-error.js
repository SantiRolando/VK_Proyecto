/*
  Error de API: status HTTP + `{ code, details? }`. El FE nunca muestra el `message` del
  servidor, traduce `code` con `useI18n()`.
*/

export class ApiError extends Error {
  constructor(status, code, details) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function isApiError(error) {
  return error instanceof ApiError
}
