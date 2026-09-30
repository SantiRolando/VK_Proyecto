// Service de inventario del panel (US9/T089): existencias por variante y
// movimientos de stock (§6.2). Las variantes se dan de alta y editan por
// `admin-catalog-service`.
//
// Pendiente en el backend (módulo de stock): hoy responde el mock.

import { apiClient } from '@api/client/api-client.js'

export const adminInventoryService = {
  // Los listados son paginados: devuelven `{ items, meta }`.
  listVariants: (params) =>
    apiClient
      .request({ method: 'GET', url: '/admin/variants', params })
      .then((response) => ({ items: response.data, meta: response.meta })),
  createTransaction: (payload) => apiClient.post('/admin/stock-transactions', payload),
  listReasons: () => apiClient.get('/admin/stock-transactions/reasons'),
  listTransactions: (params) =>
    apiClient
      .request({ method: 'GET', url: '/admin/stock-transactions', params })
      .then((response) => ({ items: response.data, meta: response.meta })),
}
