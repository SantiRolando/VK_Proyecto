/*
  Inventario del panel: existencias por variante y movimientos de stock. Las variantes se dan
  de alta y se editan por `admin-catalog-service`. El módulo de stock del backend está
  pendiente: hoy responde el mock.
*/

import { apiClient } from '@api/client/api-client.js'

export const adminInventoryService = {
  listVariants: (params) => apiClient.getList('/admin/variants', params),
  createTransaction: (payload) => apiClient.post('/admin/stock-transactions', payload),
  listReasons: () => apiClient.get('/admin/stock-transactions/reasons'),
  listTransactions: (params) => apiClient.getList('/admin/stock-transactions', params),
}
