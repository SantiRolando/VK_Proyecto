// Service de herramientas de demo (solo responde en modo mock).

import { apiClient } from '@api/client/api-client.js'

export const devService = {
  reset: () => apiClient.post('/dev/reset'),
  loginAs: (userId) => apiClient.post('/dev/login-as', { userId }),
  // Simulación de latencia y fallos (T034/T107): `{ latencyMs, failRate }`.
  setMockRouter: (payload) => apiClient.post('/dev/router', payload),
}
