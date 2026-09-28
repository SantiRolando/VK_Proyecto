// Service del catálogo del panel (US9/T089): CRUD de productos (§6.2). Las
// variantes van por `admin-inventory-service`.

import { apiClient } from '@api/client/api-client.js'

export const adminCatalogService = {
  listProducts: () =>
    apiClient
      .request({ method: 'GET', url: '/admin/products' })
      .then((response) => ({ items: response.data, meta: response.meta })),
  createProduct: (payload) => apiClient.post('/admin/products', payload),
  updateProduct: (productId, payload) =>
    apiClient.patch(`/admin/products/${productId}`, payload),
  removeProduct: (productId) => apiClient.delete(`/admin/products/${productId}`),
}
