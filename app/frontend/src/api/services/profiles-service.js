// Service de perfiles de medidas (US5/T072): CRUD de la agenda del cliente
// (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const profilesService = {
  listMine: () => apiClient.get('/me/profiles'),
  create: (payload) => apiClient.post('/me/profiles', payload),
  update: (profileId, payload) => apiClient.patch(`/me/profiles/${profileId}`, payload),
  remove: (profileId) => apiClient.delete(`/me/profiles/${profileId}`),
  setDefault: (profileId) => apiClient.put(`/me/profiles/${profileId}/default`),
}
