// Service de direcciones (T059): agenda mínima que necesita el checkout.

import { apiClient } from '../client/api-client.js'

export const addressesService = {
  listMine: () => apiClient.get('/me/addresses'),
  create: (payload) => apiClient.post('/me/addresses', payload),
}
