// Service de perfiles de medidas (US5/T072) contra `/profiles` del backend.
// La edición es un PUT completo: nombre y las medidas, con null en las omitidas.

import { apiClient } from '@api/client/api-client.js'
import { optionalNumber } from '@api/wire.js'

function encodeProfile(payload) {
  return {
    name: payload.name,
    height: optionalNumber(payload.height),
    bust: optionalNumber(payload.bust),
    waist: optionalNumber(payload.waist),
    hip: optionalNumber(payload.hip),
    torso: optionalNumber(payload.torso),
    age: optionalNumber(payload.age),
  }
}

export const profilesService = {
  listMine: () => apiClient.get('/profiles'),
  create: (payload) => apiClient.post('/profiles', encodeProfile(payload)),
  update: (profileId, payload) =>
    apiClient.put(`/profiles/${profileId}`, encodeProfile(payload)),
  remove: (profileId) => apiClient.delete(`/profiles/${profileId}`),
  setDefault: (profileId) => apiClient.put(`/profiles/${profileId}/default`),
}
