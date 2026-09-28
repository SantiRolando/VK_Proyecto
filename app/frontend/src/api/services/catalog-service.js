// Service de catálogo (US3).

import { apiClient } from '@api/client/api-client.js'

export const catalogService = {
  // Devuelve `{ items, meta }` porque la pantalla necesita `meta.hasStock`
  // y los talles adyacentes (§6.2).
  list: (params) =>
    apiClient
      .request({ method: 'GET', url: '/catalog', params })
      .then((response) => ({ items: response.data, meta: response.meta })),
  get: (productId, params) => apiClient.get(`/catalog/${productId}`, params),
}
