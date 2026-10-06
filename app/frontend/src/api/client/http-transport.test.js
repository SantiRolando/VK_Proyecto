import { toApiError } from '@api/client/http-transport.js'
import { describe, expect, it } from 'vitest'

/*
  Forma real de `ErrorResponse` del backend: `error` es el nombre del código HTTP y `code` el
  estable; `fields` solo en VALIDATION_ERROR.
*/
describe('http-transport: errores del backend', () => {
  it('lee el código estable y los campos de una validación', () => {
    const error = toApiError(400, {
      timestamp: '2026-09-29T20:00:00Z',
      status: 400,
      error: 'Bad Request',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fields: { password: 'size must be between 8 and 64' },
    })
    expect(error.status).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.details.fields).toEqual({ password: 'size must be between 8 and 64' })
  })

  it('distingue credenciales inválidas de sesión expirada', () => {
    expect(
      toApiError(401, { status: 401, error: 'Unauthorized', code: 'INVALID_CREDENTIALS' })
        .code,
    ).toBe('INVALID_CREDENTIALS')
    expect(toApiError(401, null).code).toBe('UNAUTHENTICATED')
  })

  it('acepta el envelope `{ error: { code } }` y cae al código por status', () => {
    expect(toApiError(409, { error: { code: 'EMAIL_TAKEN' } }).code).toBe('EMAIL_TAKEN')
    expect(toApiError(503, 'gateway text').code).toBe('SERVER_ERROR')
  })
})
