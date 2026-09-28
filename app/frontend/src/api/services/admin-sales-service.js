// Service de administración de ventas (US7/T067): listado con filtros,
// detalle y cambio de estado (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const adminSalesService = {
  // Devuelve `{ items, meta }` porque el listado es paginado y la pantalla
  // quiere saber el total.
  list: (params) =>
    apiClient
      .request({ method: 'GET', url: '/admin/sales', params })
      .then((response) => ({ items: response.data, meta: response.meta })),
  get: (saleId) => apiClient.get(`/admin/sales/${saleId}`),
  updateStatus: (saleId, status) =>
    apiClient.patch(`/admin/sales/${saleId}/status`, { status }),
}
