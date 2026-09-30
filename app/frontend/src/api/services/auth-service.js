// Service de autenticación contra el contrato del backend (`/auth/**`).
//
// El backend devuelve `{ accessToken, refreshToken, user }` (ver
// `decodeAuth`). El `guestSessionId` del dispositivo viaja en registro y login
// para que las generaciones hechas como invitado pasen a la cuenta.

import { apiClient } from '@api/client/api-client.js'
import { getGuestSessionId } from '@api/client/session.js'
import { decodeAuth, decodeUser, normalizePhone } from '@api/wire.js'

export const authService = {
  register: ({ name, email, password, whatsappPhone }) =>
    apiClient
      .post('/auth/register', {
        name,
        email,
        password,
        whatsappPhone: normalizePhone(whatsappPhone),
        guestSessionId: getGuestSessionId(),
      })
      .then(decodeAuth),
  login: ({ email, password }) =>
    apiClient
      .post('/auth/login', { email, password, guestSessionId: getGuestSessionId() })
      .then(decodeAuth),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
  // Un código por mail sirve tanto para ingresar como para cambiar la clave.
  requestOtp: ({ email }) => apiClient.post('/auth/otp/request', { email }),
  loginWithOtp: ({ email, code }) =>
    apiClient
      .post('/auth/otp/login', { email, code, guestSessionId: getGuestSessionId() })
      .then(decodeAuth),
  resetPassword: ({ email, code, newPassword }) =>
    apiClient.post('/auth/otp/reset-password', { email, code, newPassword }),
  me: () => apiClient.get('/auth/me').then(decodeUser),
}
