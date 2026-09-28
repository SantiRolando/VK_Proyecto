// Service de direcciones (US4/US5): agenda completa del cliente (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const addressesService = {
  listMine: () => apiClient.get('/me/addresses'),
  create: (payload) => apiClient.post('/me/addresses', payload),
  update: (addressId, payload) => apiClient.patch(`/me/addresses/${addressId}`, payload),
  remove: (addressId) => apiClient.delete(`/me/addresses/${addressId}`),
  setDefault: (addressId) => apiClient.put(`/me/addresses/${addressId}/default`),
}
