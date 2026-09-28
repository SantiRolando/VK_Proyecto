// Service de inventario del panel (US9/T089): variantes y movimientos de stock
// (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const adminInventoryService = {
  // Los listados son paginados: devuelven `{ items, meta }`.
  listVariants: (params) =>
    apiClient
      .request({ method: 'GET', url: '/admin/variants', params })
      .then((response) => ({ items: response.data, meta: response.meta })),
  createVariant: (payload) => apiClient.post('/admin/variants', payload),
  updateVariant: (variantId, payload) =>
    apiClient.patch(`/admin/variants/${variantId}`, payload),
  createTransaction: (payload) => apiClient.post('/admin/stock-transactions', payload),
  listReasons: () => apiClient.get('/admin/stock-transactions/reasons'),
  listTransactions: (params) =>
    apiClient
      .request({ method: 'GET', url: '/admin/stock-transactions', params })
      .then((response) => ({ items: response.data, meta: response.meta })),
}
