// Service de avisos de reposición (US3).

import { apiClient } from '@api/client/api-client.js'

export const alertsService = {
  subscribe: (payload) => apiClient.post('/restock-alerts', payload),
  listMine: () => apiClient.get('/me/restock-alerts'),
  cancel: (alertId) => apiClient.delete(`/me/restock-alerts/${alertId}`),
}
