// Catálogo público, sin sesión.

import { apiClient } from '@api/client/api-client.js'

export const catalogService = {
  // La pantalla necesita `meta.hasStock` y los talles adyacentes.
  list: (params) => apiClient.getList('/catalog', params),
  get: (productId, params) => apiClient.get(`/catalog/${productId}`, params),
}
