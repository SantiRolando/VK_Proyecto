// Service de herramientas de demo (solo responde en modo mock).

import { apiClient } from '../client/api-client.js'

export const devService = {
  reset: () => apiClient.post('/dev/reset'),
  loginAs: (userId) => apiClient.post('/dev/login-as', { userId }),
}
