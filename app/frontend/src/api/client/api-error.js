// Error de API con la forma del contrato (§6.1 del plan):
// HTTP status + { error: { code, details? } }.
//
// El FE nunca muestra `message` del servidor: traduce `code` con `useI18n()`.

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
