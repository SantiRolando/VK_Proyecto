// Service de autenticación: solo conoce paths y DTOs del contrato (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const authService = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  requestOtp: (payload) => apiClient.post('/auth/otp/request', payload),
  verifyOtp: (payload) => apiClient.post('/auth/otp/verify', payload),
  forgotPassword: (payload) => apiClient.post('/auth/password/forgot', payload),
  resetPassword: (payload) => apiClient.post('/auth/password/reset', payload),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
}
