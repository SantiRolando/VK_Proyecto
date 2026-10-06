/*
  Compras del cliente: crear la venta, ver las propias y validar el cupón del checkout.
*/

import { apiClient } from '@api/client/api-client.js'

export const salesService = {
  create: (payload) => apiClient.post('/sales', payload),
  listMine: () => apiClient.get('/me/sales'),
  getMine: (saleId) => apiClient.get(`/me/sales/${saleId}`),
  validateCoupon: (payload) => apiClient.post('/coupons/validate', payload),
}
