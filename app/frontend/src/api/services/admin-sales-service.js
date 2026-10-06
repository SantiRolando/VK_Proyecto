// Administración de ventas: listado con filtros, detalle y cambio de estado.

import { apiClient } from '@api/client/api-client.js'

export const adminSalesService = {
  list: (params) => apiClient.getList('/admin/sales', params),
  get: (saleId) => apiClient.get(`/admin/sales/${saleId}`),
  updateStatus: (saleId, status) =>
    apiClient.patch(`/admin/sales/${saleId}/status`, { status }),
}
